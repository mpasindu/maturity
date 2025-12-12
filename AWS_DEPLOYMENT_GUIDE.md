# AWS Bedrock Deployment Guide

This guide will help you deploy all AWS resources needed to run the Bedrock integration with real AWS services.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js and npm installed
- Python 3.11 installed
- PostgreSQL database accessible from AWS (or use RDS)

## Step 1: Configure AWS CLI

```bash
# Install AWS CLI if not already installed
# macOS:
brew install awscli

# Configure with your credentials
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

## Step 2: Set Up RDS Database (if needed)

If your PostgreSQL database isn't already in AWS:

```bash
# Create RDS PostgreSQL instance with Data API enabled
aws rds create-db-cluster \
  --db-cluster-identifier maturity-assessment-db \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --database-name maturity_assessment \
  --enable-http-endpoint \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=1 \
  --region us-east-1

# Note the cluster ARN for later
```

Or enable Data API on existing RDS cluster:

```bash
aws rds modify-db-cluster \
  --db-cluster-identifier your-cluster-name \
  --enable-http-endpoint \
  --apply-immediately
```

## Step 3: Store Database Credentials in Secrets Manager

```bash
# Create secret for database credentials
aws secretsmanager create-secret \
  --name maturity-db-credentials \
  --description "Database credentials for maturity assessment" \
  --secret-string '{
    "username": "postgres",
    "password": "YourSecurePassword123!",
    "engine": "postgres",
    "host": "your-db-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "maturity_assessment"
  }' \
  --region us-east-1

# Note the secret ARN
```

## Step 4: Create S3 Bucket for Knowledge Base

```bash
# Create S3 bucket for knowledge base documents
aws s3 mb s3://maturity-assessment-kb-$(aws sts get-caller-identity --query Account --output text) \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket maturity-assessment-kb-$(aws sts get-caller-identity --query Account --output text) \
  --versioning-configuration Status=Enabled

# Set the bucket name
export KB_BUCKET=maturity-assessment-kb-$(aws sts get-caller-identity --query Account --output text)
echo $KB_BUCKET
```

## Step 5: Create IAM Role for Lambda Functions

```bash
# Create trust policy for Lambda
cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name BedrockAgentLambdaRole \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --description "Role for Bedrock Agent Lambda functions"

# Attach managed policies
aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonRDSDataFullAccess

aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# Get the role ARN
export LAMBDA_ROLE_ARN=$(aws iam get-role --role-name BedrockAgentLambdaRole --query 'Role.Arn' --output text)
echo $LAMBDA_ROLE_ARN
```

## Step 6: Deploy Lambda Functions

```bash
cd lambda-functions

# Get your DB cluster ARN (replace with your cluster name)
export DB_CLUSTER_ARN=$(aws rds describe-db-clusters \
  --db-cluster-identifier maturity-assessment-db \
  --query 'DBClusters[0].DBClusterArn' --output text)

# Get your secret ARN
export DB_SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id maturity-db-credentials \
  --query 'ARN' --output text)

echo "DB Cluster ARN: $DB_CLUSTER_ARN"
echo "DB Secret ARN: $DB_SECRET_ARN"

# Package Lambda 1: get_metric_details
zip get_metric_details.zip get_metric_details.py

aws lambda create-function \
  --function-name BedrockAgent-GetMetricDetails \
  --runtime python3.11 \
  --role $LAMBDA_ROLE_ARN \
  --handler get_metric_details.lambda_handler \
  --zip-file fileb://get_metric_details.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{
    DB_CLUSTER_ARN=$DB_CLUSTER_ARN,
    DB_SECRET_ARN=$DB_SECRET_ARN,
    DB_NAME=maturity_assessment
  }" \
  --region us-east-1

# Package Lambda 2: calculate_score
zip calculate_score.zip calculate_score.py

aws lambda create-function \
  --function-name BedrockAgent-CalculateScore \
  --runtime python3.11 \
  --role $LAMBDA_ROLE_ARN \
  --handler calculate_score.lambda_handler \
  --zip-file fileb://calculate_score.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{
    DB_CLUSTER_ARN=$DB_CLUSTER_ARN,
    DB_SECRET_ARN=$DB_SECRET_ARN,
    DB_NAME=maturity_assessment
  }" \
  --region us-east-1

# Package Lambda 3: get_assessment_context (you'll need to create this file)
# For now, we'll use get_metric_details as a placeholder
zip get_assessment_context.zip get_metric_details.py

aws lambda create-function \
  --function-name BedrockAgent-GetAssessmentContext \
  --runtime python3.11 \
  --role $LAMBDA_ROLE_ARN \
  --handler get_metric_details.lambda_handler \
  --zip-file fileb://get_assessment_context.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{
    DB_CLUSTER_ARN=$DB_CLUSTER_ARN,
    DB_SECRET_ARN=$DB_SECRET_ARN,
    DB_NAME=maturity_assessment
  }" \
  --region us-east-1

cd ..

