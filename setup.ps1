# Quick Setup Script for VM-Extension-Monitor
# Run this script to prepare for deployment to RGRP-Cloudops-VMExtension-monitor

param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionIds = ""
)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "VM-Extension-Monitor - Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$resourceGroup = "RGRP-Cloudops-VMExtension-monitor"
$location = "eastus"

Write-Host "Target Resource Group: $resourceGroup" -ForegroundColor Yellow
Write-Host "Location: $location" -ForegroundColor Yellow
Write-Host ""

# Check Azure login
Write-Host "Checking Azure login..." -ForegroundColor Green
try {
    $context = Get-AzContext -ErrorAction Stop
    Write-Host "✓ Logged in as: $($context.Account)" -ForegroundColor Green
    Write-Host "  Subscription: $($context.Subscription.Name)" -ForegroundColor Gray
} catch {
    Write-Host "Not logged in to Azure. Please run: Connect-AzAccount" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if resource group exists
Write-Host "Checking resource group..." -ForegroundColor Green
$rg = Get-AzResourceGroup -Name $resourceGroup -ErrorAction SilentlyContinue

if ($rg) {
    Write-Host "✓ Resource group exists" -ForegroundColor Green
    Write-Host "  Location: $($rg.Location)" -ForegroundColor Gray
} else {
    Write-Host "! Resource group does not exist" -ForegroundColor Yellow
    Write-Host "  It will be created during deployment" -ForegroundColor Gray
}

Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Green

$prereqsMet = $true

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    $prereqsMet = $false
}

# Azure Functions Core Tools
try {
    $funcVersion = func --version
    Write-Host "✓ Azure Functions Core Tools: $funcVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure Functions Core Tools not found" -ForegroundColor Red
    $prereqsMet = $false
}

# Azure PowerShell
try {
    $azModule = Get-Module -Name Az -ListAvailable | Select-Object -First 1
    if ($azModule) {
        Write-Host "✓ Azure PowerShell: $($azModule.Version)" -ForegroundColor Green
    } else {
        Write-Host "✗ Azure PowerShell (Az module) not found" -ForegroundColor Red
        $prereqsMet = $false
    }
} catch {
    Write-Host "✗ Azure PowerShell (Az module) not found" -ForegroundColor Red
    $prereqsMet = $false
}

Write-Host ""

if (-not $prereqsMet) {
    Write-Host "ERROR: Missing prerequisites. Please install required tools." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install instructions:" -ForegroundColor Yellow
    Write-Host "  Node.js: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  Azure Functions: npm install -g azure-functions-core-tools@4" -ForegroundColor Gray
    Write-Host "  Azure PowerShell: Install-Module -Name Az -Repository PSGallery -Force" -ForegroundColor Gray
    exit 1
}

# Subscription IDs
if ($SubscriptionIds) {
    Write-Host "Subscription IDs provided: $SubscriptionIds" -ForegroundColor Green
    $subArray = $SubscriptionIds -split ","
    Write-Host "  Will monitor $($subArray.Count) subscription(s)" -ForegroundColor Gray
} else {
    Write-Host "! No subscription IDs provided" -ForegroundColor Yellow
    Write-Host "  You can add them after deployment via Azure Portal or PowerShell:" -ForegroundColor Gray
    Write-Host "  Update Function App settings in Azure Portal under Configuration" -ForegroundColor Gray
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Ready to Deploy!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run deployment: .\\infrastructure\\deploy.ps1 -ResourceGroupName '$resourceGroup' -Location '$location'" -ForegroundColor White
Write-Host "  2. Configure subscriptions in Azure App Configuration" -ForegroundColor White
Write-Host "  3. Deploy backend: cd backend && .\\deploy.ps1" -ForegroundColor White
Write-Host "  4. Deploy frontend: cd frontend && .\\deploy.ps1" -ForegroundColor White
Write-Host ""
