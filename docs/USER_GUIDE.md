# User Guide - VM Extensions Monitor

## Overview

The VM Extensions Monitor is a dashboard application that helps you track Azure VM extension compliance across multiple subscriptions. It alerts you when virtual machines are missing required extensions and allows you to manage exclusions and add notes.

## Accessing the Dashboard

Navigate to your deployed Static Web App URL:
```
https://VM-Extension-Monitor-web.azurestaticapps.net
```

## Dashboard Features

### 1. Compliance Statistics

The top of the dashboard shows key metrics:

- **Total VMs**: Total number of virtual machines being monitored
- **Compliant**: VMs with all required extensions installed
- **Non-Compliant**: VMs missing one or more required extensions
- **Excluded**: VMs or Resource Groups excluded from monitoring
- **Compliance Rate**: Percentage of non-excluded VMs that are compliant

### 2. Time Range Selector

Switch between views:
- **Last 7 Days**: Show VMs checked in the last week
- **Last 30 Days**: Show VMs checked in the last month

Click **Refresh** to manually trigger an update.

### 3. Virtual Machines List

The main table displays all monitored VMs with the following columns:

#### Status Icon
- 🟢 **Green checkmark**: VM is compliant (all required extensions present)
- 🔴 **Red X**: VM is non-compliant (missing extensions)
- ⚫ **Gray circle**: VM is excluded from monitoring

#### VM Name
The name of the virtual machine

#### Resource Group
The Azure resource group containing the VM

#### Subscription
The Azure subscription name

#### OS
Operating system type (Windows or Linux)

#### Power State
Current power state (Running, Stopped, Deallocated, etc.)

#### Missing Extensions
- Shows "All present" for compliant VMs
- Shows "X missing" with tooltip listing missing extensions for non-compliant VMs
- Shows "Excluded" for excluded VMs

#### Last Checked
Date and time of the last compliance check

#### Comment
- View existing comments
- Click **Edit** icon to add or modify comments
- Click **Save** (checkmark) to save changes
- Click **Cancel** (X) to discard changes

#### Excluded
- Checkbox to exclude/include this VM from monitoring
- Excluded VMs won't trigger alerts or affect compliance stats

## Working with Exclusions

### Why Exclude Resources?

You may want to exclude VMs or Resource Groups from monitoring for various reasons:
- **Archived VMs**: Machines that are powered off for archival purposes
- **Testing/Development**: Non-production environments with different requirements
- **Special Configurations**: VMs with custom monitoring solutions
- **Dynamic Resource Groups**: Groups that are created/destroyed frequently

### How to Exclude a VM

1. Find the VM in the list
2. Check the **Excluded** checkbox in the last column
3. The status will update to show the VM is excluded

### How to Exclude a Resource Group

Currently, Resource Group exclusions must be added through the API:

```powershell
$body = @{
    type = "resourceGroup"
    resourceId = "/subscriptions/<sub-id>/resourceGroups/<rg-name>"
    resourceName = "<rg-name>"
    subscription = "<sub-id>"
    comment = "Reason for exclusion"
    createdBy = "your-name@domain.com"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/exclusions" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Adding Comments

Comments help document why a VM or Resource Group has certain status:

**Best practices for comments:**
- Document exclusion reasons: "Archived project VM"
- Note temporary issues: "Extensions will be added after maintenance window"
- Track ownership: "Contact John Doe for this VM"
- Reference tickets: "See JIRA SYSOPS-12345"

**To add a comment:**
1. Click the **Edit** icon in the Comment column
2. Type your comment
3. Click the **Save** (checkmark) icon

## Required Extensions

The monitor checks for these extensions based on OS type:

### Windows VMs
- **Azure Monitor Agent** (AzureMonitorWindowsAgent)
- **Microsoft Antimalware** (IaaSAntimalware)
- **Azure Security Agent** (AzureSecurityWindowsAgent)

### Linux VMs
- **Azure Monitor Agent** (AzureMonitorLinuxAgent)
- **Azure Security Agent** (AzureSecurityLinuxAgent)

## Understanding Compliance States

### ✅ Compliant
- All required extensions for the VM's OS type are installed
- Extensions are in "Succeeded" provisioning state
- No action needed

### ❌ Non-Compliant
- One or more required extensions are missing
- **Action Required**: Install missing extensions

### ⚫ Excluded
- VM or its Resource Group has been excluded from monitoring
- Does not affect compliance statistics
- No alerts will be generated

## Common Scenarios

### Scenario 1: New VM is Non-Compliant

**What to do:**
1. Review the "Missing Extensions" column
2. Install the required extensions via Azure Portal, PowerShell, or ARM templates
3. Wait for the next scan (runs every 6 hours) or trigger a manual scan
4. Verify the VM becomes compliant

### Scenario 2: Archived VM Showing as Non-Compliant

**What to do:**
1. Check the **Excluded** checkbox for the VM
2. Add a comment: "Archived - Project XYZ completed"
3. The VM will no longer affect compliance statistics

### Scenario 3: Entire Resource Group Should be Excluded

**What to do:**
1. Use the API to add a Resource Group exclusion (see above)
2. Add a descriptive comment explaining why
3. All VMs in the Resource Group will be automatically excluded

### Scenario 4: VM is Compliant but Shows as Non-Compliant

**Possible causes:**
- Extension was recently installed (wait for next scan)
- Extension provisioning is still in progress
- Extension name doesn't match expected format

**What to do:**
1. Click **Refresh** to get latest data
2. Check the VM in Azure Portal to verify extensions
3. If issue persists, add a comment and contact CloudOps team

## Scheduling and Scans

### Automatic Scans

The system automatically scans all configured subscriptions:
- **Frequency**: Every 6 hours
- **Schedule**: 00:00, 06:00, 12:00, 18:00 UTC
- **Duration**: Depends on number of subscriptions and VMs

### Manual Scans

Trigger a scan immediately:

**Via PowerShell:**
```powershell
Invoke-RestMethod `
    -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/scan/trigger" `
    -Method Post
