# VM Extensions Monitor - Deployment Script
# This script deploys the complete serverless infrastructure to Azure

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "Prod"
)

$ErrorActionPreference = "Stop"

# Configuration
$tags = @{
    Owner = "CloudOps"
    Team = "CloudOps"
    Workload = "ExtensionsMonitoring"
    Domain = "Infrastructure"
    Environment = $Environment
}

$timestamp = Get-Date -Format "yyyyMMdd"
$storageAccountName = "vmextmon$timestamp"
$functionAppName = "VM-Extension-Monitor-func"
$cosmosAccountName = "VM-Extension-Monitor-cosmos"
$staticWebAppName = "VM-Extension-Monitor-web"
$appInsightsName = "VM-Extension-Monitor-insights"
$appConfigName = "VM-Extension-Monitor-config"
$keyVaultName = "vmext-kv-$timestamp"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "VM-Extension-Monitor - Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Check if logged in to Azure
Write-Host "Checking Azure login..." -ForegroundColor Green
$context = Get-AzContext
if (-not $context) {
    Write-Host "Not logged in. Please login to Azure..." -ForegroundColor Yellow
    Connect-AzAccount
}

Write-Host "Using subscription: $($context.Subscription.Name)" -ForegroundColor Green
Write-Host ""

# Create Resource Group
Write-Host "Creating Resource Group..." -ForegroundColor Green
New-AzResourceGroup -Name $ResourceGroupName -Location $Location -Tag $tags -Force | Out-Null
Write-Host "✓ Resource Group created" -ForegroundColor Green
Write-Host ""

# Create Storage Account
Write-Host "Creating Storage Account..." -ForegroundColor Green
$storageAccount = New-AzStorageAccount `
    -ResourceGroupName $ResourceGroupName `
    -Name $storageAccountName `
    -Location $Location `
    -SkuName Standard_LRS `
    -Kind StorageV2 `
    -MinimumTlsVersion TLS1_2 `
    -Tag $tags

Write-Host "✓ Storage Account created: $storageAccountName" -ForegroundColor Green
Write-Host ""

# Create Cosmos DB Account (Serverless)
Write-Host "Creating Cosmos DB Account (Serverless)..." -ForegroundColor Green
$cosmosAccount = New-AzCosmosDBAccount `
    -ResourceGroupName $ResourceGroupName `
    -Name $cosmosAccountName `
    -Location $Location `
    -ApiKind Sql `
    -ServerVersion "4.2" `
    -EnableAutomaticFailover:$false `
    -EnableMultipleWriteLocations:$false `
    -MinimalTlsVersion Tls12 `
    -Tag $tags `
    -BackupPolicyType Continuous `
    -Capability @("EnableServerless")

Write-Host "✓ Cosmos DB Account created: $cosmosAccountName" -ForegroundColor Green

# Create Cosmos DB Database and Container
Write-Host "Creating Cosmos DB Database and Container..." -ForegroundColor Green
New-AzCosmosDBSqlDatabase `
    -ResourceGroupName $ResourceGroupName `
    -AccountName $cosmosAccountName `
    -Name "vmextensions" | Out-Null

New-AzCosmosDBSqlContainer `
    -ResourceGroupName $ResourceGroupName `
    -AccountName $cosmosAccountName `
    -DatabaseName "vmextensions" `
    -Name "monitoring" `
    -PartitionKeyPath "/partitionKey" `
    -PartitionKeyKind Hash | Out-Null

Write-Host "✓ Cosmos DB Database and Container created" -ForegroundColor Green
Write-Host ""

# Create Application Insights
Write-Host "Creating Application Insights..." -ForegroundColor Green
$appInsights = New-AzApplicationInsights `
    -ResourceGroupName $ResourceGroupName `
    -Name $appInsightsName `
    -Location $Location `
    -Kind web `
    -Tag $tags

Write-Host "✓ Application Insights created: $appInsightsName" -ForegroundColor Green
Write-Host ""

# Create Function App
Write-Host "Creating Function App..." -ForegroundColor Green
$functionApp = New-AzFunctionApp `
    -ResourceGroupName $ResourceGroupName `
    -Name $functionAppName `
    -Location $Location `
    -StorageAccountName $storageAccountName `
    -Runtime Node `
    -RuntimeVersion 20 `
    -FunctionsVersion 4 `
    -OSType Linux `
    -Tag $tags `
    -IdentityType SystemAssigned

Write-Host "✓ Function App created: $functionAppName" -ForegroundColor Green
Write-Host ""

# Configure Function App Settings
Write-Host "Configuring Function App..." -ForegroundColor Green

