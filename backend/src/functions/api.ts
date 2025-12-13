import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDb } from '../services/cosmosDb';

// Get all VMs
export async function getVMs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const timeRange = request.query.get('timeRange');
    const vms = await cosmosDb.getVMs(timeRange ? parseInt(timeRange) : undefined);
    
    return {
      status: 200,
      jsonBody: vms
    };
  } catch (error: any) {
    context.error('Error getting VMs:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to retrieve VMs' }
    };
  }
}

app.http('getVMs', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'vms',
  handler: getVMs
});

// Get single VM
export async function getVM(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const vmId = request.params.vmId;
    
    if (!vmId) {
      return { status: 400, jsonBody: { error: 'VM ID required' } };
    }

    const decodedId = decodeURIComponent(vmId);
    const docId = decodedId.replace(/\//g, '_');
    
    // Extract subscription from VM ID
    const subMatch = decodedId.match(/subscriptions\/([^\/]+)/);
    if (!subMatch) {
      return { status: 400, jsonBody: { error: 'Invalid VM ID format' } };
    }
    
    const subscription = subMatch[1];
    const vm = await cosmosDb.getDocument(docId, subscription);
    
    if (!vm) {
      return { status: 404, jsonBody: { error: 'VM not found' } };
    }

    return {
      status: 200,
      jsonBody: vm
    };
  } catch (error: any) {
    context.error('Error getting VM:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to retrieve VM' }
    };
  }
}

app.http('getVM', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'vms/{vmId}',
  handler: getVM
});

// Update VM comment
export async function updateVMComment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const vmId = request.params.vmId;
    
    if (!vmId) {
      return { status: 400, jsonBody: { error: 'VM ID required' } };
    }

    const body = await request.json() as any;
    const { comment } = body;

    const decodedId = decodeURIComponent(vmId);
    const docId = decodedId.replace(/\//g, '_');
    
    const subMatch = decodedId.match(/subscriptions\/([^\/]+)/);
    if (!subMatch) {
      return { status: 400, jsonBody: { error: 'Invalid VM ID format' } };
    }
    
    const subscription = subMatch[1];
    const vm = await cosmosDb.getDocument(docId, subscription);
    
    if (!vm) {
      return { status: 404, jsonBody: { error: 'VM not found' } };
    }

    vm.comment = comment;
    await cosmosDb.upsertDocument(vm);

    return {
      status: 200,
      jsonBody: vm
    };
  } catch (error: any) {
    context.error('Error updating VM comment:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to update VM comment' }
    };
  }
}

app.http('updateVMComment', {
  methods: ['PATCH'],
  authLevel: 'function',
  route: 'vms/{vmId}/comment',
  handler: updateVMComment
});

// Get resource groups
export async function getResourceGroups(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const resourceGroups = await cosmosDb.getResourceGroups();
    
    return {
      status: 200,
      jsonBody: resourceGroups
    };
  } catch (error: any) {
    context.error('Error getting resource groups:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to retrieve resource groups' }
    };
  }
}

app.http('getResourceGroups', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'resource-groups',
  handler: getResourceGroups
});

// Update resource group comment
export async function updateResourceGroupComment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const rgId = request.params.rgId;
    
    if (!rgId) {
      return { status: 400, jsonBody: { error: 'Resource Group ID required' } };
    }

    const body = await request.json() as any;
    const { comment } = body;

    const decodedId = decodeURIComponent(rgId);
    const docId = decodedId.replace(/\//g, '_');
    
    const subMatch = decodedId.match(/subscriptions\/([^\/]+)/);
    if (!subMatch) {
      return { status: 400, jsonBody: { error: 'Invalid Resource Group ID format' } };
    }
    
    const subscription = subMatch[1];
    const rg = await cosmosDb.getDocument(docId, subscription);
    
    if (!rg) {
      return { status: 404, jsonBody: { error: 'Resource Group not found' } };
    }

    rg.comment = comment;
    await cosmosDb.upsertDocument(rg);

    return {
      status: 200,
      jsonBody: rg
    };
  } catch (error: any) {
    context.error('Error updating resource group comment:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to update resource group comment' }
    };
  }
}

app.http('updateResourceGroupComment', {
  methods: ['PATCH'],
  authLevel: 'function',
  route: 'resource-groups/{rgId}/comment',
  handler: updateResourceGroupComment
});

// Get compliance stats
export async function getComplianceStats(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const timeRange = request.query.get('timeRange');
    const vms = await cosmosDb.getVMs(timeRange ? parseInt(timeRange) : undefined);
    const resourceGroups = await cosmosDb.getResourceGroups();

    const stats = {
      totalVMs: vms.length,
      compliantVMs: vms.filter(vm => !vm.excluded && vm.isCompliant).length,
      nonCompliantVMs: vms.filter(vm => !vm.excluded && !vm.isCompliant).length,
      excludedVMs: vms.filter(vm => vm.excluded).length,
      totalResourceGroups: resourceGroups.length,
      compliantResourceGroups: resourceGroups.filter(rg => !rg.excluded && rg.nonCompliantVMs === 0).length,
      nonCompliantResourceGroups: resourceGroups.filter(rg => !rg.excluded && rg.nonCompliantVMs > 0).length,
      excludedResourceGroups: resourceGroups.filter(rg => rg.excluded).length,
      lastScanTime: vms.length > 0 ? vms[0].lastChecked : new Date().toISOString()
    };

    return {
      status: 200,
      jsonBody: stats
    };
  } catch (error: any) {
    context.error('Error getting compliance stats:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to retrieve compliance stats' }
    };
  }
}

app.http('getComplianceStats', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'compliance/stats',
  handler: getComplianceStats
});
