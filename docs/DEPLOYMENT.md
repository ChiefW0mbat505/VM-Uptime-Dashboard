# Deployment Guide - VM Extensions Monitor

This guide walks through deploying the VM Extensions Monitor solution to Azure.

## Prerequisites

Before you begin, ensure you have:

1. **Azure CLI** (v2.54.0 or later)
   ```powershell
   az --version
   ```

2. **Azure PowerShell** (Az module)
   ```powershell
   Get-Module -ListAvailable Az
   ```

3. **Node.js** (v20 LTS or later)
   ```powershell
   node --version
   ```

4. **Azure Functions Core Tools** (v4.x)
   ```powershell
   func --version
   ```

5. **Azure Permissions**
   - Owner or Contributor access to create resources
   - Ability to assign Reader role to subscriptions you want to monitor

## Step 1: Prepare Configuration

### 1.1 Configure Subscriptions

Subscriptions will be configured in Azure App Configuration during deployment.

After deployment, add your subscription IDs using Azure Portal or PowerShell:

**Option 1: Azure Portal**
1. Go to Function App → Configuration → Application settings
2. Update `SUBSCRIPTION_IDS` with comma-separated subscription IDs
3. Click Save

**Option 2: PowerShell**
```powershell
$subscriptionIds = "sub-id-1,sub-id-2,sub-id-3"
Update-AzFunctionAppSetting `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func" `
    -AppSetting @{ "SUBSCRIPTION_IDS" = $subscriptionIds } `
    -Force
```

## Step 2: Deploy Infrastructure

### 2.1 Login to Azure

```powershell
Connect-AzAccount
```

Select the subscription where you want to deploy the monitoring resources:

```powershell
Set-AzContext -Subscription "your-subscription-id"
```

### 2.2 Run Deployment Script

```powershell
cd C:\ps\vm-extensions-monitor\infrastructure

.\deploy.ps1 `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Location "eastus" `
    -Environment "Prod"
```

This script will create:
- ✅ Resource Group with proper tags
- ✅ Storage Account (TLS 1.2+)
- ✅ Cosmos DB (Serverless, TLS 1.2+)
- ✅ Application Insights
- ✅ Function App with System-Assigned Managed Identity
- ✅ Role assignments for subscription access

**Expected Duration:** 5-10 minutes

### 2.3 Verify Deployment

The script will output a configuration file: `deployment-config.json`

Review the deployed resources:
```powershell
Get-AzResource -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" | Format-Table
```

## Step 3: Deploy Backend

### 3.1 Install Dependencies and Build

```powershell
cd C:\ps\vm-extensions-monitor\backend
npm install
```

### 3.2 Deploy to Azure

```powershell
.\deploy.ps1
```

Or manually:
```powershell
npm run build
func azure functionapp publish <function-app-name>
```

### 3.3 Test Backend

Trigger an initial scan:
```powershell
$functionUrl = "https://<function-app-name>.azurewebsites.net"
Invoke-RestMethod -Uri "$functionUrl/api/scan/trigger" -Method Post
```

Check scan status:
```powershell
Invoke-RestMethod -Uri "$functionUrl/api/scan/latest" -Method Get
```

## Step 4: Deploy Frontend

### 4.1 Configure Environment

The deployment script will create `.env` automatically, or update it manually:

```powershell
cd C:\ps\vm-extensions-monitor\frontend
```

Edit `.env`:
```
VITE_API_URL=https://<function-app-name>.azurewebsites.net/api
VITE_AZURE_CLIENT_ID=<your-azure-ad-app-id>
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
```

### 4.2 Build Frontend

```powershell
.\deploy.ps1
```

Or manually:
```powershell
npm install
npm run build
```

### 4.3 Deploy to Azure Static Web Apps

**Option A: Using Azure CLI**

```powershell
az staticwebapp create `
    --name "vmext-monitor-web" `
    --resource-group "rg-vmext-monitor-prod" `
    --location "eastus" `
    --source "." `
    --app-location "dist" `
    --api-location "" `
    --tags Owner=CloudOps Team=CloudOps Workload=ExtensionsMonitoring Domain=Infrastructure Environment=Prod
```

**Option B: Deploy to Storage Account Static Website**

```powershell
# Enable static website hosting
$storageAccount = "<storage-account-name>"
az storage blob service-properties update `
    --account-name $storageAccount `
    --static-website `
    --index-document "index.html"

# Upload files
az storage blob upload-batch `
    --account-name $storageAccount `
    --destination '$web' `
    --source "./dist"
```

### 4.4 Configure CORS

Update Function App CORS settings to allow your frontend domain:

```powershell
az functionapp cors add `
    --name "<function-app-name>" `
    --resource-group "rg-vmext-monitor-prod" `
    --allowed-origins "https://<your-static-web-app>.azurestaticapps.net"
```

