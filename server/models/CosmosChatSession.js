const { CosmosClient } = require('@azure/cosmos');

class CosmosChatSession {
  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
    
    this.client = new CosmosClient({ endpoint, key });
    this.database = this.client.database(databaseName);
    this.container = this.database.container('sago-web-messages');
  }

  async findOne(query) {
    try {
      const { resources } = await this.container.items
        .query(query)
        .fetchAll();
      
      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error finding chat session:', error);
      throw error;
    }
  }

  async findBySessionId(sessionId) {
    return this.findOne({
      query: 'SELECT * FROM c WHERE c.sessionId = @sessionId',
      parameters: [{ name: '@sessionId', value: sessionId }]
    });
  }

  async create(sessionData) {
    try {
      const session = {
        id: sessionData.sessionId, // Use sessionId as id for Cosmos DB
        sessionId: sessionData.sessionId,
        username: sessionData.username,
        member: sessionData.member,
        createdAt: new Date().toISOString(),
        messages: sessionData.messages || []
      };

      const { resource } = await this.container.items.create(session);
      return resource;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  async save(sessionData) {
    try {
      const session = {
        id: sessionData.sessionId,
        sessionId: sessionData.sessionId,
        username: sessionData.username,
        member: sessionData.member,
        createdAt: sessionData.createdAt || new Date().toISOString(),
        messages: sessionData.messages || []
      };

      const { resource } = await this.container.items.upsert(session);
      return resource;
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw error;
    }
  }

  async findByIdAndUpdate(sessionId, updateData) {
    try {
      const existingSession = await this.findBySessionId(sessionId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      const updatedSession = {
        ...existingSession,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(updatedSession);
      return resource;
    } catch (error) {
      console.error('Error updating chat session:', error);
      throw error;
    }
  }

  async deleteMany(query = {}) {
    try {
      // For Cosmos DB, we'll delete all items in the container
      const { resources } = await this.container.items
        .query('SELECT * FROM c')
        .fetchAll();
      
      for (const item of resources) {
        await this.container.item(item.id, item.sessionId).delete();
      }
      
      return { deletedCount: resources.length };
    } catch (error) {
      console.error('Error deleting chat sessions:', error);
      throw error;
    }
  }
}

module.exports = CosmosChatSession;
