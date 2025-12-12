/**
 * Test Bedrock API Key with direct HTTP request
 */

const https = require('https');

const API_KEY = 'ABSKQmVkcm9ja0FQSUtleS1zMXJ0LWF0LTQ3NTg4MjM5MTYzMTpZdzNibTl6dGlUYnN5ZGF0dG5IWEZaV09uSWo5STRiNUppMDk2NmpVa2lRaGg2dXQzWVRXYWVCdVRBZz0=';
const REGION = 'us-east-1';
// Use inference profile instead of direct model ID
const MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

const payload = JSON.stringify({
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 100,
  messages: [
    {
      role: 'user',
      content: 'Say hello in exactly 5 words.',
    },
  ],
});

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

console.log('🧪 Testing Bedrock API Key with HTTP request...\n');
console.log('Endpoint:', `https://${options.hostname}${options.path}`);
console.log('');

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ SUCCESS!');
        console.log('Claude Response:', response.content[0].text);
      } catch (error) {
        console.log('\nParsed response but not in expected format');
      }
    } else {
      console.log('\n❌ ERROR: Non-200 status code');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ REQUEST ERROR:', error.message);
  console.error(error);
});

req.write(payload);
req.end();
