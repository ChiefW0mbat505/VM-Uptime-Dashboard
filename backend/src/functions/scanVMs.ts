import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from '@azure/functions';
import { azureService } from '../services/azureService';
import { cosmosDb } from '../services/cosmosDb';

interface ScanResult {
  scanId: string;
  startTime: string;
  endTime: string;
  status: 'running' | 'completed' | 'failed';
  subscriptionsScanned: number;
  vmsScanned: number;
  errors: string[];
}

async function getSubscriptionIds(): Promise<string[]> {
  // Read from App Configuration or environment variable
  const appConfigEndpoint = process.env.APP_CONFIG_ENDPOINT;
  
  // For now, use environment variable (App Configuration integration can be added later)
  const envSubs = process.env.SUBSCRIPTION_IDS || '';
  const subscriptionIds = envSubs.split(',').map(s => s.trim()).filter(s => s);
  
  if (subscriptionIds.length === 0) {
    console.warn('No subscription IDs configured. Set SUBSCRIPTION_IDS in App Configuration or environment.');
  }
  
  return subscriptionIds;
}

async function performScan(): Promise<ScanResult> {
  const scanId = `scan_${Date.now()}`;
  const startTime = new Date().toISOString();
  const result: ScanResult = {
    scanId,
    startTime,
    endTime: '',
    status: 'running',
    subscriptionsScanned: 0,
    vmsScanned: 0,
    errors: []
  };

  try {
    const subscriptionIds = await getSubscriptionIds();
    
    if (subscriptionIds.length === 0) {
      result.errors.push('No subscription IDs configured');
      result.status = 'failed';
      result.endTime = new Date().toISOString();
      return result;
    }

    const subscriptions = await azureService.getSubscriptions(subscriptionIds);

    for (const subscription of subscriptions) {
      try {
        console.log(`Scanning subscription: ${subscription.name} (${subscription.id})`);
        
        const vms = await azureService.scanSubscription(subscription.id, subscription.name);
        
        // Get existing exclusions
        const exclusions = await cosmosDb.getExclusions();
        const excludedVmIds = new Set(
          exclusions
            .filter(e => e.type === 'vm')
            .map(e => e.resourceId)
        );
        const excludedRgNames = new Set(
          exclusions
            .filter(e => e.type === 'resourceGroup')
            .map(e => e.resourceName)
        );

        // Apply exclusions and save VMs
        for (const vm of vms) {
          vm.excluded = excludedVmIds.has(vm.id) || excludedRgNames.has(vm.resourceGroup);
          await cosmosDb.saveVM(vm);
        }

        result.vmsScanned += vms.length;
        result.subscriptionsScanned++;

        // Aggregate resource group stats
        const rgMap = new Map<string, any>();
        for (const vm of vms) {
          const key = `${vm.subscription}_${vm.resourceGroup}`;
          if (!rgMap.has(key)) {
            rgMap.set(key, {
              id: `/subscriptions/${vm.subscription}/resourceGroups/${vm.resourceGroup}`,
              name: vm.resourceGroup,
              subscription: vm.subscription,
              subscriptionName: vm.subscriptionName,
              vmCount: 0,
              compliantVMs: 0,
              nonCompliantVMs: 0,
              excluded: excludedRgNames.has(vm.resourceGroup)
            });
          }

          const rg = rgMap.get(key);
          rg.vmCount++;
          if (!vm.excluded) {
            if (vm.isCompliant) {
              rg.compliantVMs++;
            } else {
              rg.nonCompliantVMs++;
            }
          }
        }

        // Save resource groups
        for (const rg of rgMap.values()) {
          await cosmosDb.saveResourceGroup(rg);
        }

      } catch (error: any) {
        const errorMsg = `Error scanning subscription ${subscription.name}: ${error.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.status = result.errors.length === 0 ? 'completed' : 'failed';
    result.endTime = new Date().toISOString();

    // Save scan result
    await cosmosDb.upsertDocument({
      id: scanId,
      partitionKey: 'scan',
      type: 'scanResult',
      ...result
    });

  } catch (error: any) {
    result.status = 'failed';
    result.errors.push(error.message);
    result.endTime = new Date().toISOString();
  }

  return result;
}

// Timer trigger function - runs every 6 hours
export async function scanVMsTimer(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('VM Extensions scan timer triggered');
  
  const result = await performScan();
  
  context.log(`Scan completed: ${result.status}`);
  context.log(`Scanned ${result.subscriptionsScanned} subscriptions, ${result.vmsScanned} VMs`);
  if (result.errors.length > 0) {
    context.log('Errors:', result.errors);
  }
}

app.timer('scanVMsTimer', {
  schedule: '0 0 */6 * * *', // Every 6 hours
  handler: scanVMsTimer
});

// HTTP trigger to manually trigger scan
export async function triggerScan(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Manual scan triggered');
  
  const result = await performScan();
  
  return {
    status: 200,
    jsonBody: result
  };
}

app.http('triggerScan', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'scan/trigger',
  handler: triggerScan
});

// Get scan status
export async function getScanStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const scanId = request.params.scanId;
  
  if (!scanId) {
    return { status: 400, jsonBody: { error: 'Scan ID required' } };
  }

  const result = await cosmosDb.getDocument(scanId, 'scan');
  
  if (!result) {
    return { status: 404, jsonBody: { error: 'Scan not found' } };
  }

  return {
    status: 200,
    jsonBody: result
  };
}

app.http('getScanStatus', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'scan/{scanId}',
  handler: getScanStatus
});

// Get latest scan
export async function getLatestScan(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const scans = await cosmosDb.queryDocuments(
    'SELECT * FROM c WHERE c.type = "scanResult" ORDER BY c.startTime DESC OFFSET 0 LIMIT 1'
  );

  if (scans.length === 0) {
    return { status: 404, jsonBody: { error: 'No scans found' } };
  }

  return {
    status: 200,
    jsonBody: scans[0]
  };
}

app.http('getLatestScan', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'scan/latest',
  handler: getLatestScan
});
