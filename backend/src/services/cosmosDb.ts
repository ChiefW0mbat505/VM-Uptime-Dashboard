import { CosmosClient, Database, Container } from '@azure/cosmos';

class CosmosDbService {
  private client: CosmosClient;
  private database: Database | null = null;
  private container: Container | null = null;

  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT || '';
    const key = process.env.COSMOS_DB_KEY || '';
    
    this.client = new CosmosClient({ endpoint, key });
  }

  async initialize(): Promise<void> {
    const databaseId = process.env.COSMOS_DB_DATABASE || 'vmextensions';
    const containerId = process.env.COSMOS_DB_CONTAINER || 'monitoring';

    const { database } = await this.client.databases.createIfNotExists({ id: databaseId });
    this.database = database;

    const { container } = await this.database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ['/partitionKey'] }
    });
    this.container = container;
  }

  async upsertDocument(document: any): Promise<void> {
    if (!this.container) await this.initialize();
    await this.container!.items.upsert(document);
  }

  async getDocument(id: string, partitionKey: string): Promise<any> {
    if (!this.container) await this.initialize();
    try {
      const { resource } = await this.container!.item(id, partitionKey).read();
      return resource;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  async queryDocuments(query: string, parameters?: any[]): Promise<any[]> {
    if (!this.container) await this.initialize();
    const { resources } = await this.container!.items
      .query({ query, parameters })
      .fetchAll();
    return resources;
  }

  async deleteDocument(id: string, partitionKey: string): Promise<void> {
    if (!this.container) await this.initialize();
    await this.container!.item(id, partitionKey).delete();
  }

  async getVMs(timeRange?: number): Promise<any[]> {
    let query = 'SELECT * FROM c WHERE c.type = "vm"';
    const parameters: any[] = [];

    if (timeRange) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      query += ' AND c.lastChecked >= @cutoffDate';
      parameters.push({ name: '@cutoffDate', value: cutoffDate.toISOString() });
    }

    return this.queryDocuments(query, parameters);
  }

  async getResourceGroups(): Promise<any[]> {
    const query = 'SELECT * FROM c WHERE c.type = "resourceGroup"';
    return this.queryDocuments(query);
  }

  async getExclusions(): Promise<any[]> {
    const query = 'SELECT * FROM c WHERE c.type = "exclusion"';
    return this.queryDocuments(query);
  }

  async saveVM(vm: any): Promise<void> {
    const document = {
      ...vm,
      id: vm.id.replace(/\//g, '_'),
      partitionKey: vm.subscription,
      type: 'vm'
    };
    await this.upsertDocument(document);
  }

  async saveResourceGroup(rg: any): Promise<void> {
    const document = {
      ...rg,
      id: rg.id.replace(/\//g, '_'),
      partitionKey: rg.subscription,
      type: 'resourceGroup'
    };
    await this.upsertDocument(document);
  }

  async saveExclusion(exclusion: any): Promise<void> {
    const document = {
      ...exclusion,
      partitionKey: exclusion.subscription,
      type: 'exclusion'
    };
    await this.upsertDocument(document);
  }
}

export const cosmosDb = new CosmosDbService();
