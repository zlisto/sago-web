const express = require('express');
const router = express.Router();
const CosmosChatSession = require('../models/CosmosChatSession');
const CosmosAgent = require('../models/CosmosAgent');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

// Helper function to encode image to base64
const encodeImage = (imagePath) => {
  const fs = require('fs');
  return fs.readFileSync(imagePath, { encoding: 'base64' });
};

// POST /chat
router.post('/', async (req, res) => {
  const { sessionId, username, member, message, imageData, imageMimeType } = req.body;
  console.log('Chat request received:', { sessionId, username, member, message: message?.substring(0, 100), hasImageData: !!imageData });
  try {
    // Initialize Cosmos DB models
    const chatSessionModel = new CosmosChatSession();
    const agentModel = new CosmosAgent();
    
    // Get or create session
    let session = await chatSessionModel.findBySessionId(sessionId);
    if (!session) {
      session = await chatSessionModel.create({ sessionId, username, member, messages: [] });
    }
    
    // Get system prompt from Agent collection
    const agent = await agentModel.findByName(member);
    const systemPrompt = agent ? agent.system_prompt : '';
    // Log the first few lines of the system prompt for verification
    if (systemPrompt) {
      const head = systemPrompt.slice(0, 200);
      console.log('--- SYSTEM PROMPT (first 200 chars) ---\n' + head + '\n--- END SYSTEM PROMPT HEAD ---');
    } else {
      console.log('No system prompt found for agent:', member);
    }
    
    // Prepare messages array
    const messages = [];
    
    // Add system prompt
    if (systemPrompt) {
      messages.push({ 
        role: 'system', 
        content: systemPrompt 
      });
    }
    
    // Add chat history
    session.messages.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // Handle user message with or without image
    if (imageData) {
      // User message with image - Azure OpenAI supports vision models
      messages.push({ 
        role: 'user', 
        content: [
          { type: 'text', text: message || "Here is the image" },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
        ]
      });
      console.log('Added image message with', imageData.length, 'characters of base64 data');
    } else {
      // Text-only user message
      messages.push({ 
        role: 'user', 
        content: message 
      });
      console.log('Added text-only message');
    }
    
    // Use Azure OpenAI Chat Completions API
    console.log('Sending request to Azure OpenAI with', messages.length, 'messages');

    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
    });

    console.log('Azure OpenAI response received');
    
    // Add user message to session (handle both text and image messages)
    if (imageData) {
      // For image messages, save both text and image data
      session.messages.push({ 
        role: 'user', 
        content: message || "Sent an image",
        imageData: imageData, // Store the base64 image data
        imageMimeType: imageMimeType || 'image/png', // Store the MIME type
        timestamp: new Date().toISOString()
      });
    } else {
      // For text messages, save the actual message
      session.messages.push({ 
        role: 'user', 
        content: message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get the assistant's response
    const assistantResponse = response.choices[0]?.message?.content || '';
    session.messages.push({ 
      role: 'assistant', 
      content: assistantResponse,
      timestamp: new Date().toISOString()
    });
    
    await chatSessionModel.save(session);
    res.json({ reply: assistantResponse });
  } catch (err) {
    console.error('Chat error:', err);
    console.error('Error details:', {
      message: err.message,
      status: err.status,
      code: err.code,
      type: err.type
    });
    res.status(500).json({ 
      error: err.message,
      details: err.status || err.code || 'Unknown error'
    });
  }
});

// POST /chat/stream - Server-Sent Events streaming reply
router.post('/stream', async (req, res) => {
  const { sessionId, username, member, message, imageData, imageMimeType } = req.body;
  console.log('Chat (stream) request received:', { sessionId, username, member, message: message?.substring(0, 100), hasImageData: !!imageData });
  try {
    // Initialize Cosmos DB models
    const chatSessionModel = new CosmosChatSession();
    const agentModel = new CosmosAgent();

    // Get or create session
    let session = await chatSessionModel.findBySessionId(sessionId);
    if (!session) {
      session = await chatSessionModel.create({ sessionId, username, member, messages: [] });
    }

    // Get system prompt
    const agent = await agentModel.findByName(member);
    const systemPrompt = agent ? agent.system_prompt : '';

    // Prepare messages
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    session.messages.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });
    if (imageData) {
      messages.push({ 
        role: 'user', 
        content: [
          { type: 'text', text: message || 'Here is the image' },
          { type: 'image_url', image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageData}` } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // SSE headers (and disable proxy buffering)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    // Send helper
    const send = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Kick off stream so clients attach listeners
    res.write(': ok\n\n');

    // Stream from Azure OpenAI
    const stream = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages,
      temperature: 0.7,
      stream: true,
    });

    // Save the user message to session immediately
    if (imageData) {
      session.messages.push({ 
        role: 'user', 
        content: message || 'Sent an image',
        imageData,
        imageMimeType: imageMimeType || 'image/jpeg',
        timestamp: new Date().toISOString()
      });
    } else {
      session.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    }

    let fullText = '';
    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        send({ delta });
      }
    }

    // End of stream
    send({ done: true });

    // Persist assistant message
    session.messages.push({ role: 'assistant', content: fullText, timestamp: new Date().toISOString() });
    await chatSessionModel.save(session);

    res.end();
  } catch (err) {
    console.error('Streaming chat error:', err);
    try {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (_) {}
    res.end();
  }
});

module.exports = router;
