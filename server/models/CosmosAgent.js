const { CosmosClient } = require('@azure/cosmos');

class CosmosAgent {
  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
    
    this.client = new CosmosClient({ endpoint, key });
    this.database = this.client.database(databaseName);
    this.container = this.database.container('sago-web-agents');
  }

  async findOne(query) {
    try {
      const { resources } = await this.container.items
        .query(query)
        .fetchAll();
      
      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error finding agent:', error);
      throw error;
    }
  }

  async findByName(name) {
    return this.findOne({
      query: 'SELECT * FROM c WHERE c.name = @name',
      parameters: [{ name: '@name', value: name }]
    });
  }

  async create(agentData) {
    try {
      const agent = {
        id: agentData.name, // Use name as id for Cosmos DB
        name: agentData.name,
        system_prompt: agentData.system_prompt,
        createdAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.create(agent);
      return resource;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async upsert(agentData) {
    try {
      const agent = {
        id: agentData.name,
        name: agentData.name,
        system_prompt: agentData.system_prompt,
        createdAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(agent);
      return resource;
    } catch (error) {
      console.error('Error upserting agent:', error);
      throw error;
    }
  }

  async deleteMany(query = {}) {
    try {
      // For Cosmos DB, we'll delete all items in the container
      const { resources } = await this.container.items
        .query('SELECT * FROM c')
        .fetchAll();
      
      if (resources.length === 0) {
        console.log('ℹ️  No agents to delete');
        return { deletedCount: 0 };
      }
      
      for (const item of resources) {
        try {
          await this.container.item(item.id, item.name).delete();
        } catch (deleteError) {
          if (deleteError.code === 404) {
            console.log(`ℹ️  Agent ${item.id} already deleted`);
          } else {
            throw deleteError;
          }
        }
      }
      
      return { deletedCount: resources.length };
    } catch (error) {
      console.error('Error deleting agents:', error);
      throw error;
    }
  }
}

module.exports = CosmosAgent;
