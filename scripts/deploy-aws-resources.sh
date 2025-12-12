#!/bin/bash

# AWS Bedrock Resources Deployment Script
# This script creates all AWS resources needed for the Bedrock integration
# Prefix: cio-maturity

set -e  # Exit on error

echo "🚀 Starting AWS Bedrock Resources Deployment"
echo "Prefix: cio-maturity"
echo "Region: us-east-1"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}AWS Account ID: $ACCOUNT_ID${NC}"
echo ""

# Variables
PREFIX="cio-maturity"
REGION="us-east-1"
DB_PASSWORD="MaturityAssess2024!"
KB_BUCKET="${PREFIX}-kb-${ACCOUNT_ID}"

echo "==================================================================="
echo "Step 1: Creating S3 Bucket for Knowledge Base"
echo "==================================================================="

# Create S3 bucket
if aws s3api head-bucket --bucket "$KB_BUCKET" 2>/dev/null; then
    echo -e "${YELLOW}Bucket $KB_BUCKET already exists${NC}"
else
    aws s3 mb "s3://${KB_BUCKET}" --region $REGION
    echo -e "${GREEN}✅ Created S3 bucket: $KB_BUCKET${NC}"
fi

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$KB_BUCKET" \
  --versioning-configuration Status=Enabled

echo -e "${GREEN}✅ Enabled versioning on S3 bucket${NC}"
echo ""

echo "==================================================================="
echo "Step 2: Creating Secrets Manager Secret for Database"
echo "==================================================================="

# Create or update secret
SECRET_NAME="${PREFIX}-db-credentials"

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $REGION 2>/dev/null | grep -q "ARN"; then
    echo -e "${YELLOW}Secret $SECRET_NAME already exists, updating...${NC}"
    aws secretsmanager update-secret \
      --secret-id "$SECRET_NAME" \
      --secret-string "{
        \"username\": \"postgres\",
        \"password\": \"$DB_PASSWORD\",
        \"engine\": \"postgres\",
        \"host\": \"localhost\",
        \"port\": 5432,
        \"dbname\": \"maturity_assessment\"
      }" \
      --region $REGION > /dev/null
else
    aws secretsmanager create-secret \
      --name "$SECRET_NAME" \
      --description "Database credentials for CIO maturity assessment" \
      --secret-string "{
        \"username\": \"postgres\",
        \"password\": \"$DB_PASSWORD\",
        \"engine\": \"postgres\",
        \"host\": \"localhost\",
        \"port\": 5432,
        \"dbname\": \"maturity_assessment\"
      }" \
      --region $REGION > /dev/null
fi

SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $REGION --query 'ARN' --output text)
echo -e "${GREEN}✅ Created/Updated secret: $SECRET_NAME${NC}"
echo -e "${BLUE}Secret ARN: $SECRET_ARN${NC}"
echo ""

echo "==================================================================="
echo "Step 3: Creating IAM Role for Lambda Functions"
echo "==================================================================="

LAMBDA_ROLE_NAME="${PREFIX}-lambda-role"

# Create trust policy
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

# Create role if it doesn't exist
if aws iam get-role --role-name "$LAMBDA_ROLE_NAME" 2>/dev/null | grep -q "RoleName"; then
    echo -e "${YELLOW}Role $LAMBDA_ROLE_NAME already exists${NC}"
else
    aws iam create-role \
      --role-name "$LAMBDA_ROLE_NAME" \
      --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
      --description "Role for CIO Maturity Bedrock Agent Lambda functions" > /dev/null
    echo -e "${GREEN}✅ Created IAM role: $LAMBDA_ROLE_NAME${NC}"
fi

# Attach policies
aws iam attach-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

aws iam attach-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite 2>/dev/null || true

# Create custom policy for Bedrock
cat > /tmp/bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:InvokeModel",
        "bedrock:Retrieve"
      ],
      "Resource": "*"
    }
  ]
}
EOF

POLICY_NAME="${PREFIX}-bedrock-policy"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

if aws iam get-policy --policy-arn "$POLICY_ARN" 2>/dev/null | grep -q "PolicyName"; then
    echo -e "${YELLOW}Policy $POLICY_NAME already exists${NC}"
else
    aws iam create-policy \
      --policy-name "$POLICY_NAME" \
      --policy-document file:///tmp/bedrock-policy.json \
      --description "Bedrock access for CIO Maturity Lambda" > /dev/null
    echo -e "${GREEN}✅ Created IAM policy: $POLICY_NAME${NC}"
fi

aws iam attach-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || true

