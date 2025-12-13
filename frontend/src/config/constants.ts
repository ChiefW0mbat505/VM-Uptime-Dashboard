export const REQUIRED_EXTENSIONS = [
  {
    name: 'Azure Monitor Agent',
    publisher: 'Microsoft.Azure.Monitor',
    type: 'AzureMonitorWindowsAgent',
    osType: 'Windows' as const,
    description: 'Collects monitoring data and sends it to Azure Monitor'
  },
  {
    name: 'Azure Monitor Agent',
    publisher: 'Microsoft.Azure.Monitor',
    type: 'AzureMonitorLinuxAgent',
    osType: 'Linux' as const,
    description: 'Collects monitoring data and sends it to Azure Monitor'
  },
  {
    name: 'Microsoft Antimalware',
    publisher: 'Microsoft.Azure.Security',
    type: 'IaaSAntimalware',
    osType: 'Windows' as const,
    description: 'Microsoft Antimalware protection for Azure VMs'
  },
  {
    name: 'Azure Security Agent',
    publisher: 'Microsoft.Azure.Security.Monitoring',
    type: 'AzureSecurityWindowsAgent',
    osType: 'Windows' as const,
    description: 'Azure Security Center monitoring agent'
  },
  {
    name: 'Azure Security Agent',
    publisher: 'Microsoft.Azure.Security.Monitoring',
    type: 'AzureSecurityLinuxAgent',
    osType: 'Linux' as const,
    description: 'Azure Security Center monitoring agent'
  }
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const AZURE_AD_CONFIG = {
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
  authority: import.meta.env.VITE_AZURE_AUTHORITY || '',
  redirectUri: window.location.origin,
  scopes: ['User.Read']
};

export const TAGS = {
  Owner: 'CloudOps',
  Team: 'CloudOps',
  Workload: 'ExtensionsMonitoring',
  Domain: 'Infrastructure',
  Environment: 'Prod'
};

export const TIME_RANGES = {
  SEVEN_DAYS: 7,
  THIRTY_DAYS: 30
} as const;
