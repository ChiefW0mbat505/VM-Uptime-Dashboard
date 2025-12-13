# VM-Extension-Monitor

Serverless React application to monitor and alert on Azure VM extensions compliance across multiple subscriptions.

## Architecture

- **Frontend**: React SPA hosted on Azure Static Web Apps
- **Backend**: Azure Functions (Node.js 20 LTS)
- **Storage**: Azure Cosmos DB (serverless tier)
- **Authentication**: Azure AD
- **Monitoring**: Application Insights

## Features

- ✅ Monitor VM extensions across multiple Azure subscriptions
- ✅ Alert on missing required extensions
- ✅ Exclude specific Resource Groups or VMs from monitoring
- ✅ Add comments/notes per machine or resource group
- ✅ 7-day and 30-day compliance views
- ✅ Real-time dashboard with filtering
- ✅ TLS 1.2+ enforced across all services

## Required VM Extensions

The following extensions are monitored:
- Azure Monitor Agent (AzureMonitorWindowsAgent / AzureMonitorLinuxAgent)
- Microsoft Antimalware (IaaSAntimalware)
- Azure Security Agent
- Log Analytics Agent (deprecated but still monitored)

## Prerequisites

- Node.js 20 LTS or later
- Azure CLI 2.54.0 or later
- Azure subscription with Owner or Contributor access
- PowerShell 7.4 or later

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Subscriptions

Create a `subscriptions.txt` file in the `config` directory with one subscription ID per line:

```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### 3. Deploy Infrastructure

```bash
# Login to Azure
az login

# Deploy resources
cd infrastructure
./deploy.ps1
```

### 4. Run Locally

```bash
# Start backend
cd backend
npm start

# Start frontend (in new terminal)
cd frontend
npm start
```

## Deployment

```bash
cd infrastructure
./deploy-production.ps1
```

## Configuration

All resources are tagged with:
- Owner=CloudOps
- Team=CloudOps
- Workload=ExtensionsMonitoring
- Domain=Infrastructure
- Environment=Prod

## Security

- TLS 1.2+ enforced on all Azure resources
- Azure AD authentication required
- CORS restricted to Static Web App domain
- Managed Identity for Azure service authentication
- Secrets stored in Azure Key Vault

## License

Internal use only - Cignium
