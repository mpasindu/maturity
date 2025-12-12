/**
 * Test Bedrock Knowledge Base Integration
 * Tests the Retrieve and Generate API with KB ID: 62SNELZOFE
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID;
const KB_ID = process.env.BEDROCK_KB_ID;

console.log('🧪 Testing Bedrock Knowledge Base Integration...\n');
console.log('Configuration:');
console.log('  Region:', REGION);
console.log('  Model ID:', MODEL_ID);
console.log('  KB ID:', KB_ID);
console.log('  API Key:', API_KEY ? `${API_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('');

const testQuestion = 'What are the AWS Well-Architected Framework pillars?';

const payload = JSON.stringify({
  input: {
    text: testQuestion,
  },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: KB_ID,
      modelArn: `arn:aws:bedrock:${REGION}::foundation-model/${MODEL_ID}`,
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 5,
        },
      },
    },
  },
});

const options = {
  hostname: `bedrock-agent-runtime.${REGION}.amazonaws.com`,
  port: 443,
  path: '/retrieveAndGenerate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
};

console.log('Endpoint:', `https://${options.hostname}${options.path}`);
console.log('Question:', testQuestion);
console.log('\nSending request...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');

    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ SUCCESS!\n');
        console.log('Claude Response:', response.output?.text || 'No text in response');
        console.log('');
        
        if (response.citations && response.citations.length > 0) {
          console.log('📚 Citations:');
          response.citations.forEach((citation, idx) => {
            console.log(`\nCitation ${idx + 1}:`);
            console.log('  Retrieved Text:', citation.retrievedReferences?.[0]?.content?.text?.substring(0, 200) + '...');
            console.log('  Location:', citation.retrievedReferences?.[0]?.location);
          });
        } else {
          console.log('No citations returned (KB may need indexing or query didn\'t match)');
        }
        
        console.log('\nSession ID:', response.sessionId || 'No session ID');
      } else {
        console.log('❌ ERROR!\n');
        console.log('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(payload);
req.end();
