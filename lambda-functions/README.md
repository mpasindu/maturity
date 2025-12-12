# Lambda Functions Deployment Guide

## Overview

This directory contains AWS Lambda functions that serve as Action Groups for the Bedrock Agent.
These functions provide the agent with real-time access to assessment data and calculation capabilities.

## Lambda Functions

### 1. get_metric_details.py

**Purpose**: Retrieve detailed metric information for AI context

**Action Group**: AssessmentContextActions  
**API Path**: /metric/details  
**HTTP Method**: GET

**Parameters**:

- `metricId` (string): UUID of the metric

**Returns**:

```json
{
  "metric": {
    "id": "uuid",
    "name": "Monitoring Basics",
    "description": "...",
    "level": 2,
    "type": "SCALE",
    "minValue": 0,
    "maxValue": 5
  },
  "topic": { "id": "uuid", "name": "Monitoring & Observability" },
  "pillar": { "id": "uuid", "name": "Operational Excellence" }
}
```

### 2. calculate_score.py

**Purpose**: Calculate real-time maturity scores

**Action Group**: CalculationActions  
**API Path**: /calculate/score  
**HTTP Method**: POST

**Parameters**:

- `sessionId` (string): UUID of assessment session

**Returns**:

```json
{
  "overall_score": 3.45,
  "maturity_level": "DEFINED",
  "pillar_scores": [...],
  "topic_scores": [...],
  "statistics": {
    "total_metrics": 54,
    "answered_metrics": 32,
    "completion_percentage": 59.3
  }
}
```

### 3. get_assessment_context.py

**Purpose**: Get comprehensive assessment session context

**Action Group**: AssessmentContextActions  
**API Path**: /session/context  
**HTTP Method**: GET

**Parameters**:

- `sessionId` (string): UUID of assessment session

**Returns**:

```json
{
  "session": { "id": "uuid", "status": "IN_PROGRESS", ... },
  "target": { "id": "uuid", "name": "Production Platform", ... },
  "progress": { "completion_percentage": 59.3, ... },
  "recent_activity": [...],
  "pillar_progress": [...]
}
```

## Deployment Steps

### Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **IAM Role** for Lambda with:
   - RDS Data API access
   - Secrets Manager read access
   - CloudWatch Logs write access
3. **RDS Cluster** with Data API enabled
4. **Secrets Manager** secret with database credentials

### Step 1: Create IAM Role

```bash
aws iam create-role \
  --role-name BedrockAgentLambdaRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }'
```

### Step 2: Attach Policies

```bash
# Basic Lambda execution
aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# RDS Data API access
aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonRDSDataFullAccess

# Secrets Manager read
aws iam attach-role-policy \
  --role-name BedrockAgentLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### Step 3: Package Lambda Functions

```bash
cd lambda-functions

# Create deployment package for each function
zip get_metric_details.zip get_metric_details.py
zip calculate_score.zip calculate_score.py
zip get_assessment_context.zip get_assessment_context.py
```

### Step 4: Deploy Lambda Functions

Replace placeholders with your actual values:

- `<your-account-id>`
- `<your-db-cluster-arn>`
- `<your-db-secret-arn>`

```bash
# Get IAM Role ARN
ROLE_ARN=$(aws iam get-role --role-name BedrockAgentLambdaRole --query 'Role.Arn' --output text)

# Deploy get_metric_details
aws lambda create-function \
  --function-name BedrockAgent-GetMetricDetails \
  --runtime python3.11 \
  --role $ROLE_ARN \
  --handler get_metric_details.lambda_handler \
  --zip-file fileb://get_metric_details.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{
    DB_CLUSTER_ARN=arn:aws:rds:us-east-1:<account-id>:cluster:maturity-db,
    DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:<account-id>:secret:maturity-db-creds,
    DB_NAME=maturity_assessment
  }"

# Deploy calculate_score
aws lambda create-function \
  --function-name BedrockAgent-CalculateScore \
  --runtime python3.11 \
  --role $ROLE_ARN \
  --handler calculate_score.lambda_handler \
  --zip-file fileb://calculate_score.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{
    DB_CLUSTER_ARN=arn:aws:rds:us-east-1:<account-id>:cluster:maturity-db,
    DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:<account-id>:secret:maturity-db-creds,
    DB_NAME=maturity_assessment
  }"

# Deploy get_assessment_context
aws lambda create-function \
  --function-name BedrockAgent-GetAssessmentContext \
  --runtime python3.11 \
  --role $ROLE_ARN \
  --handler get_assessment_context.lambda_handler \
  --zip-file fileb://get_assessment_context.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{
    DB_CLUSTER_ARN=arn:aws:rds:us-east-1:<account-id>:cluster:maturity-db,
    DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:<account-id>:secret:maturity-db-creds,
    DB_NAME=maturity_assessment
  }"