## Step 5: Configure Azure AD Authentication (Optional)

### 5.1 Create Azure AD App Registration

```powershell
az ad app create `
    --display-name "VM Extensions Monitor" `
    --sign-in-audience "AzureADMyOrg" `
    --web-redirect-uris "https://<your-frontend-url>"
```

### 5.2 Update Frontend Configuration

Update `.env` with the App ID and Tenant ID from the previous step.

### 5.3 Assign API Permissions

Add required permissions in Azure Portal:
- Microsoft Graph → User.Read

## Step 6: Verify Deployment

### 6.1 Test Backend API

```powershell
$baseUrl = "https://<function-app-name>.azurewebsites.net/api"

# Get VMs
Invoke-RestMethod -Uri "$baseUrl/vms" -Method Get

# Get compliance stats
Invoke-RestMethod -Uri "$baseUrl/compliance/stats" -Method Get

# Get exclusions
Invoke-RestMethod -Uri "$baseUrl/exclusions" -Method Get
```

### 6.2 Test Frontend

Navigate to your Static Web App URL:
```
https://<your-static-web-app>.azurestaticapps.net
```

You should see:
- ✅ Dashboard with VM statistics
- ✅ List of VMs with compliance status
- ✅ 7-day and 30-day view options
- ✅ Ability to exclude VMs/Resource Groups
- ✅ Comment functionality

### 6.3 Verify Automatic Scanning

The Function App is configured to scan every 6 hours automatically. Check logs:

```powershell
func azure functionapp logstream <function-app-name>
```

Or in Azure Portal:
1. Navigate to Function App
2. Click "Monitor" → "Logs"
3. View Application Insights logs

## Step 7: Monitor and Maintain

### 7.1 View Application Insights

```powershell
az monitor app-insights component show `
    --resource-group "rg-vmext-monitor-prod" `
    --app "<app-insights-name>"
```

### 7.2 Set Up Alerts (Optional)

Create alert for non-compliant VMs:

```powershell
az monitor metrics alert create `
    --name "high-non-compliance" `
    --resource-group "rg-vmext-monitor-prod" `
    --scopes "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Insights/components/<app-insights>" `
    --condition "customMetrics/NonCompliantVMs > 10" `
    --description "Alert when more than 10 VMs are non-compliant"
```

### 7.3 Update Subscription List

To add or remove subscriptions:

1. Update Function App settings:

```powershell
$subscriptionIds = "sub1,sub2,sub3,sub4"
Update-AzFunctionAppSetting `
    -ResourceGroupName "RGRP-Cloudops-VMExtension-monitor" `
    -Name "VM-Extension-Monitor-func" `
    -AppSetting @{ "SUBSCRIPTION_IDS" = $subscriptionIds } `
    -Force
```

Or via Azure Portal:
1. Navigate to Function App → Configuration
2. Update the `SUBSCRIPTION_IDS` setting
3. Save and restart

2. Trigger a new scan manually

## Troubleshooting

### Backend Issues

**Problem:** Function App can't access subscriptions

**Solution:** Verify Managed Identity has Reader role:
```powershell
az role assignment list `
    --assignee "<function-app-principal-id>" `
    --scope "/subscriptions/<subscription-id>"
```

**Problem:** Cosmos DB connection errors

**Solution:** Check Function App settings for correct Cosmos DB endpoint and key

### Frontend Issues

**Problem:** API calls failing with CORS errors

**Solution:** Add frontend URL to Function App CORS settings

**Problem:** No data showing in dashboard

**Solution:** 
1. Verify backend API is returning data
2. Check browser console for errors
3. Ensure at least one scan has completed

## Security Recommendations

1. **Restrict Function App Access**
   - Enable Authentication/Authorization in Function App
   - Use Azure AD authentication

2. **Rotate Keys Regularly**
   - Cosmos DB keys
   - Storage Account keys

3. **Enable Monitoring**
   - Application Insights for all components
   - Alert on high error rates
   - Monitor compliance trends

4. **Network Security**
   - Consider using VNet integration
   - Enable Private Endpoints for Cosmos DB

## Cost Optimization

The solution uses serverless resources to minimize costs:

- **Cosmos DB**: Serverless tier (pay per request)
- **Function App**: Consumption plan (pay per execution)
- **Storage**: Standard LRS (low redundancy)
- **Static Web App**: Free tier available

**Estimated Monthly Cost:** $10-50 USD depending on scan frequency and VM count

## Support

For issues or questions, contact the CloudOps team.

**Tags for all resources:**
- Owner=CloudOps
- Team=CloudOps
- Workload=ExtensionsMonitoring
- Domain=Infrastructure
- Environment=Prod
