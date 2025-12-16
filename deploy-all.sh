#!/bin/bash

###############################################################################
# Complete Deployment Script
# Handles: Build, ECR login, Push images, and Git commit/push
# Usage: source .env && chmod +x deploy-all.sh && ./deploy-all.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Enterprise Architecture Maturity - Complete Deployment    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# Step 1: Verify Prerequisites
# ============================================================================
echo -e "\n${YELLOW}Step 1: Verifying Prerequisites${NC}"

check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ $1 is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $1 is installed${NC}"
}

check_command "docker"
check_command "aws"
check_command "git"
check_command "kubectl"

# ============================================================================
# Step 2: Verify AWS Credentials
# ============================================================================
echo -e "\n${YELLOW}Step 2: Verifying AWS Credentials${NC}"

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo -e "${RED}✗ AWS credentials not set${NC}"
  echo "Please load credentials first: source .env"
  exit 1
fi

echo -e "${GREEN}✓ AWS credentials loaded${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
  echo -e "${RED}✗ Failed to get AWS Account ID. Check your credentials.${NC}"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
echo -e "${GREEN}✓ AWS Account ID: $ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ AWS Region: $AWS_REGION${NC}"

# ============================================================================
# Step 3: Build Docker Images
# ============================================================================
echo -e "\n${YELLOW}Step 3: Building Docker Images${NC}"

echo -e "${BLUE}Building web application image...${NC}"
if docker build -t cio-maturity-metrics:latest .; then
  echo -e "${GREEN}✓ Web application image built successfully${NC}"
else
  echo -e "${RED}✗ Failed to build web application image${NC}"
  exit 1
fi

echo -e "${BLUE}Building database image...${NC}"
if docker build -t cio-maturity-db:latest -f Dockerfile.db .; then
  echo -e "${GREEN}✓ Database image built successfully${NC}"
else
  echo -e "${RED}✗ Failed to build database image${NC}"
  exit 1
fi

# ============================================================================
# Step 4: Login to AWS ECR
# ============================================================================
echo -e "\n${YELLOW}Step 4: Authenticating with AWS ECR${NC}"

ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo -e "${BLUE}Getting ECR login token...${NC}"
PASSWORD=$(aws ecr get-login-password --region $AWS_REGION 2>/dev/null)
if [ -z "$PASSWORD" ]; then
  echo -e "${RED}✗ Failed to get ECR login password${NC}"
  exit 1
fi

echo -e "${BLUE}Logging in to ECR...${NC}"
if echo $PASSWORD | docker login --username AWS --password-stdin $ECR_REGISTRY &>/dev/null; then
  echo -e "${GREEN}✓ Successfully authenticated with ECR${NC}"
else
  echo -e "${RED}✗ Failed to authenticate with ECR${NC}"
  exit 1
fi

# ============================================================================
# Step 5: Tag Images for ECR
# ============================================================================
echo -e "\n${YELLOW}Step 5: Tagging Images for ECR${NC}"

echo -e "${BLUE}Tagging web application image...${NC}"
docker tag cio-maturity-metrics:latest $ECR_REGISTRY/cio-maturity-metrics:latest
echo -e "${GREEN}✓ Web image tagged${NC}"

echo -e "${BLUE}Tagging database image...${NC}"
docker tag cio-maturity-db:latest $ECR_REGISTRY/cio-maturity-db:latest
echo -e "${GREEN}✓ Database image tagged${NC}"

# ============================================================================
# Step 6: Push Images to ECR
# ============================================================================
echo -e "\n${YELLOW}Step 6: Pushing Images to ECR${NC}"

echo -e "${BLUE}Pushing web application image...${NC}"
if docker push $ECR_REGISTRY/cio-maturity-metrics:latest; then
  echo -e "${GREEN}✓ Web application image pushed${NC}"
else
  echo -e "${RED}✗ Failed to push web application image${NC}"
  exit 1
fi

echo -e "${BLUE}Pushing database image...${NC}"
if docker push $ECR_REGISTRY/cio-maturity-db:latest; then
  echo -e "${GREEN}✓ Database image pushed${NC}"
else
  echo -e "${RED}✗ Failed to push database image${NC}"
  exit 1
fi

# ============================================================================
# Step 7: Verify Images in ECR
# ============================================================================
echo -e "\n${YELLOW}Step 7: Verifying Images in ECR${NC}"

echo -e "${BLUE}Checking cio-maturity-metrics repository...${NC}"
aws ecr describe-images \
  --repository-name cio-maturity-metrics \
  --region $AWS_REGION \
  --query 'imageDetails[0].{Repository:repositoryName,Tag:imageTags[0],Size:imageSizeBytes,PushedAt:imagePushedAt}' \
  --output table 2>/dev/null || echo -e "${YELLOW}Note: Could not retrieve image details${NC}"

echo -e "${BLUE}Checking cio-maturity-db repository...${NC}"
aws ecr describe-images \
  --repository-name cio-maturity-db \
  --region $AWS_REGION \
  --query 'imageDetails[0].{Repository:repositoryName,Tag:imageTags[0],Size:imageSizeBytes,PushedAt:imagePushedAt}' \
  --output table 2>/dev/null || echo -e "${YELLOW}Note: Could not retrieve image details${NC}"

# ============================================================================
# Step 8: Git Commit and Push
# ============================================================================
echo -e "\n${YELLOW}Step 8: Git Commit and Push${NC}"

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}✓ No changes to commit${NC}"
else
  echo -e "${BLUE}Committing changes...${NC}"
  git add -A
  
  COMMIT_MSG="Deploy: Build and push Docker images to ECR - $(date '+%Y-%m-%d %H:%M:%S')"
  
  if git commit -m "$COMMIT_MSG"; then
    echo -e "${GREEN}✓ Changes committed${NC}"
  else
    echo -e "${YELLOW}Note: Nothing to commit${NC}"
  fi
fi

echo -e "${BLUE}Pushing to GitHub...${NC}"
if git push origin main; then
  echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
else
  echo -e "${RED}✗ Failed to push to GitHub${NC}"
  echo -e "${YELLOW}Note: You may need to force push if history was rewritten${NC}"
  echo -e "${YELLOW}Run: git push -f origin main${NC}"
  exit 1
fi

# ============================================================================
# Step 9: Display Summary
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Deployment Complete!                                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}Summary:${NC}"
echo -e "  AWS Account ID:          $ACCOUNT_ID"
echo -e "  AWS Region:              $AWS_REGION"
echo -e "  ECR Registry:            $ECR_REGISTRY"
echo -e "  Web Image:               $ECR_REGISTRY/cio-maturity-metrics:latest"
echo -e "  Database Image:          $ECR_REGISTRY/cio-maturity-db:latest"

echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "  1. Connect to EKS cluster:"
echo -e "     ${YELLOW}aws eks update-kubeconfig --region $AWS_REGION --name CIO-initiatives${NC}"
echo -e ""
echo -e "  2. Deploy to Kubernetes:"
echo -e "     ${YELLOW}kubectl apply -f deployment.yaml${NC}"
echo -e ""
echo -e "  3. Check deployment status:"
echo -e "     ${YELLOW}kubectl get pods -n maturity-assessment${NC}"
echo -e ""
echo -e "  4. Get application URL:"
echo -e "     ${YELLOW}kubectl get svc maturity-web -n maturity-assessment${NC}"

echo -e "\n${GREEN}✓ All done!${NC}\n"
