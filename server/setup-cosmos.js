require('dotenv').config({ path: '../.env' });
const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseName = process.env.COSMOS_DB_DATABASE_NAME;

console.log('🔍 Cosmos DB Configuration:');
console.log('   Endpoint:', endpoint);
console.log('   Database:', databaseName);
console.log('   Key:', key ? `${key.substring(0, 10)}...` : 'Not provided');

if (!endpoint || !key || !databaseName) {
  console.error('❌ Missing required environment variables:');
  console.error('   COSMOS_DB_ENDPOINT:', endpoint ? '✅' : '❌');
  console.error('   COSMOS_DB_KEY:', key ? '✅' : '❌');
  console.error('   COSMOS_DB_DATABASE_NAME:', databaseName ? '✅' : '❌');
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });

async function setupCosmosDB() {
  try {
    console.log('\n🚀 Setting up Cosmos DB...');

    // Create database if it doesn't exist
    console.log('📊 Creating/verifying database...');
    const { database } = await client.databases.createIfNotExists({
      id: databaseName
    });
    console.log('✅ Database ready:', database.id);

    // Create sago-web-messages container
    console.log('📦 Creating sago-web-messages container...');
    const { container: messagesContainer } = await database.containers.createIfNotExists({
      id: 'sago-web-messages',
      partitionKey: { path: '/sessionId' },
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [
          { path: '/*' }
        ],
        excludedPaths: [
          { path: '/content/*' }
        ]
      }
    });
    console.log('✅ Messages container ready:', messagesContainer.id);

    // Create sago-web-agents container
    console.log('📦 Creating sago-web-agents container...');
    const { container: agentsContainer } = await database.containers.createIfNotExists({
      id: 'sago-web-agents',
      partitionKey: { path: '/name' },
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [
          { path: '/*' }
        ]
      }
    });
    console.log('✅ Agents container ready:', agentsContainer.id);

    // Test connection by inserting a test document
    console.log('\n🧪 Testing connection...');
    
    // Test agents container
    const testAgent = {
      id: 'test-agent',
      name: 'test-agent',
      system_prompt: 'This is a test agent',
      createdAt: new Date().toISOString()
    };
    
    await agentsContainer.items.upsert(testAgent);
    console.log('✅ Test agent inserted successfully');
    
    // Test messages container
    const testMessage = {
      id: 'test-session',
      sessionId: 'test-session',
      username: 'test-user',
      member: 'test-agent',
      createdAt: new Date().toISOString(),
      messages: [
        {
          role: 'user',
          content: 'Hello test',
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: 'Hello! This is a test response.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    await messagesContainer.items.upsert(testMessage);
    console.log('✅ Test message session inserted successfully');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await agentsContainer.item('test-agent', 'test-agent').delete();
      console.log('✅ Test agent deleted');
    } catch (error) {
      console.log('ℹ️  Test agent already cleaned up');
    }
    
    try {
      await messagesContainer.item('test-session', 'test-session').delete();
      console.log('✅ Test message session deleted');
    } catch (error) {
      console.log('ℹ️  Test message session already cleaned up');
    }

    console.log('\n🎉 Cosmos DB setup completed successfully!');
    console.log('   Database:', databaseName);
    console.log('   Containers: sago-web-messages, sago-web-agents');
    console.log('   Ready for Sago chat app!');

  } catch (error) {
    console.error('❌ Error setting up Cosmos DB:', error);
    process.exit(1);
  }
}

setupCosmosDB();
