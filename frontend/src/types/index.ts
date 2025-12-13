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

export interface RequiredExtension {
  name: string;
  publisher: string;
  type: string;
  osType: 'Windows' | 'Linux' | 'Both';
  description: string;
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

export interface ComplianceStats {
  totalVMs: number;
  compliantVMs: number;
  nonCompliantVMs: number;
  excludedVMs: number;
  totalResourceGroups: number;
  compliantResourceGroups: number;
  nonCompliantResourceGroups: number;
  excludedResourceGroups: number;
  lastScanTime: string;
}

export interface AlertConfig {
  enabled: boolean;
  emailRecipients: string[];
  webhookUrl?: string;
  alertOnNewNonCompliance: boolean;
  alertOnStateChange: boolean;
}

export interface ScanResult {
  scanId: string;
  startTime: string;
  endTime: string;
  status: 'running' | 'completed' | 'failed';
  subscriptionsScanned: number;
  vmsScanned: number;
  errors: string[];
}
