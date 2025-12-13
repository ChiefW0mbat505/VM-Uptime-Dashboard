# Deploy Frontend Static Web App
# This script builds and prepares the frontend for deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "../infrastructure/deployment-config.json"
)

$ErrorActionPreference = "Stop"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Building Frontend" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if config exists
if (Test-Path $ConfigFile) {
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    $functionUrl = $config.FunctionUrl
    
    # Create or update .env file
    $envContent = @"
VITE_API_URL=$functionUrl/api
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
"@
    
    $envContent | Set-Content ".env"
    Write-Host "✓ Environment file created" -ForegroundColor Green
} else {
    Write-Host "WARNING: Configuration file not found. Using .env.example" -ForegroundColor Yellow
    if (Test-Path ".env.example" -and -not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
    }
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build the project
Write-Host "Building frontend..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The built files are in: dist/" -ForegroundColor White
Write-Host ""
Write-Host "Deployment Options:" -ForegroundColor Yellow
Write-Host "  1. Azure Static Web Apps (Recommended):" -ForegroundColor White
Write-Host "     az staticwebapp create -n <name> -g <resource-group> -l <location>" -ForegroundColor Gray
Write-Host "     Then use GitHub Actions or Azure CLI to deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Azure Storage Static Website:" -ForegroundColor White
Write-Host "     az storage blob upload-batch -s ./dist -d '\$web' --account-name <storage-account>" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Local Testing:" -ForegroundColor White
Write-Host "     npm run preview" -ForegroundColor Gray
Write-Host ""
