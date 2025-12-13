# VM-Extension-Monitor - Quick Reference

## 🚀 Quick Deploy

```powershell
# 1. Setup check
.\setup.ps1

# 2. Deploy infrastructure
.\infrastructure\deploy.ps1 -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" -Location "eastus"

# 3. Configure subscriptions (via Azure Portal or PowerShell)
# Portal: Function App → Configuration → SUBSCRIPTION_IDS
# Or use PowerShell:
# Update-AzFunctionAppSetting -Name "VM-Extension-Monitor-func" -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" -AppSetting @{"SUBSCRIPTION_IDS"="sub1,sub2,sub3"} -Force

# 4. Deploy backend
cd backend
.\deploy.ps1

# 5. Deploy frontend
cd ..\frontend
.\deploy.ps1

# 6. Test
Invoke-RestMethod -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/scan/trigger" -Method Post
```

## 📍 Key URLs

| Service | URL |
|---------|-----|
| Frontend | https://VM-Extension-Monitor-web.azurestaticapps.net |
| API | https://VM-Extension-Monitor-func.azurewebsites.net/api |
| Resource Group | RGRP-Cloudops-VMExtension-monitor |

## 🔧 Common Commands

### Manage Subscriptions
```powershell
# Add/Update
Update-AzFunctionAppSetting `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func" `
    -AppSetting @{ "SUBSCRIPTION_IDS" = "sub1,sub2" } `
    -Force

# View
$app = Get-AzWebApp -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" -Name "VM-Extension-Monitor-func"
$app.SiteConfig.AppSettings | Where-Object { $_.Name -eq "SUBSCRIPTION_IDS" }
```

### Trigger Scan
```powershell
Invoke-RestMethod -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/scan/trigger" -Method Post
```

### View Data
```powershell
# All VMs
Invoke-RestMethod -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/vms" -Method Get

# Stats
Invoke-RestMethod -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/compliance/stats" -Method Get
```

### View Logs
```powershell
func azure functionapp logstream VM-Extension-Monitor-func
```

## 📋 Required Extensions

### Windows
- Azure Monitor Agent (AzureMonitorWindowsAgent)
- Microsoft Antimalware (IaaSAntimalware)  
- Azure Security Agent (AzureSecurityWindowsAgent)

### Linux
- Azure Monitor Agent (AzureMonitorLinuxAgent)
- Azure Security Agent (AzureSecurityLinuxAgent)

## 🏷️ Resource Tags

```
Owner=CloudOps
Team=CloudOps
Workload=ExtensionsMonitoring
Domain=Infrastructure
Environment=Prod
```

## 📚 Documentation

- **Full Deployment Guide**: docs/DEPLOYMENT.md
- **User Guide**: docs/USER_GUIDE.md
- **Configuration Details**: DEPLOYMENT_CONFIG.md
- **JIRA Ticket**: SYSOPS-37568