```

### Step 5: Grant Bedrock Agent Permission to Invoke Lambdas

```bash
# Get your Bedrock Agent ARN from AWS Console
BEDROCK_AGENT_ARN="arn:aws:bedrock:us-east-1:<account-id>:agent/<agent-id>"

# Grant permissions
aws lambda add-permission \
  --function-name BedrockAgent-GetMetricDetails \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $BEDROCK_AGENT_ARN

aws lambda add-permission \
  --function-name BedrockAgent-CalculateScore \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $BEDROCK_AGENT_ARN

aws lambda add-permission \
  --function-name BedrockAgent-GetAssessmentContext \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn $BEDROCK_AGENT_ARN
```

### Step 6: Test Lambda Functions

```bash
# Test get_metric_details
aws lambda invoke \
  --function-name BedrockAgent-GetMetricDetails \
  --payload '{"parameters": [{"name": "metricId", "value": "your-metric-id"}]}' \
  response.json

cat response.json

# Test calculate_score
aws lambda invoke \
  --function-name BedrockAgent-CalculateScore \
  --payload '{"parameters": [{"name": "sessionId", "value": "your-session-id"}]}' \
  response.json

cat response.json
```

## Configure Bedrock Agent Action Groups

In the AWS Bedrock Console:

1. **Navigate to your Bedrock Agent**
2. **Add Action Group**: AssessmentContextActions
   - **Lambda**: BedrockAgent-GetMetricDetails
   - **API Schema**:
     ```json
     {
       "openapi": "3.0.0",
       "info": { "title": "Assessment Context API", "version": "1.0.0" },
       "paths": {
         "/metric/details": {
           "get": {
             "description": "Get detailed metric information",
             "parameters": [
               {
                 "name": "metricId",
                 "in": "query",
                 "required": true,
                 "schema": { "type": "string" }
               }
             ],
             "responses": { "200": { "description": "Metric details" } }
           }
         },
         "/session/context": {
           "get": {
             "description": "Get assessment session context",
             "parameters": [
               {
                 "name": "sessionId",
                 "in": "query",
                 "required": true,
                 "schema": { "type": "string" }
               }
             ],
             "responses": { "200": { "description": "Session context" } }
           }
         }
       }
     }
     ```

3. **Add Action Group**: CalculationActions
   - **Lambda**: BedrockAgent-CalculateScore
   - **API Schema**:
     ```json
     {
       "openapi": "3.0.0",
       "info": { "title": "Calculation API", "version": "1.0.0" },
       "paths": {
         "/calculate/score": {
           "post": {
             "description": "Calculate maturity scores",
             "parameters": [
               {
                 "name": "sessionId",
                 "in": "query",
                 "required": true,
                 "schema": { "type": "string" }
               }
             ],
             "responses": { "200": { "description": "Calculation results" } }
           }
         }
       }
     }
     ```

## Monitoring and Logs

View logs in CloudWatch:

```bash
# Get recent logs
aws logs tail /aws/lambda/BedrockAgent-GetMetricDetails --follow

aws logs tail /aws/lambda/BedrockAgent-CalculateScore --follow

aws logs tail /aws/lambda/BedrockAgent-GetAssessmentContext --follow
```

## Updating Functions

```bash
# Update function code
zip get_metric_details.zip get_metric_details.py

aws lambda update-function-code \
  --function-name BedrockAgent-GetMetricDetails \
  --zip-file fileb://get_metric_details.zip
```

## Cost Optimization

- **Memory**: Start with 256MB, monitor and adjust
- **Timeout**: 30s for data retrieval, 60s for calculations
- **Concurrency**: Set reserved concurrency if needed
- **VPC**: Only if RDS is in VPC (adds latency)

## Security Best Practices

1. ✅ Use IAM roles with least privilege
2. ✅ Rotate database credentials in Secrets Manager
3. ✅ Enable CloudWatch Logs encryption
4. ✅ Use VPC endpoints for RDS Data API
5. ✅ Monitor invocations with CloudWatch Alarms

## Troubleshooting

### Function Times Out

- Increase timeout setting
- Check RDS Data API connectivity
- Verify Secrets Manager access

### Permission Denied

- Verify IAM role has RDS Data API permissions
- Check Bedrock Agent has permission to invoke Lambda
- Confirm Secrets Manager access

### Database Connection Issues

- Verify RDS cluster ARN is correct
- Ensure Data API is enabled on RDS cluster
- Check secret ARN and format

## Next Steps

After deploying Lambda functions:

1. Configure Bedrock Agent with action groups
2. Test agent in AWS Console
3. Update environment variables in `.env`
4. Build API routes in Next.js application
5. Create frontend BedrockAssistant component

---

**Files**: 3 Lambda functions  
**Total Size**: ~15KB  
**Runtime**: Python 3.11  
**Estimated Cost**: ~$0.20/month for 10,000 invocations
