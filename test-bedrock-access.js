/**
 * Quick test to verify AWS Bedrock access
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Parse Bedrock API Key
function parseBedrockApiKey(apiKey) {
  try {
    const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
    const [accessKeyId, secretAccessKey] = decoded.split(':');
    return { accessKeyId, secretAccessKey };
  } catch (error) {
    console.error('Failed to parse API key:', error);
    return null;
  }
}

let credentials;
if (process.env.BEDROCK_API_KEY) {
  console.log('Using BEDROCK_API_KEY authentication');
  credentials = parseBedrockApiKey(process.env.BEDROCK_API_KEY);
  if (!credentials) {
    console.error('❌ Invalid BEDROCK_API_KEY format');
    process.exit(1);
  }
} else {
  console.log('Using AWS credentials');
  credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  };
}

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials,
});

async function testBedrockAccess() {
  console.log('🧪 Testing AWS Bedrock Access...\n');
  console.log('Region:', process.env.AWS_REGION);
  
  if (process.env.BEDROCK_API_KEY) {
    const parsed = parseBedrockApiKey(process.env.BEDROCK_API_KEY);
    console.log('API Key Access ID:', parsed?.accessKeyId?.substring(0, 20) + '...');
  } else {
    console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...');
  }
  
  console.log('Model:', process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0');
  console.log('');

  try {
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    
    // Simple test message
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say hello in exactly 5 words.',
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    console.log('📤 Sending request to Bedrock...');
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('✅ SUCCESS!\n');
    console.log('Claude Response:', responseBody.content[0].text);
    console.log('\n🎉 Bedrock integration is working correctly!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Model not found or access not granted.');
      console.error('Go to AWS Console → Bedrock → Model Access');
      console.error('Request access to: Claude 3.5 Sonnet v2');
    } else if (error.name === 'UnrecognizedClientException') {
      console.error('\n⚠️  Invalid AWS credentials.');
      console.error('Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    } else if (error.name === 'AccessDeniedException') {
      console.error('\n⚠️  Access denied.');
      console.error('Your IAM role needs bedrock:InvokeModel permission');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testBedrockAccess();
