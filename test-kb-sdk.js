/**
 * Test Bedrock Knowledge Base with AWS SDK
 * Requires AWS credentials (not just API key)
 */

const { 
  BedrockAgentRuntimeClient, 
  RetrieveAndGenerateCommand 
} = require('@aws-sdk/client-bedrock-agent-runtime');

require('dotenv').config({ path: '.env.local' });

const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID;
const KB_ID = process.env.BEDROCK_KB_ID;

console.log('🧪 Testing Bedrock Knowledge Base with AWS SDK...\n');
console.log('Configuration:');
console.log('  Region:', REGION);
console.log('  Model ID:', MODEL_ID);
console.log('  KB ID:', KB_ID);
console.log('  AWS Credentials:', process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Not configured');
console.log('');

const testQuestion = 'What are the AWS Well-Architected Framework pillars?';

async function testKB() {
  try {
    const client = new BedrockAgentRuntimeClient({ region: REGION });
    
    const input = {
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
    };

    console.log('Question:', testQuestion);
    console.log('\nSending request to KB...\n');

    const command = new RetrieveAndGenerateCommand(input);
    const response = await client.send(command);
    
    console.log('✅ SUCCESS!\n');
    console.log('Claude Response:', response.output?.text || 'No response text');
    console.log('');
    
    if (response.citations && response.citations.length > 0) {
      console.log('📚 Citations from Knowledge Base:');
      response.citations.forEach((citation, idx) => {
        console.log(`\nCitation ${idx + 1}:`);
        if (citation.retrievedReferences && citation.retrievedReferences.length > 0) {
          const ref = citation.retrievedReferences[0];
          console.log('  Text:', ref.content?.text?.substring(0, 200) + '...');
          console.log('  Source:', ref.location?.s3Location?.uri || 'Unknown');
        }
      });
    } else {
      console.log('ℹ️  No citations (KB may not have matching content yet)');
    }
    
    console.log('\nSession ID:', response.sessionId || 'No session ID');
    
  } catch (error) {
    console.log('❌ ERROR!\n');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.message?.includes('credentials')) {
      console.log('💡 This error means AWS credentials are not configured.');
      console.log('   Knowledge Base requires proper AWS credentials (not just API key).');
      console.log('');
      console.log('   Options:');
      console.log('   1. Set temporary credentials in .env.local:');
      console.log('      AWS_ACCESS_KEY_ID=ASIA...');
      console.log('      AWS_SECRET_ACCESS_KEY=...');
      console.log('      AWS_SESSION_TOKEN=...');
      console.log('');
      console.log('   2. Configure AWS CLI: aws configure');
      console.log('');
      console.log('   3. Use IAM role (if running on EC2/Lambda)');
      console.log('');
      console.log('   The app will fall back to direct Claude API (without KB) automatically.');
    } else {
      console.log('Full error:', error);
    }
  }
}

testKB();
