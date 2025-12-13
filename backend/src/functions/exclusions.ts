import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDb } from '../services/cosmosDb';

// Get all exclusions
export async function getExclusions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const exclusions = await cosmosDb.getExclusions();
    
    return {
      status: 200,
      jsonBody: exclusions
    };
  } catch (error: any) {
    context.error('Error getting exclusions:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to retrieve exclusions' }
    };
  }
}

app.http('getExclusions', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'exclusions',
  handler: getExclusions
});

// Add exclusion
export async function addExclusion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const { type, resourceId, resourceName, subscription, comment, createdBy } = body;

    if (!type || !resourceId || !resourceName || !subscription || !createdBy) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' }
      };
    }

    const exclusion = {
      id: `exclusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      resourceId,
      resourceName,
      subscription,
      comment: comment || '',
      createdBy,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    await cosmosDb.saveExclusion(exclusion);

    // Update affected VMs or resource groups
    if (type === 'vm') {
      const docId = resourceId.replace(/\//g, '_');
      const vm = await cosmosDb.getDocument(docId, subscription);
      if (vm) {
        vm.excluded = true;
        await cosmosDb.upsertDocument(vm);
      }
    } else if (type === 'resourceGroup') {
      const vms = await cosmosDb.queryDocuments(
        'SELECT * FROM c WHERE c.type = "vm" AND c.resourceGroup = @rgName AND c.subscription = @sub',
        [
          { name: '@rgName', value: resourceName },
          { name: '@sub', value: subscription }
        ]
      );

      for (const vm of vms) {
        vm.excluded = true;
        await cosmosDb.upsertDocument(vm);
      }
    }

    return {
      status: 201,
      jsonBody: exclusion
    };
  } catch (error: any) {
    context.error('Error adding exclusion:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to add exclusion' }
    };
  }
}

app.http('addExclusion', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'exclusions',
  handler: addExclusion
});

// Remove exclusion
export async function removeExclusion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const exclusionId = request.params.exclusionId;
    
    if (!exclusionId) {
      return { status: 400, jsonBody: { error: 'Exclusion ID required' } };
    }

    // Get the exclusion first to know which resources to update
    const exclusions = await cosmosDb.queryDocuments(
      'SELECT * FROM c WHERE c.type = "exclusion" AND c.id = @id',
      [{ name: '@id', value: exclusionId }]
    );

    if (exclusions.length === 0) {
      return { status: 404, jsonBody: { error: 'Exclusion not found' } };
    }

    const exclusion = exclusions[0];

    // Delete the exclusion
    await cosmosDb.deleteDocument(exclusionId, exclusion.subscription);

    // Update affected VMs or resource groups
    if (exclusion.type === 'vm') {
      const docId = exclusion.resourceId.replace(/\//g, '_');
      const vm = await cosmosDb.getDocument(docId, exclusion.subscription);
      if (vm) {
        vm.excluded = false;
        await cosmosDb.upsertDocument(vm);
      }
    } else if (exclusion.type === 'resourceGroup') {
      const vms = await cosmosDb.queryDocuments(
        'SELECT * FROM c WHERE c.type = "vm" AND c.resourceGroup = @rgName AND c.subscription = @sub',
        [
          { name: '@rgName', value: exclusion.resourceName },
          { name: '@sub', value: exclusion.subscription }
        ]
      );

      for (const vm of vms) {
        vm.excluded = false;
        await cosmosDb.upsertDocument(vm);
      }
    }

    return {
      status: 200,
      jsonBody: { message: 'Exclusion removed successfully' }
    };
  } catch (error: any) {
    context.error('Error removing exclusion:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to remove exclusion' }
    };
  }
}

app.http('removeExclusion', {
  methods: ['DELETE'],
  authLevel: 'function',
  route: 'exclusions/{exclusionId}',
  handler: removeExclusion
});

// Update exclusion comment
export async function updateExclusion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const exclusionId = request.params.exclusionId;
    
    if (!exclusionId) {
      return { status: 400, jsonBody: { error: 'Exclusion ID required' } };
    }

    const body = await request.json() as any;
    const { comment } = body;

    const exclusions = await cosmosDb.queryDocuments(
      'SELECT * FROM c WHERE c.type = "exclusion" AND c.id = @id',
      [{ name: '@id', value: exclusionId }]
    );

    if (exclusions.length === 0) {
      return { status: 404, jsonBody: { error: 'Exclusion not found' } };
    }

    const exclusion = exclusions[0];
    exclusion.comment = comment;
    exclusion.modifiedAt = new Date().toISOString();
    
    await cosmosDb.upsertDocument(exclusion);

    return {
      status: 200,
      jsonBody: exclusion
    };
  } catch (error: any) {
    context.error('Error updating exclusion:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to update exclusion' }
    };
  }
}

app.http('updateExclusion', {
  methods: ['PATCH'],
  authLevel: 'function',
  route: 'exclusions/{exclusionId}',
  handler: updateExclusion
});
