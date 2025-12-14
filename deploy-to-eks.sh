#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}Maturity Assessment - AWS EKS Deployment${NC}"
echo -e "${GREEN}====================================${NC}"

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="475882391631"
CLUSTER_NAME="CIO-initiatives"
ECR_REPO="cio-maturity-metrics"
IMAGE_TAG=${1:-latest}

# Set AWS credentials from environment
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_SESSION_TOKEN" ]; then
  echo -e "${RED}Error: AWS credentials not set in environment${NC}"
  echo "Please export AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN"
  exit 1
fi

echo -e "${YELLOW}Step 1: Authenticating with ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo -e "${YELLOW}Step 2: Creating ECR repository if it doesn't exist...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
  aws ecr create-repository \
    --repository-name $ECR_REPO \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256

echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
docker build -t $ECR_REPO:$IMAGE_TAG .

echo -e "${YELLOW}Step 4: Tagging Docker image...${NC}"
docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

echo -e "${YELLOW}Step 5: Pushing image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

echo -e "${YELLOW}Step 6: Updating kubeconfig for EKS cluster...${NC}"
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

echo -e "${YELLOW}Step 7: Verifying cluster access...${NC}"
kubectl cluster-info

echo -e "${YELLOW}Step 8: Applying Kubernetes manifests...${NC}"
kubectl apply -f k8s/deployment.yaml

echo -e "${YELLOW}Step 9: Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/maturity-app -n maturity-assessment --timeout=300s

echo -e "${YELLOW}Step 10: Getting service information...${NC}"
kubectl get services -n maturity-assessment

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${YELLOW}To view pods:${NC}"
echo "kubectl get pods -n maturity-assessment"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "kubectl logs -f deployment/maturity-app -n maturity-assessment"
echo ""
echo -e "${YELLOW}To get service URL:${NC}"
echo "kubectl get svc maturity-service -n maturity-assessment"
