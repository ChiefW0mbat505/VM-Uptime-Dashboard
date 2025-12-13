# VM-Extension-Monitor - Deployment Configuration

## Project Information

- **Project Name**: VM-Extension-Monitor
- **Resource Group**: RGRP-Cloudops-VMExtension-monitor
- **Location**: East US
- **Environment**: Production

## Azure Resources

The following resources will be created:

| Resource | Name | Type |
|----------|------|------|
| Function App | VM-Extension-Monitor-func | Azure Functions (Node.js 20) |
| Cosmos DB | VM-Extension-Monitor-cosmos | Cosmos DB (Serverless) |
| Storage Account | vmextmon{timestamp} | Storage Account v2 |
| App Insights | VM-Extension-Monitor-insights | Application Insights |
| App Configuration | VM-Extension-Monitor-config | Azure App Configuration |
| Static Web App | VM-Extension-Monitor-web | Azure Static Web Apps |

## Key Changes

### ✅ Project Naming
- Standardized all references to "VM-Extension-Monitor"
- Updated package names, titles, and headers
- Consistent naming across all resources

### ✅ Resource Group
- Target: `RGRP-Cloudops-VMExtension-monitor`
- All deployment scripts updated to use this resource group

### ✅ Subscription Configuration
- **Before**: Read from local file `C:\ps\subscriptions.txt`
- **After**: Stored in Azure App Configuration
- Configuration method: Azure CLI or Function App settings
- No local file dependencies

### ✅ Configuration Storage
- Added Azure App Configuration resource
- Subscriptions stored as comma-separated values
- Accessible via App Configuration endpoint or environment variables

## Deployment Steps

### 1. Initial Setup
```powershell
cd C:\ps\vm-extensions-monitor
.\setup.ps1
```

### 2. Deploy Infrastructure
```powershell
cd infrastructure
.\deploy.ps1 -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" -Location "eastus" -Environment "Prod"
```

### 3. Configure Subscriptions
```powershell
# Via Azure Portal: Function App → Configuration → SUBSCRIPTION_IDS
# Or via PowerShell:
Update-AzFunctionAppSetting `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func" `
    -AppSetting @{ "SUBSCRIPTION_IDS" = "sub-id-1,sub-id-2,sub-id-3" } `
    -Force
```

### 4. Deploy Backend
```powershell
cd backend
npm install
.\deploy.ps1
```

### 5. Deploy Frontend
```powershell
cd frontend
npm install
.\deploy.ps1
```

### 6. Verify Deployment
```powershell
# Trigger scan
Invoke-RestMethod `
    -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/scan/trigger" `
    -Method Post

# Check results
Invoke-RestMethod `
    -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/vms" `
    -Method Get
```

## URLs

- **Frontend**: https://VM-Extension-Monitor-web.azurestaticapps.net
- **Backend API**: https://VM-Extension-Monitor-func.azurewebsites.net/api
- **App Insights**: Available in Azure Portal

## Environment Variables

### Function App Settings
```
COSMOS_DB_ENDPOINT=https://VM-Extension-Monitor-cosmos.documents.azure.com:443/
COSMOS_DB_KEY={from-deployment}
COSMOS_DB_DATABASE=vmextensions
COSMOS_DB_CONTAINER=monitoring
APP_CONFIG_ENDPOINT=https://VM-Extension-Monitor-config.azconfig.io
SUBSCRIPTION_IDS={comma-separated-list}
SCAN_SCHEDULE=0 0 */6 * * *
APPLICATIONINSIGHTS_CONNECTION_STRING={from-deployment}
```

### Frontend Environment (.env)
```
VITE_API_URL=https://VM-Extension-Monitor-func.azurewebsites.net/api
VITE_AZURE_CLIENT_ID={your-azure-ad-app-id}
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/{tenant-id}
```

## Subscription Management

### Add/Update Subscriptions
```powershell
Update-AzFunctionAppSetting `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func" `
    -AppSetting @{ "SUBSCRIPTION_IDS" = "sub1,sub2,sub3,sub4" } `
    -Force
```

### List Current Subscriptions
```powershell
$app = Get-AzWebApp `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func"
$app.SiteConfig.AppSettings | Where-Object { $_.Name -eq "SUBSCRIPTION_IDS" }
```

## Resource Tags

All resources are tagged with:
```
Owner=CloudOps
Team=CloudOps
Workload=ExtensionsMonitoring
Domain=Infrastructure
Environment=Prod
```

## Security Configuration

- ✅ TLS 1.2+ enforced on all services
- ✅ Managed Identity for Function App
- ✅ Reader role assigned to monitored subscriptions
- ✅ CORS restricted to Static Web App domain
- ✅ Secrets managed via App Configuration and Key Vault

## Monitoring

- Application Insights enabled on Function App
- Automatic logging of all scan operations
- Performance metrics tracked
- Error tracking and alerting available

## Maintenance

### View Logs
```powershell
func azure functionapp logstream VM-Extension-Monitor-func
```

### Check Resource Group
```powershell
Get-AzResource -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" | Format-Table
```

### View Configuration
```powershell
$app = Get-AzWebApp `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func"
$app.SiteConfig.AppSettings | Format-Table Name, Value
```

## Support

- **Team**: CloudOps
- **JIRA**: SYSOPS-37568
- **Documentation**: See docs/DEPLOYMENT.md and docs/USER_GUIDE.md

## Notes

1. No local file dependencies - all configuration in Azure
2. Fully serverless architecture for minimal cost
3. Automatic scanning every 6 hours
4. Can trigger manual scans via API
5. Supports multiple subscription monitoring
6. Resource Group and VM-level exclusions supported
7. Comment system for documentation