LAMBDA_ROLE_ARN=$(aws iam get-role --role-name "$LAMBDA_ROLE_NAME" --query 'Role.Arn' --output text)
echo -e "${GREEN}✅ Configured IAM role with all policies${NC}"
echo -e "${BLUE}Lambda Role ARN: $LAMBDA_ROLE_ARN${NC}"
echo ""

echo "Waiting 10 seconds for IAM role to propagate..."
sleep 10

echo "==================================================================="
echo "Step 4: Deploying Lambda Functions"
echo "==================================================================="

cd lambda-functions

# Lambda 1: Get Metric Details
echo "Deploying get_metric_details..."
zip -q get_metric_details.zip get_metric_details.py

FUNCTION_NAME="${PREFIX}-get-metric-details"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region $REGION 2>/dev/null | grep -q "FunctionName"; then
    echo -e "${YELLOW}Function $FUNCTION_NAME exists, updating code...${NC}"
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file fileb://get_metric_details.zip \
      --region $REGION > /dev/null
else
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime python3.11 \
      --role "$LAMBDA_ROLE_ARN" \
      --handler get_metric_details.lambda_handler \
      --zip-file fileb://get_metric_details.zip \
      --timeout 30 \
      --memory-size 256 \
      --environment Variables="{
        DB_SECRET_ARN=$SECRET_ARN,
        DB_NAME=maturity_assessment
      }" \
      --region $REGION > /dev/null
    echo -e "${GREEN}✅ Created Lambda: $FUNCTION_NAME${NC}"
fi

# Lambda 2: Calculate Score
echo "Deploying calculate_score..."
zip -q calculate_score.zip calculate_score.py

FUNCTION_NAME="${PREFIX}-calculate-score"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region $REGION 2>/dev/null | grep -q "FunctionName"; then
    echo -e "${YELLOW}Function $FUNCTION_NAME exists, updating code...${NC}"
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file fileb://calculate_score.zip \
      --region $REGION > /dev/null
else
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime python3.11 \
      --role "$LAMBDA_ROLE_ARN" \
      --handler calculate_score.lambda_handler \
      --zip-file fileb://calculate_score.zip \
      --timeout 60 \
      --memory-size 512 \
      --environment Variables="{
        DB_SECRET_ARN=$SECRET_ARN,
        DB_NAME=maturity_assessment
      }" \
      --region $REGION > /dev/null
    echo -e "${GREEN}✅ Created Lambda: $FUNCTION_NAME${NC}"
fi

# Lambda 3: Get Assessment Context
echo "Deploying get_assessment_context..."
zip -q get_assessment_context.zip get_assessment_context.py

FUNCTION_NAME="${PREFIX}-get-assessment-context"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region $REGION 2>/dev/null | grep -q "FunctionName"; then
    echo -e "${YELLOW}Function $FUNCTION_NAME exists, updating code...${NC}"
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file fileb://get_assessment_context.zip \
      --region $REGION > /dev/null
else
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime python3.11 \
      --role "$LAMBDA_ROLE_ARN" \
      --handler get_assessment_context.lambda_handler \
      --zip-file fileb://get_assessment_context.zip \
      --timeout 30 \
      --memory-size 256 \
      --environment Variables="{
        DB_SECRET_ARN=$SECRET_ARN,
        DB_NAME=maturity_assessment
      }" \
      --region $REGION > /dev/null
    echo -e "${GREEN}✅ Created Lambda: $FUNCTION_NAME${NC}"
fi

cd ..

echo -e "${GREEN}✅ All Lambda functions deployed${NC}"
echo ""

echo "==================================================================="
echo "Step 5: Uploading Knowledge Base Documents to S3"
echo "==================================================================="

# Upload YAML files to S3
echo -e "${BLUE}Uploading knowledge base files to S3...${NC}"

