export interface VMExtension {
  name: string;
  publisher: string;
  type: string;
  version: string;
  provisioningState: string;
  autoUpgradeMinorVersion: boolean;
}

export interface VirtualMachine {
  id: string;
  name: string;
  resourceGroup: string;
  subscription: string;
  subscriptionName: string;
  location: string;
  osType: 'Windows' | 'Linux';
  powerState: string;
  extensions: VMExtension[];
  missingExtensions: string[];
  isCompliant: boolean;
  lastChecked: string;
  excluded: boolean;
  comment?: string;
}

export interface ResourceGroup {
  id: string;
  name: string;
  subscription: string;
  subscriptionName: string;
  vmCount: number;
  compliantVMs: number;
  nonCompliantVMs: number;
  excluded: boolean;
  comment?: string;
}

export interface Exclusion {
  id: string;
  type: 'vm' | 'resourceGroup';
  resourceId: string;
  resourceName: string;
  subscription: string;
  comment: string;
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
}

export interface RequiredExtension {
  name: string;
  publisher: string;
  type: string;
  osType: 'Windows' | 'Linux';
}

export const REQUIRED_EXTENSIONS: RequiredExtension[] = [
  {
    name: 'Azure Monitor Agent',
    publisher: 'Microsoft.Azure.Monitor',
    type: 'AzureMonitorWindowsAgent',
    osType: 'Windows'
  },
  {
    name: 'Azure Monitor Agent',
    publisher: 'Microsoft.Azure.Monitor',
    type: 'AzureMonitorLinuxAgent',
    osType: 'Linux'
  },
  {
    name: 'Microsoft Antimalware',
    publisher: 'Microsoft.Azure.Security',
    type: 'IaaSAntimalware',
    osType: 'Windows'
  },
  {
    name: 'Azure Security Agent',
    publisher: 'Microsoft.Azure.Security.Monitoring',
    type: 'AzureSecurityWindowsAgent',
    osType: 'Windows'
  },
  {
    name: 'Azure Security Agent',
    publisher: 'Microsoft.Azure.Security.Monitoring',
    type: 'AzureSecurityLinuxAgent',
    osType: 'Linux'
  }
];

export const TAGS = {
  Owner: 'CloudOps',
  Team: 'CloudOps',
  Workload: 'ExtensionsMonitoring',
  Domain: 'Infrastructure',
  Environment: 'Prod'
};
