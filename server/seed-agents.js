require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const CosmosAgent = require('./models/CosmosAgent');

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

const agentModel = new CosmosAgent();

// Load system prompt from prompt.txt
const promptPath = path.join(__dirname, 'prompt.txt');
let lisaSystemPrompt = '';
try {
  lisaSystemPrompt = fs.readFileSync(promptPath, 'utf8');
  const head = lisaSystemPrompt.slice(0, 200);
  console.log('Loaded prompt.txt from:', promptPath);
  console.log('--- PROMPT HEAD (first 200 chars) ---\n' + head + '\n--- END PROMPT HEAD ---');
} catch (e) {
  console.error('Failed to read prompt.txt at', promptPath, e);
  process.exit(1);
}

async function seedAgents() {
  try {
    console.log('🚀 Seeding Sago agent to Cosmos DB...');

    // Clear existing agents
    console.log('🧹 Clearing existing agents...');
    await agentModel.deleteMany({});

    // Create Sago agent
    console.log('📝 Creating Sago agent...');
    const sagoAgent = await agentModel.upsert({
      name: 'Sago',
      system_prompt: lisaSystemPrompt,
    });

    console.log('✅ Sago agent created successfully!');
    console.log('   Agent ID:', sagoAgent.id);
    console.log('   System prompt length:', lisaSystemPrompt.length, 'characters');
    console.log('   Created at:', sagoAgent.createdAt);

    console.log('\n🎉 Cosmos DB seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agents:', error);
    process.exit(1);
  }
}

seedAgents();
