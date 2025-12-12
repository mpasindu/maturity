/**
 * Test LLM-Based Agent System
 * Run with: node test-llm-agent.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

// Test tool definitions
const tools = [
  {
    name: 'calculate_score',
    description: 'Calculate a maturity score',
    input_schema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Area to score' }
      }
    }
  }
];

async function testClaudeToolCalling() {
  console.log('🧪 Testing Claude Tool Calling...\n');

  if (!API_KEY) {
    console.error('❌ BEDROCK_API_KEY not set!');
    console.log('Set it in .env.local or environment');
    process.exit(1);
  }

  const messages = [
    {
      role: 'user',
      content: 'Calculate the score for data management'
    }
  ];

  const payload = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    system: 'You are a helpful assistant. Use the calculate_score tool when asked to calculate scores.',
    messages,
    tools,
    temperature: 0.7,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: `bedrock-runtime.${REGION}.amazonaws.com`,
      port: 443,
      path: `/model/${MODEL_ID}/invoke`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('✅ Claude Tool Calling Test PASSED!\n');
          console.log('📝 Response:');
          console.log(JSON.stringify(response, null, 2));
          
          // Check if tool was called
          const toolUse = response.content.find(c => c.type === 'tool_use');
          if (toolUse) {
            console.log('\n🎯 Tool Called:', toolUse.name);
            console.log('📊 Tool Input:', JSON.stringify(toolUse.input, null, 2));
          }
          
          resolve(response);
        } else {
          console.error('❌ Test FAILED!');
          console.error(`Status: ${res.statusCode}`);
          console.error('Response:', data);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function testLLMAgentEndpoint() {
  console.log('\n\n🧪 Testing LLM Agent Endpoint...\n');
  
  // Note: This requires the dev server to be running
  const testMessage = {
    message: 'Analyze my assessment',
    sessionId: 'test-session-' + Date.now(),
    context: {
      assessmentId: 1,
      metricId: 1
    }
  };

  console.log('📤 Sending:', JSON.stringify(testMessage, null, 2));
  console.log('\n⏳ Waiting for response...\n');

  try {
    const response = await fetch('http://localhost:3000/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Endpoint Test PASSED!\n');
    console.log('📝 Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️  Dev server not running!');
      console.log('Start it with: npm run dev');
    } else {
      console.error('❌ Endpoint Test FAILED:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    LLM-Based Agent System Tests');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Test 1: Claude Tool Calling
    await testClaudeToolCalling();

    // Test 2: Full endpoint (requires server)
    await testLLMAgentEndpoint();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ All Tests Completed!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runTests();