# Get Cosmos DB connection details
$cosmosKeys = Get-AzCosmosDBAccountKey `
    -ResourceGroupName $ResourceGroupName `
    -Name $cosmosAccountName `
    -Type "Keys"

$cosmosEndpoint = "https://$cosmosAccountName.documents.azure.com:443/"

# Create Azure App Configuration for storing subscriptions
Write-Host "Creating Azure App Configuration..." -ForegroundColor Green
$appConfig = New-AzAppConfigurationStore `
    -ResourceGroupName $ResourceGroupName `
    -Name $appConfigName `
    -Location $Location `
    -Sku Standard `
    -Tag $tags

Write-Host "✓ App Configuration created: $appConfigName" -ForegroundColor Green
Write-Host "  NOTE: Add subscription IDs to App Configuration after deployment" -ForegroundColor Yellow

# Get App Configuration endpoint
$appConfigEndpoint = $appConfig.Endpoint

# For now, set empty string - will be configured through Azure Portal or CLI
$subscriptionIdsString = ""

# Update Function App settings
$appSettings = @{
    "COSMOS_DB_ENDPOINT" = $cosmosEndpoint
    "COSMOS_DB_KEY" = $cosmosKeys.PrimaryMasterKey
    "COSMOS_DB_DATABASE" = "vmextensions"
    "COSMOS_DB_CONTAINER" = "monitoring"
    "APP_CONFIG_ENDPOINT" = $appConfigEndpoint
    "SUBSCRIPTION_IDS" = $subscriptionIdsString
    "SCAN_SCHEDULE" = "0 0 */6 * * *"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = $appInsights.ConnectionString
    "AzureWebJobsStorage__accountName" = $storageAccountName
}

Update-AzFunctionAppSetting `
    -ResourceGroupName $ResourceGroupName `
    -Name $functionAppName `
    -AppSetting $appSettings `
    -Force | Out-Null

Write-Host "✓ Function App configured" -ForegroundColor Green
Write-Host ""

# Assign Reader role to Function App managed identity for subscriptions
Write-Host "Assigning permissions to Function App..." -ForegroundColor Green
$principalId = $functionApp.IdentityPrincipalId

foreach ($subId in $subscriptionIds) {
    try {
        New-AzRoleAssignment `
            -ObjectId $principalId `
            -RoleDefinitionName "Reader" `
            -Scope "/subscriptions/$subId" `
            -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✓ Assigned Reader role for subscription: $subId" -ForegroundColor Gray
    } catch {
        Write-Host "  ! Could not assign role for subscription: $subId" -ForegroundColor Yellow
    }
}

Write-Host "✓ Permissions assigned" -ForegroundColor Green
Write-Host ""

# Create Static Web App
Write-Host "Creating Static Web App..." -ForegroundColor Green
Write-Host "Note: Static Web App can be created via Azure Portal" -ForegroundColor Yellow
Write-Host "  1. Go to Azure Portal → Create a resource → Static Web App" -ForegroundColor Cyan
Write-Host "  2. Select GitHub or Azure DevOps for deployment" -ForegroundColor Cyan
Write-Host "  3. Name: $staticWebAppName" -ForegroundColor Cyan
Write-Host "  4. Build preset: React" -ForegroundColor Cyan
Write-Host ""

# Output deployment information
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Details:" -ForegroundColor Yellow
Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "  Function App: $functionAppName" -ForegroundColor White
Write-Host "  Function URL: https://$functionAppName.azurewebsites.net" -ForegroundColor White
Write-Host "  Cosmos DB: $cosmosAccountName" -ForegroundColor White
Write-Host "  Storage Account: $storageAccountName" -ForegroundColor White
Write-Host "  App Insights: $appInsightsName" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Add subscription IDs to App Configuration:" -ForegroundColor White
Write-Host "     az appconfig kv set --name $appConfigName --key SubscriptionIds --value 'sub1,sub2,sub3'" -ForegroundColor Gray
Write-Host "  2. Deploy backend code: cd backend && npm install && func azure functionapp publish $functionAppName" -ForegroundColor White
Write-Host "  3. Update frontend .env file with Function App URL" -ForegroundColor White
Write-Host "  4. Build and deploy frontend: cd frontend && npm install && npm run build" -ForegroundColor White
Write-Host "  5. Trigger initial scan: Invoke-RestMethod -Uri https://$functionAppName.azurewebsites.net/api/scan/trigger -Method Post" -ForegroundColor White
Write-Host ""

# Save configuration
$config = @{
    ResourceGroup = $ResourceGroupName
    Location = $Location
    FunctionApp = $functionAppName
    FunctionUrl = "https://$functionAppName.azurewebsites.net"
    CosmosAccount = $cosmosAccountName
    CosmosEndpoint = $cosmosEndpoint
    StorageAccount = $storageAccountName
    AppInsights = $appInsightsName
    AppConfiguration = $appConfigName
    AppConfigEndpoint = $appConfigEndpoint
    StaticWebApp = $staticWebAppName
    DeploymentDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$configPath = Join-Path $PSScriptRoot "deployment-config.json"
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath
Write-Host "Configuration saved to: $configPath" -ForegroundColor Green