echo "✅ Lambda functions deployed!"
```

## Step 7: Create Bedrock Knowledge Base

```bash
# First, request access to Claude 3.5 Sonnet in Bedrock Console
# Go to: https://console.aws.amazon.com/bedrock/
# Click "Model access" → Request access to Anthropic Claude models

# Create IAM role for Bedrock Knowledge Base
cat > /tmp/kb-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name BedrockKnowledgeBaseRole \
  --assume-role-policy-document file:///tmp/kb-trust-policy.json

# Create policy for S3 access
cat > /tmp/kb-s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$KB_BUCKET/*",
        "arn:aws:s3:::$KB_BUCKET"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name BedrockKnowledgeBaseRole \
  --policy-name S3AccessPolicy \
  --policy-document file:///tmp/kb-s3-policy.json

export KB_ROLE_ARN=$(aws iam get-role --role-name BedrockKnowledgeBaseRole --query 'Role.Arn' --output text)

# Wait for role to propagate
echo "Waiting 10 seconds for IAM role to propagate..."
sleep 10

# Create Knowledge Base (via AWS Console - CLI support is limited)
echo "
⚠️  MANUAL STEP REQUIRED:
Go to AWS Bedrock Console → Knowledge bases → Create knowledge base

1. Name: maturity-assessment-kb
2. Description: Enterprise Architecture Maturity Assessment metrics
3. Select IAM role: BedrockKnowledgeBaseRole
4. Choose model: Titan Embeddings G1 - Text
5. Data source:
   - Type: S3
   - Bucket: $KB_BUCKET
   - Prefix: knowledge-base/
6. Chunking strategy: Fixed-size (500 tokens, 20% overlap)
7. Create knowledge base

Note the Knowledge Base ID for the next step.
"

read -p "Press Enter after creating the Knowledge Base and note the KB ID..."
```

## Step 8: Upload Knowledge Base Documents

```bash
# Update .env with your values
cat >> .env << EOF

# AWS Bedrock Configuration
AWS_REGION=us-east-1
BEDROCK_KB_S3_BUCKET=$KB_BUCKET
BEDROCK_KB_S3_PREFIX=knowledge-base/
EOF

# Run the knowledge base preparation script
node scripts/prepare-bedrock-knowledge-base.js --sync-type=full

echo "✅ Knowledge base documents uploaded to S3!"
echo "Now trigger ingestion in Bedrock Console:"
echo "Bedrock → Knowledge bases → Your KB → Data sources → Sync"
```

## Step 9: Create Bedrock Agent

**Manual steps in AWS Console** (Bedrock Agent creation via CLI is limited):

1. Go to **AWS Bedrock Console** → **Agents** → **Create Agent**

2. **Agent Details**:
   - Name: `maturity-assessment-agent`
   - Description: `AI assistant for enterprise architecture maturity assessments`
   - Model: `Anthropic Claude 3.5 Sonnet v2`

3. **Agent Instructions**:

```
You are an expert Enterprise Architecture Maturity Assessment assistant.

Your role:
- Guide users through maturity assessments with clear, actionable advice
- Explain maturity levels and criteria based on the knowledge base
- Analyze evidence and suggest appropriate maturity scores
- Provide best practices and recommendations
- Clarify questions about metrics and scoring

Be concise, professional, and data-driven. Reference specific criteria from the knowledge base when applicable.
```

4. **Add Knowledge Base**:
   - Select the knowledge base you created
   - Instructions: "Use this to provide detailed metric criteria and best practices"

5. **Add Action Group 1**: AssessmentContextActions
   - Name: `AssessmentContextActions`
   - Description: `Get metric details and assessment context`
   - Lambda function: `BedrockAgent-GetMetricDetails`
   - API Schema:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Assessment Context API",
    "version": "1.0.0"
  },
  "paths": {
    "/metric/details": {
      "get": {
        "description": "Get detailed information about a specific metric",
        "operationId": "getMetricDetails",
        "parameters": [
          {
            "name": "metricId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "UUID of the metric"
          }
        ],
        "responses": {
          "200": {
            "description": "Metric details"
          }
        }
      }
    }
  }
}
```

6. **Add Action Group 2**: CalculationActions
   - Name: `CalculationActions`
   - Description: `Calculate maturity scores`
   - Lambda function: `BedrockAgent-CalculateScore`
   - API Schema:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Calculation API",
    "version": "1.0.0"
  },
  "paths": {
    "/calculate/score": {
      "post": {
        "description": "Calculate real-time maturity scores for an assessment",
        "operationId": "calculateScore",
        "parameters": [
          {
            "name": "sessionId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "UUID of the assessment session"
          }
        ],
        "responses": {
          "200": {
            "description": "Calculation results"
          }
        }
      }
    }
  }
}
```

7. **Create Alias**:
   - Name: `production`
   - Note the Agent ID and Alias ID

8. **Test in Console**:
   - Use the test interface to verify the agent works
   - Try: "What is Level 3 monitoring?"

## Step 10: Grant Lambda Permissions for Bedrock

```bash
# Get your agent ARN (replace AGENT_ID with your actual ID)
read -p "Enter your Bedrock Agent ID: " AGENT_ID
export AGENT_ARN="arn:aws:bedrock:us-east-1:$(aws sts get-caller-identity --query Account --output text):agent/$AGENT_ID"

# Grant permissions
aws lambda add-permission \
  --function-name BedrockAgent-GetMetricDetails \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $AGENT_ARN

aws lambda add-permission \
  --function-name BedrockAgent-CalculateScore \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $AGENT_ARN

aws lambda add-permission \
  --function-name BedrockAgent-GetAssessmentContext \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $AGENT_ARN

echo "✅ Lambda permissions granted!"
```

## Step 11: Update Your .env File

```bash
# Get your agent alias ID from the console
read -p "Enter your Bedrock Agent Alias ID: " ALIAS_ID
read -p "Enter your Knowledge Base ID: " KB_ID
read -p "Enter your Data Source ID: " DS_ID

# Update .env
cat >> .env << EOF

# Bedrock Agent IDs (from AWS Console)
BEDROCK_AGENT_ID=$AGENT_ID
BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID
BEDROCK_KNOWLEDGE_BASE_ID=$KB_ID
BEDROCK_DATA_SOURCE_ID=$DS_ID
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
EOF

echo "✅ Environment variables updated!"
```

## Step 12: Test the Integration Locally

Now test your local app with real AWS services:

```bash
# Install dependencies (if not already done)
npm install

# Run local tests with AWS
npm run dev

# Or test the service directly
node -e "
const { bedrockService } = require('./src/lib/bedrock-agent');

async function test() {
  try {
    const conversationId = await bedrockService.initConversation(
      'test-session-123',
      'test-user-456',
      {
        sessionId: 'test-session-123',
        userId: 'test-user-456'
      }
    );
    console.log('Conversation ID:', conversationId);

    const response = await bedrockService.sendMessage(
      conversationId,
      'What is Level 3 monitoring?'
    );
    console.log('Response:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
"
```

## Troubleshooting

### Lambda can't connect to RDS

```bash
# Ensure Data API is enabled
aws rds modify-db-cluster \
  --db-cluster-identifier your-cluster \
  --enable-http-endpoint \
  --apply-immediately
```

### Bedrock access denied

```bash
# Request model access in Bedrock Console
# Bedrock → Model access → Request access to Claude models
# Wait for approval (usually instant)
```

### Lambda timeout

```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name BedrockAgent-CalculateScore \
  --timeout 120
```

### S3 bucket access denied

```bash
# Update bucket policy
aws s3api put-bucket-policy \
  --bucket $KB_BUCKET \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::'$KB_BUCKET'/*",
        "arn:aws:s3:::'$KB_BUCKET'"
      ]
    }]
  }'
```

## Cost Estimate

For development/testing (100 conversations/month):

- **Bedrock Agent**: ~$3-5
- **Claude 3.5 Sonnet**: ~$2-4 (input/output tokens)
- **Lambda**: ~$0.20
- **RDS Serverless**: ~$15-30
- **S3**: ~$0.10
- **Secrets Manager**: ~$0.40

**Total**: ~$20-40/month for development

## Next Steps

1. ✅ AWS resources deployed
2. ✅ Bedrock Agent configured
3. ✅ Lambda functions deployed
4. ⏳ Test with real AWS services
5. ⏳ Build API routes in Next.js
6. ⏳ Build frontend BedrockAssistant component
7. ⏳ Deploy to production

---

**Quick Reference**:

- Agent console: https://console.aws.amazon.com/bedrock/home#/agents
- Lambda console: https://console.aws.amazon.com/lambda/home#/functions
- S3 console: https://s3.console.aws.amazon.com/s3/buckets
- RDS console: https://console.aws.amazon.com/rds/home#databases:

Save your IDs:

- Agent ID: `_____________`
- Agent Alias ID: `_____________`
- Knowledge Base ID: `_____________`
- S3 Bucket: `_____________`

  MANUAL STEPS REQUIRED:

1. Request Bedrock Model Access (if not already done):
   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
   - Request access to: Anthropic Claude 3.5 Sonnet
   - Request access to: Amazon Titan Embeddings G1 - Text

2. Create Bedrock Knowledge Base:
   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/knowledge-bases
   - Name: cio-maturity-kb
   - IAM Role: cio-maturity-kb-role
   - Embedding Model: Amazon Titan Embeddings G1 - Text
   - S3 Data Source: s3://cio-maturity-kb-475882391631/knowledge-base/
   - Chunking: Fixed-size (500 tokens, 20% overlap)

3. Create Bedrock Agent:
   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents
   - Name: cio-maturity-agent
   - Model: Anthropic Claude 3.5 Sonnet v2
   - Attach Knowledge Base created in step 2
   - Add Action Groups (see AWS_DEPLOYMENT_GUIDE.md for schemas)

4. Update .env file with Agent IDs (after creating agent):
   BEDROCK_AGENT_ID=<your-agent-id>
   BEDROCK_AGENT_ALIAS_ID=<your-alias-id>
   BEDROCK_KNOWLEDGE_BASE_ID=<your-kb-id>
   BEDROCK_KB_S3_BUCKET=cio-maturity-kb-475882391631
