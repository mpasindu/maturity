#!/bin/bash

# Deploy PostgreSQL with Restored Dump to ECS
# Usage: source .env && ./deploy-db-to-ecs.sh

set -e

# Verify AWS credentials are loaded from environment
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS credentials not set"
  echo "Please load them first: source .env"
  exit 1
fi

echo "✓ AWS Credentials loaded from environment"

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO_NAME="cio-maturity-metrics"
ECS_CLUSTER="CIO-initiatives"
ECS_SERVICE="maturity-db"
IMAGE_TAG="latest"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $AWS_REGION)
echo "AWS Account ID: $ACCOUNT_ID"

# ECR URI
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:$IMAGE_TAG"

echo "=========================================="
echo "PostgreSQL Database Deployment to ECS"
echo "=========================================="
echo "ECR URI: $ECR_URI"
echo "Region: $AWS_REGION"
echo "Cluster: $ECS_CLUSTER"
echo "Service: $ECS_SERVICE"
echo ""

# Step 1: Create ECR Repository (if not exists)
echo "Step 1: Creating ECR repository..."
aws ecr create-repository \
  --repository-name $ECR_REPO_NAME \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES \
  2>/dev/null || echo "Repository already exists"

# Step 2: Login to ECR
echo "Step 2: Getting ECR authentication token..."
ECR_PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)
if [ $? -ne 0 ]; then
  echo "Error: Failed to get ECR authentication"
  echo "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:10}..."
  exit 1
fi
echo "✓ Retrieved ECR authentication token"

echo "Step 2b: Logging into Docker..."
echo "$ECR_PASSWORD" | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
if [ $? -ne 0 ]; then
  echo "Warning: Docker login may have failed, continuing..."
fi
echo "✓ Docker login completed"

# Step 3: Build Docker image
echo "Step 3: Building Docker image..."
docker build -f Dockerfile.db -t $ECR_REPO_NAME:$IMAGE_TAG .

# Step 4: Tag image for ECR
echo "Step 4: Tagging image for ECR..."
docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI

# Step 5: Push to ECR
echo "Step 5: Pushing image to ECR..."
docker push $ECR_URI

echo ""
echo "=========================================="
echo "✓ Database image pushed to ECR"
echo "ECR URI: $ECR_URI"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update ECS task definition with new image URI: $ECR_URI"
echo "2. Create/Update ECS service with database task"
echo "3. Update web app environment variables to point to new DB endpoint"
echo ""
echo "To update ECS service, use:"
echo "aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION"
