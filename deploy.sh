#!/bin/bash
set -e

# ============================================================================
# Complete Maturity Assessment Platform Deployment Script
# Builds and deploys both Web App and PostgreSQL Database to EKS/ECR
# ============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="475882391631"
ECR_WEB_REPO="cio-maturity-metrics"
ECR_DB_REPO="cio-maturity-db"
EKS_CLUSTER="CIO-initiatives"
K8S_NAMESPACE="maturity-assessment"
WEB_IMAGE_TAG="latest"
DB_IMAGE_TAG="latest"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  local missing_tools=()
  
  command -v docker &> /dev/null || missing_tools+=("docker")
  command -v aws &> /dev/null || missing_tools+=("aws-cli")
  command -v kubectl &> /dev/null || missing_tools+=("kubectl")
  command -v node &> /dev/null || missing_tools+=("node")
  command -v npm &> /dev/null || missing_tools+=("npm")
  
  if [ ${#missing_tools[@]} -gt 0 ]; then
    log_error "Missing required tools: ${missing_tools[*]}"
    exit 1
  fi
  
  log_success "All prerequisites found"
}

verify_aws_credentials() {
  log_info "Verifying AWS credentials..."
  
  if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "AWS credentials not set"
    echo ""
    echo "To set credentials, run one of these:"
    echo ""
    echo "Option 1 - Load from .env file:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your credentials"
    echo "  source .env"
    echo "  ./deploy.sh"
    echo ""
    echo "Option 2 - Export directly:"
    echo "  export AWS_ACCESS_KEY_ID='your-key'"
    echo "  export AWS_SECRET_ACCESS_KEY='your-secret'"
    echo "  export AWS_SESSION_TOKEN='your-token' (if using STS)"
    echo "  ./deploy.sh"
    echo ""
    exit 1
  fi
  
  local account=$(aws sts get-caller-identity --region $AWS_REGION --query Account --output text 2>/dev/null)
  if [ $? -ne 0 ]; then
    log_error "Failed to verify AWS credentials - check if they are valid"
    exit 1
  fi
  
  log_success "AWS credentials verified (Account: $account)"
}

build_web_image() {
  log_info "Building web application image..."
  
  if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile not found in current directory"
    exit 1
  fi
  
  docker build -t maturity-web:$WEB_IMAGE_TAG \
    --build-arg NODE_ENV=production \
    -f Dockerfile .
  
  if [ $? -ne 0 ]; then
    log_error "Failed to build web image"
    exit 1
  fi
  
  log_success "Web image built successfully"
}

build_db_image() {
  log_info "Building database image..."
  
  if [ ! -f "Dockerfile.db" ]; then
    log_error "Dockerfile.db not found in current directory"
    exit 1
  fi
  
  if [ ! -f "maturity_db_backup.dump" ]; then
    log_warning "Database dump file not found. Continuing without restore..."
  fi
  
  docker build -t maturity-db:$DB_IMAGE_TAG \
    -f Dockerfile.db .
  
  if [ $? -ne 0 ]; then
    log_error "Failed to build database image"
    exit 1
  fi
  
  log_success "Database image built successfully"
}

create_ecr_repositories() {
  log_info "Creating ECR repositories..."
  
  # Web repository
  aws ecr create-repository \
    --repository-name $ECR_WEB_REPO \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    2>/dev/null || log_warning "Web ECR repository already exists"
  
  # Database repository
  aws ecr create-repository \
    --repository-name $ECR_DB_REPO \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    2>/dev/null || log_warning "Database ECR repository already exists"
  
  log_success "ECR repositories ready"
}

login_to_ecr() {
  log_info "Authenticating with ECR..."
  
  local password=$(aws ecr get-login-password --region $AWS_REGION)
  if [ $? -ne 0 ]; then
    log_error "Failed to get ECR authentication token"
    exit 1
  fi
  
  echo "$password" | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
  if [ $? -ne 0 ]; then
    log_error "Docker login to ECR failed"
    exit 1
  fi
  
  log_success "ECR authentication successful"
}

push_images_to_ecr() {
  log_info "Pushing images to ECR..."
  
  # Web image
  local web_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_WEB_REPO:$WEB_IMAGE_TAG"
  docker tag maturity-web:$WEB_IMAGE_TAG $web_uri
  docker push $web_uri
  if [ $? -ne 0 ]; then
    log_error "Failed to push web image"
    exit 1
  fi
  log_success "Web image pushed to ECR: $web_uri"
  
  # Database image
  local db_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_DB_REPO:$DB_IMAGE_TAG"
  docker tag maturity-db:$DB_IMAGE_TAG $db_uri
  docker push $db_uri
  if [ $? -ne 0 ]; then
    log_error "Failed to push database image"
    exit 1
  fi
  log_success "Database image pushed to ECR: $db_uri"
  
  echo $web_uri > /tmp/web_image_uri.txt
  echo $db_uri > /tmp/db_image_uri.txt
}

configure_kubectl() {
  log_info "Configuring kubectl for EKS cluster..."
  
  aws eks update-kubeconfig \
    --region $AWS_REGION \
    --name $EKS_CLUSTER
  
  if [ $? -ne 0 ]; then
    log_error "Failed to configure kubectl"
    exit 1
  fi
  
  log_success "kubectl configured for $EKS_CLUSTER"
}

create_namespace() {
  log_info "Creating Kubernetes namespace..."
  
  kubectl create namespace $K8S_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
  
  log_success "Namespace $K8S_NAMESPACE ready"
}

create_db_secret() {
  log_info "Creating database secret..."
  
  kubectl create secret generic maturity-db-secret \
    --from-literal=POSTGRES_PASSWORD='Amazon123!' \
    --from-literal=DATABASE_URL='postgresql://postgres:Amazon123!@maturity-db:5432/postgres?schema=public' \
    -n $K8S_NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -
  
  log_success "Database secret created"
}

deploy_database() {
  log_info "Deploying PostgreSQL database..."
  
  local db_uri=$(cat /tmp/db_image_uri.txt)
  
  kubectl set image deployment/maturity-db \
    postgres=$db_uri \
    -n $K8S_NAMESPACE 2>/dev/null || log_info "Creating new database deployment..."
  
  if ! kubectl get deployment maturity-db -n $K8S_NAMESPACE &>/dev/null; then
    kubectl create deployment maturity-db \
      --image=$db_uri \
      -n $K8S_NAMESPACE
    
    kubectl expose deployment maturity-db \
      --port=5432 \
      --target-port=5432 \
      --type=ClusterIP \
      -n $K8S_NAMESPACE
  fi
  
  kubectl rollout restart deployment/maturity-db -n $K8S_NAMESPACE
  kubectl rollout status deployment/maturity-db -n $K8S_NAMESPACE
  
  log_success "Database deployed successfully"
}

deploy_web_app() {
  log_info "Deploying web application..."
  
  local web_uri=$(cat /tmp/web_image_uri.txt)
  
  kubectl set image deployment/maturity-web \
    web=$web_uri \
    -n $K8S_NAMESPACE 2>/dev/null || log_info "Creating new web deployment..."
  
  if ! kubectl get deployment maturity-web -n $K8S_NAMESPACE &>/dev/null; then
    kubectl create deployment maturity-web \
      --image=$web_uri \
      -n $K8S_NAMESPACE
    
    kubectl expose deployment maturity-web \
      --port=80 \
      --target-port=3000 \
      --type=LoadBalancer \
      -n $K8S_NAMESPACE
  fi
  
  kubectl rollout restart deployment/maturity-web -n $K8S_NAMESPACE
  kubectl rollout status deployment/maturity-web -n $K8S_NAMESPACE
  
  log_success "Web application deployed successfully"
}

get_service_endpoints() {
  log_info "Getting service endpoints..."
  
  echo ""
  echo -e "${GREEN}========== SERVICE ENDPOINTS ==========${NC}"
  
  local db_ip=$(kubectl get service maturity-db -n $K8S_NAMESPACE -o jsonpath='{.spec.clusterIP}' 2>/dev/null)
  if [ ! -z "$db_ip" ]; then
    echo -e "Database: ${BLUE}$db_ip:5432${NC}"
  fi
  
  local web_lb=$(kubectl get service maturity-web -n $K8S_NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
  if [ ! -z "$web_lb" ]; then
    echo -e "Web App: ${BLUE}http://$web_lb${NC}"
  else
    echo -e "Web App: ${YELLOW}(Waiting for LoadBalancer IP...)${NC}"
  fi
  
  echo -e "${GREEN}=======================================${NC}"
  echo ""
}

cleanup_local_images() {
  log_info "Cleaning up local Docker images..."
  
  docker rmi maturity-web:$WEB_IMAGE_TAG 2>/dev/null || true
  docker rmi maturity-db:$DB_IMAGE_TAG 2>/dev/null || true
  
  log_success "Local images cleaned up"
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Maturity Assessment Platform - Complete Deployment       ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  log_info "Starting deployment process..."
  log_info "AWS Region: $AWS_REGION"
  log_info "EKS Cluster: $EKS_CLUSTER"
  log_info "Namespace: $K8S_NAMESPACE"
  echo ""
  
  check_prerequisites
  verify_aws_credentials
  
  log_info "Building Docker images..."
  build_web_image
  build_db_image
  
  log_info "Preparing ECR repositories..."
  create_ecr_repositories
  login_to_ecr
  
  log_info "Pushing images to ECR..."
  push_images_to_ecr
  
  log_info "Configuring Kubernetes..."
  configure_kubectl
  create_namespace
  create_db_secret
  
  log_info "Deploying services..."
  deploy_database
  deploy_web_app
  
  get_service_endpoints
  
  cleanup_local_images
  
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║            Deployment Completed Successfully!              ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  log_success "All services deployed!"
  log_info "Check status with: kubectl get all -n $K8S_NAMESPACE"
  log_info "View logs with: kubectl logs -f deployment/maturity-web -n $K8S_NAMESPACE"
  echo ""
}

# Run main function
main "$@"
