# Deploy Backend Functions
# This script deploys the Azure Functions backend

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "../infrastructure/deployment-config.json"
)

$ErrorActionPreference = "Stop"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Deploying Backend Functions" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if config exists
if (-not (Test-Path $ConfigFile)) {
    Write-Host "ERROR: Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "Please run the infrastructure deployment first." -ForegroundColor Yellow
    exit 1
}

# Load configuration
$config = Get-Content $ConfigFile | ConvertFrom-Json
$functionAppName = $config.FunctionApp

Write-Host "Function App: $functionAppName" -ForegroundColor Yellow
Write-Host ""

# Build the project
Write-Host "Building backend..." -ForegroundColor Green
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

# Deploy to Azure
Write-Host "Deploying to Azure..." -ForegroundColor Green
func azure functionapp publish $functionAppName --typescript

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Function App URL: $($config.FunctionUrl)" -ForegroundColor White
Write-Host ""
Write-Host "Test the API:" -ForegroundColor Yellow
Write-Host "  Trigger scan: Invoke-RestMethod -Uri '$($config.FunctionUrl)/api/scan/trigger' -Method Post" -ForegroundColor White
Write-Host "  Get VMs: Invoke-RestMethod -Uri '$($config.FunctionUrl)/api/vms' -Method Get" -ForegroundColor White
Write-Host ""