```

**Check scan status:**
```powershell
Invoke-RestMethod `
    -Uri "https://VM-Extension-Monitor-func.azurewebsites.net/api/scan/latest" `
    -Method Get
```

## Filtering and Viewing Data

### Time Range Filters

Use the time range selector to focus on recently scanned VMs:

- **7 Days**: Best for active monitoring and quick overview
- **30 Days**: Better for trend analysis and catching intermittent issues

### Sorting

Click column headers to sort by:
- VM Name (alphabetically)
- Resource Group
- Subscription
- Compliance Status
- Last Checked date

## Alerts and Notifications

*(Feature planned for future release)*

The system will support:
- Email alerts for new non-compliance issues
- Daily/weekly compliance reports
- Webhook integration for custom notifications
- Teams/Slack integration

## Tips and Best Practices

### 1. Regular Review
- Check the dashboard weekly
- Review non-compliant VMs and take action
- Keep exclusion comments up to date

### 2. Exclusion Management
- Only exclude VMs with valid reasons
- Document all exclusions with clear comments
- Periodically review exclusions to ensure they're still needed

### 3. Proactive Monitoring
- Use 7-day view for daily operations
- Use 30-day view for monthly reviews
- Track compliance rate trends over time

### 4. Extension Installation
- Use Azure Policy to auto-deploy extensions to new VMs
- Include extension deployment in VM provisioning scripts
- Test extensions in dev/test environments first

### 5. Documentation
- Use comments to document special cases
- Reference JIRA tickets in comments
- Note responsible teams/contacts

## Troubleshooting

### Dashboard Not Loading

1. Check browser console for errors
2. Verify network connectivity
3. Clear browser cache and reload
4. Try a different browser

### No Data Showing

1. Verify at least one scan has completed
2. Check Function App logs for errors
3. Verify subscriptions are configured correctly
4. Ensure Function App has proper permissions

### Changes Not Appearing

1. Click **Refresh** button
2. Wait for next automatic scan
3. Check if changes were saved (look for success message)

### API Errors

1. Check Function App status in Azure Portal
2. Review Application Insights logs
3. Verify Cosmos DB is accessible
4. Contact CloudOps team if issue persists

## Support

For questions, issues, or feature requests:

- **Team**: CloudOps
- **Email**: cloudops@cignium.com
- **JIRA**: Create ticket in SYSOPS project

## Appendix: API Reference

### Get All VMs
```
GET /api/vms?timeRange=7
```

### Get Single VM
```
GET /api/vms/{vmId}
```

### Update VM Comment
```
PATCH /api/vms/{vmId}/comment
Body: { "comment": "Your comment here" }
```

### Get Resource Groups
```
GET /api/resource-groups
```

### Get Compliance Stats
```
GET /api/compliance/stats?timeRange=7
```

### Get Exclusions
```
GET /api/exclusions
```

### Add Exclusion
```
POST /api/exclusions
Body: {
  "type": "vm|resourceGroup",
  "resourceId": "full-resource-id",
  "resourceName": "resource-name",
  "subscription": "subscription-id",
  "comment": "Reason for exclusion",
  "createdBy": "user@domain.com"
}
```

### Remove Exclusion
```
DELETE /api/exclusions/{exclusionId}
```

### Trigger Scan
```
POST /api/scan/trigger
```

### Get Latest Scan
```
GET /api/scan/latest
```
