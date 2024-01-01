#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS Configuration
export AWS_ACCESS_KEY_ID="***REDACTED***"
export AWS_SECRET_ACCESS_KEY="***REDACTED***"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEJ7//////////wEaCXVzLWVhc3QtMSJIMEYCIQCSp6Y1EcWVMj94+yQpPxgVB77od3y50tBI0HwKxBHTeAIhAPb4/qcFHCDA6Qvd9SGgdFJgncdTendutWOqCKM/U4/HKogDCGcQABoMNDc1ODgyMzkxNjMxIgzK2Z8LS2yrmyPTRmAq5QJilXe4IyUE8CZYItDNBrYlNAzTBcHncLsJ1B8EYcm5oPTGquX+abfbl3dkBEp8ojZeJmWPdz2R6tnZF3jYdX0f+dsBzmFdLw/hlElRPY/gVrAvLxN2hIjNGg4NMmeOZV+Btc5w/4Ck9fQhcMoiRmeL68vT6+3CHnDHm5TDvDoRgmQbxYgWHAbjVg1Bjevo3bfVBpMUexVvelpKFhhSWZiLxGeK9oZtJ/cjyLDdxwHePJ+wmG7nc6KfJTs9ApiN7WWLgHj0Kt8XLHmTcMqaVIErsR8p5j/bKZVSlJv6uIHQV8DZepLyKJIAEOXfQovpDc5+wbrsqOIE03vM9ksfmST/DPMwUKycHSj36b542o39YlrOxCpA7WDypsx0UqZMi4NzmM/zd6/Z/TZ3C87hwDPtnoArCik5axDB8g192G2lD3/QWSQdgoBwhHvMHXk5TuVVZpQRnYHzadkRfS9w7LYe2E57vl4w3cGFygY6owHnMuFFxvaynDzupR9Kale9ncHgS+ScBjwgRcNblhIDfJotgHDXIQ5zNNg8IXn8VNOvabKi4BCxEFVSNYXP6BwBumo05C6gq2IhQR6yV1jfYrrKxvuBs4dAXzA/TkF2QNvr+x1+yljD9HS9uGkZjHyYOZOB+hZj3MWiuZOh9adS1LgNhoZjteH8A9AZh4wzJbcDH/gUpAbRTPG4Tw82RdZAkfa7"
export AWS_REGION="us-east-1"

# Configuration
CLUSTER_NAME="maturity-assessment"
NAMESPACE="maturity-assessment"
IMAGE_NAME="enterprise-architecture-maturity-platform"
AWS_ACCOUNT_ID="745882391631"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Maturity Assessment Platform - Deployment Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Step 1: Git operations
echo -e "\n${YELLOW}📝 Step 1: Git Operations${NC}"
echo -e "${YELLOW}Adding changes...${NC}"
git add -A

echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "chore: database setup and deployment configuration - $(date +%Y-%m-%d\ %H:%M:%S)"

echo -e "${YELLOW}Pushing to repository...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Git operations completed${NC}"
else
    echo -e "${RED}✗ Git push failed${NC}"
    exit 1
fi

# Step 2: Docker build and push
echo -e "\n${YELLOW}🐳 Step 2: Docker Build & Push${NC}"

echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${REGISTRY}

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ ECR login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ ECR login successful${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Checking ECR repository...${NC}"
aws ecr describe-repositories --repository-names ${IMAGE_NAME} --region ${AWS_REGION} 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository --repository-name ${IMAGE_NAME} --region ${AWS_REGION}
fi

echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:latest -t ${REGISTRY}/${IMAGE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "${YELLOW}Pushing to ECR...${NC}"
docker push ${REGISTRY}/${IMAGE_NAME}:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image pushed to ECR${NC}"
else
    echo -e "${RED}✗ Docker push failed${NC}"
    exit 1
fi

# Step 3: Update Kubernetes deployment
echo -e "\n${YELLOW}☸️  Step 3: Kubernetes Deployment${NC}"

echo -e "${YELLOW}Getting kubeconfig...${NC}"
aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to get kubeconfig${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating namespace if needed...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Update deployment image
echo -e "${YELLOW}Updating Kubernetes deployment...${NC}"
kubectl set image deployment/maturity \
  maturity=${REGISTRY}/${IMAGE_NAME}:latest \
  -n ${NAMESPACE}

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Deployment not found, applying manifest...${NC}"
    kubectl apply -f k8s/deployment.yaml
fi

# Wait for rollout
echo -e "${YELLOW}Waiting for deployment rollout...${NC}"
kubectl rollout status deployment/maturity -n ${NAMESPACE} --timeout=5m

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment completed successfully${NC}"
else
    echo -e "${RED}✗ Deployment rollout failed${NC}"
    exit 1
fi

# Get LoadBalancer URL
echo -e "\n${YELLOW}🔗 Service Information${NC}"
echo -e "${YELLOW}Waiting for LoadBalancer to get public IP...${NC}"
sleep 10

EXTERNAL_IP=$(kubectl get svc maturity-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")

if [ "${EXTERNAL_IP}" = "pending" ] || [ -z "${EXTERNAL_IP}" ]; then
    echo -e "${YELLOW}LoadBalancer still provisioning. Checking in 30 seconds...${NC}"
    sleep 30
    EXTERNAL_IP=$(kubectl get svc maturity-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
fi

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}Service URL: http://${EXTERNAL_IP}${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${YELLOW}Cluster:${NC} ${CLUSTER_NAME}"
echo -e "${YELLOW}Namespace:${NC} ${NAMESPACE}"
echo -e "${YELLOW}Image:${NC} ${REGISTRY}/${IMAGE_NAME}:latest"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Verify deployment
echo -e "\n${YELLOW}📊 Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get svc -n ${NAMESPACE}

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
