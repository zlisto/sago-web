require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cosmos DB configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseName = process.env.COSMOS_DB_DATABASE_NAME;

console.log(`🔍 Cosmos DB Configuration:`);
console.log(`   Endpoint: ${endpoint}`);
console.log(`   Database: ${databaseName}`);
console.log(`   Key: ${key ? `${key.substring(0, 10)}...` : 'Not provided'}`);

if (!endpoint || !key || !databaseName) {
  console.error('❌ Missing required environment variables:');
  console.error('   COSMOS_DB_ENDPOINT:', endpoint ? '✅' : '❌');
  console.error('   COSMOS_DB_KEY:', key ? '✅' : '❌');
  console.error('   COSMOS_DB_DATABASE_NAME:', databaseName ? '✅' : '❌');
  process.exit(1);
}

// Initialize Cosmos DB client
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseName);

// Test Cosmos DB connection
async function testCosmosConnection() {
  try {
    await database.read();
    console.log(`🔌 Connected to Cosmos DB database: ${databaseName}`);
    console.log(`📊 Using containers: sago-web-messages, sago-web-agents`);
  } catch (error) {
    console.error('❌ Cosmos DB connection error:', error);
    process.exit(1);
  }
}

testCosmosConnection();

// Import routes
const chatRoutes = require('./routes/chat');
const sessionRoutes = require('./routes/session');
const uploadRoutes = require('./routes/upload');

app.use('/chat', chatRoutes);
app.use('/session', sessionRoutes);
app.use('/upload', uploadRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Database: ${databaseName}`);
  console.log(`   Containers: sago-web-messages, sago-web-agents`);
  console.log(`   API URL: http://localhost:${PORT}`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   POST /session - Create new chat session`);
  console.log(`   POST /chat - Send chat message`);
  console.log(`   POST /upload - Upload file`);
  console.log(`\n✅ Ready to receive requests!\n`);
});
