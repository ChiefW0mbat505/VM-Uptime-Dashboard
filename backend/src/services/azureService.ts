import { DefaultAzureCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';
import { ResourceManagementClient } from '@azure/arm-resources';
import { SubscriptionClient } from '@azure/arm-subscriptions';
import { REQUIRED_EXTENSIONS } from '../types';
import type { VirtualMachine, VMExtension } from '../types';

export class AzureService {
  private credential: DefaultAzureCredential;

  constructor() {
    this.credential = new DefaultAzureCredential();
  }

  async getSubscriptions(subscriptionIds: string[]): Promise<Array<{ id: string; name: string }>> {
    const client = new SubscriptionClient(this.credential);
    const subscriptions: Array<{ id: string; name: string }> = [];

    for (const subId of subscriptionIds) {
      try {
        const sub = await client.subscriptions.get(subId);
        if (sub && sub.subscriptionId && sub.displayName) {
          subscriptions.push({
            id: sub.subscriptionId,
            name: sub.displayName
          });
        }
      } catch (error) {
        console.error(`Error fetching subscription ${subId}:`, error);
      }
    }

    return subscriptions;
  }

  async scanSubscription(subscriptionId: string, subscriptionName: string): Promise<VirtualMachine[]> {
    const computeClient = new ComputeManagementClient(this.credential, subscriptionId);
    const vms: VirtualMachine[] = [];

    try {
      // Get all VMs in the subscription
      for await (const vm of computeClient.virtualMachines.listAll()) {
        if (!vm.id || !vm.name) continue;

        const resourceGroup = this.extractResourceGroup(vm.id);
        const osType = vm.storageProfile?.osDisk?.osType as 'Windows' | 'Linux' || 'Windows';

        // Get instance view for power state
        const instanceView = await computeClient.virtualMachines.instanceView(
          resourceGroup,
          vm.name
        );

        const powerState = this.extractPowerState(instanceView);

        // Get extensions
        const extensionsResponse = await computeClient.virtualMachineExtensions.list(
          resourceGroup,
          vm.name
        );

        const extensions: VMExtension[] = extensionsResponse.map(ext => ({
          name: ext.name || '',
          publisher: ext.publisher || '',
          type: ext.typePropertiesType || '',
          version: ext.typeHandlerVersion || '',
          provisioningState: ext.provisioningState || '',
          autoUpgradeMinorVersion: ext.autoUpgradeMinorVersion || false
        }));

        // Check compliance
        const requiredForOS = REQUIRED_EXTENSIONS.filter(req => req.osType === osType);
        const missingExtensions = requiredForOS
          .filter(req => !extensions.some(ext => ext.type === req.type))
          .map(req => req.name);

        vms.push({
          id: vm.id,
          name: vm.name,
          resourceGroup,
          subscription: subscriptionId,
          subscriptionName,
          location: vm.location || '',
          osType,
          powerState,
          extensions,
          missingExtensions,
          isCompliant: missingExtensions.length === 0,
          lastChecked: new Date().toISOString(),
          excluded: false
        });
      }
    } catch (error) {
      console.error(`Error scanning subscription ${subscriptionId}:`, error);
    }

    return vms;
  }

  private extractResourceGroup(resourceId: string): string {
    const match = resourceId.match(/resourceGroups\/([^\/]+)/i);
    return match ? match[1] : '';
  }

  private extractPowerState(instanceView: any): string {
    if (!instanceView.statuses) return 'Unknown';
    
    const powerStatus = instanceView.statuses.find((status: any) =>
      status.code?.startsWith('PowerState/')
    );

    return powerStatus ? powerStatus.code.replace('PowerState/', '') : 'Unknown';
  }

  async getResourceGroups(subscriptionId: string): Promise<string[]> {
    const resourceClient = new ResourceManagementClient(this.credential, subscriptionId);
    const resourceGroups: string[] = [];

    try {
      for await (const rg of resourceClient.resourceGroups.list()) {
        if (rg.name) {
          resourceGroups.push(rg.name);
        }
      }
    } catch (error) {
      console.error(`Error getting resource groups for ${subscriptionId}:`, error);
    }

    return resourceGroups;
  }
}

export const azureService = new AzureService();