# Upload metric files
for file in yaml-config/metrics/*.yaml; do
    filename=$(basename "$file")
    aws s3 cp "$file" "s3://${KB_BUCKET}/knowledge-base/metrics/${filename}" --region $REGION 2>&1 | grep -v "Completed" || true
done

# Upload pillar files
for file in yaml-config/pillars/*.yaml; do
    filename=$(basename "$file")
    aws s3 cp "$file" "s3://${KB_BUCKET}/knowledge-base/pillars/${filename}" --region $REGION 2>&1 | grep -v "Completed" || true
done

# Upload topic files  
for file in yaml-config/topics/*.yaml; do
    filename=$(basename "$file")
    aws s3 cp "$file" "s3://${KB_BUCKET}/knowledge-base/topics/${filename}" --region $REGION 2>&1 | grep -v "Completed" || true
done

echo -e "${GREEN}✅ Knowledge base documents uploaded to S3${NC}"
echo -e "${BLUE}Total files uploaded: $(aws s3 ls s3://${KB_BUCKET}/knowledge-base/ --recursive --region $REGION | wc -l)${NC}"
echo ""

echo "==================================================================="
echo "Step 6: Creating IAM Role for Bedrock Knowledge Base"
echo "==================================================================="

KB_ROLE_NAME="${PREFIX}-kb-role"

# Create trust policy for Bedrock
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

if aws iam get-role --role-name "$KB_ROLE_NAME" 2>/dev/null | grep -q "RoleName"; then
    echo -e "${YELLOW}Role $KB_ROLE_NAME already exists${NC}"
else
    aws iam create-role \
      --role-name "$KB_ROLE_NAME" \
      --assume-role-policy-document file:///tmp/kb-trust-policy.json \
      --description "Role for CIO Maturity Bedrock Knowledge Base" > /dev/null
    echo -e "${GREEN}✅ Created IAM role: $KB_ROLE_NAME${NC}"
fi

# Create S3 access policy
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
        "arn:aws:s3:::${KB_BUCKET}/*",
        "arn:aws:s3:::${KB_BUCKET}"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$KB_ROLE_NAME" \
  --policy-name S3AccessPolicy \
  --policy-document file:///tmp/kb-s3-policy.json

# Add Bedrock model invocation policy
cat > /tmp/kb-bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$KB_ROLE_NAME" \
  --policy-name BedrockModelPolicy \
  --policy-document file:///tmp/kb-bedrock-policy.json

KB_ROLE_ARN=$(aws iam get-role --role-name "$KB_ROLE_NAME" --query 'Role.Arn' --output text)
echo -e "${GREEN}✅ Configured Knowledge Base IAM role${NC}"
echo -e "${BLUE}KB Role ARN: $KB_ROLE_ARN${NC}"
echo ""

echo "==================================================================="
echo "Step 7: Creating S3 Bucket Policy for Bedrock"
echo "==================================================================="

cat > /tmp/s3-bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockKnowledgeBaseAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${KB_BUCKET}/*",
        "arn:aws:s3:::${KB_BUCKET}"
      ],
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${ACCOUNT_ID}"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket "$KB_BUCKET" \
  --policy file:///tmp/s3-bucket-policy.json

echo -e "${GREEN}✅ S3 bucket policy configured for Bedrock${NC}"
echo ""

echo "==================================================================="
echo "✅ AWS Resources Deployment Complete!"
echo "==================================================================="
echo ""
echo -e "${BLUE}📋 Summary of Created Resources:${NC}"
echo ""
echo "S3 Bucket:            $KB_BUCKET"
echo "Secret:               $SECRET_NAME"
echo "Lambda Role:          $LAMBDA_ROLE_NAME"
echo "Knowledge Base Role:  $KB_ROLE_NAME"
echo "Lambda Functions:"
echo "  - ${PREFIX}-get-metric-details"
echo "  - ${PREFIX}-calculate-score"
echo "  - ${PREFIX}-get-assessment-context"
echo ""
echo -e "${YELLOW}⚠️  MANUAL STEPS REQUIRED:${NC}"
echo ""
echo "1. Request Bedrock Model Access (if not already done):"
echo "   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
echo "   - Request access to: Anthropic Claude 3.5 Sonnet"
echo "   - Request access to: Amazon Titan Embeddings G1 - Text"
echo ""
echo "2. Create Bedrock Knowledge Base:"
echo "   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/knowledge-bases"
echo "   - Name: ${PREFIX}-kb"
echo "   - IAM Role: $KB_ROLE_NAME"
echo "   - Embedding Model: Amazon Titan Embeddings G1 - Text"
echo "   - S3 Data Source: s3://${KB_BUCKET}/knowledge-base/"
echo "   - Chunking: Fixed-size (500 tokens, 20% overlap)"
echo ""
echo "3. Create Bedrock Agent:"
echo "   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents"
echo "   - Name: ${PREFIX}-agent"
echo "   - Model: Anthropic Claude 3.5 Sonnet v2"
echo "   - Attach Knowledge Base created in step 2"
echo "   - Add Action Groups (see AWS_DEPLOYMENT_GUIDE.md for schemas)"
echo ""
echo "4. Update .env file with Agent IDs (after creating agent):"
echo "   BEDROCK_AGENT_ID=<your-agent-id>"
echo "   BEDROCK_AGENT_ALIAS_ID=<your-alias-id>"
echo "   BEDROCK_KNOWLEDGE_BASE_ID=<your-kb-id>"
echo "   BEDROCK_KB_S3_BUCKET=$KB_BUCKET"
echo ""
echo -e "${GREEN}For detailed instructions, see: AWS_DEPLOYMENT_GUIDE.md${NC}"
echo ""
