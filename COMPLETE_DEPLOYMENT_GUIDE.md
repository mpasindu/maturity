# Complete Deployment Guide - Maturity Assessment Platform

## Quick Start

### On Any Machine

1. **Clone and Navigate**

   ```bash
   git clone <repo>
   cd maturity
   ```

2. **Set AWS Credentials**

   ```bash
   # Option A: Copy example and edit
   cp .env.example .env
   # Edit .env with your credentials
   source .env

   # Option B: Export directly
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   export AWS_SESSION_TOKEN="your-token" # If using STS
   ```

3. **Run Deployment Script**

   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The script will:
   - Verify prerequisites (docker, aws-cli, kubectl, node, npm)
   - Build Docker images for web app and database
   - Create ECR repositories
   - Push images to ECR
   - Configure kubectl
   - Deploy to EKS cluster
   - Display service endpoints

### Prerequisites

- **Docker** - For building images
- **AWS CLI** - For ECR operations
- **kubectl** - For Kubernetes management
- **Node.js 18+** - For building web app
- **npm** - For package management

Install on macOS:

```bash
brew install docker aws-cli kubectl node
```

## File Structure

```
maturity/
├── deploy.sh                 # Main deployment script
├── Dockerfile               # Web app Docker image
├── Dockerfile.db           # Database Docker image
├── maturity_db_backup.dump # Database dump (auto-restored)
├── package.json
├── src/
├── prisma/
└── ... (other files)
```

## What Gets Deployed

### Web Application

- **Registry**: ECR (`cio-maturity-metrics:latest`)
- **Cluster**: CIO-initiatives (EKS)
- **Namespace**: maturity-assessment
- **Service**: LoadBalancer on port 80 → 3000
- **Health Check**: Every 30 seconds

### Database

- **Registry**: ECR (`cio-maturity-db:latest`)
- **Cluster**: CIO-initiatives (EKS)
- **Namespace**: maturity-assessment
- **Service**: ClusterIP on port 5432
- **Credentials**: postgres / Amazon123!
- **Database**: postgres (with restored dump)
- **Health Check**: pg_isready every 30 seconds

## Configuration

### Environment Variables (Set Before Running)

```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_SESSION_TOKEN="your-token"
```

### Default Configuration (In deploy.sh)

- **AWS_REGION**: us-east-1
- **EKS_CLUSTER**: CIO-initiatives
- **NAMESPACE**: maturity-assessment
- **WEB_SERVICE**: maturity-web (LoadBalancer)
- **DB_SERVICE**: maturity-db (ClusterIP)

Edit `deploy.sh` to change these values.

## Post-Deployment

### Check Deployment Status

```bash
kubectl get all -n maturity-assessment
kubectl describe deployment maturity-web -n maturity-assessment
kubectl describe deployment maturity-db -n maturity-assessment
```

### View Logs

```bash
# Web app logs
kubectl logs -f deployment/maturity-web -n maturity-assessment

# Database logs
kubectl logs -f deployment/maturity-db -n maturity-assessment
```

### Get Service Endpoints

```bash
# Web application URL
kubectl get service maturity-web -n maturity-assessment

# Database connection string
kubectl get service maturity-db -n maturity-assessment
```

### Scale Deployments

```bash
kubectl scale deployment maturity-web --replicas=3 -n maturity-assessment
kubectl scale deployment maturity-db --replicas=2 -n maturity-assessment
```

## Troubleshooting

### Script Stuck at "Logging into Docker"

- Check Docker daemon is running: `docker ps`
- Verify AWS credentials are valid
- Try manually: `aws ecr get-login-password --region us-east-1 | docker login ...`

### kubectl not configured

```bash
aws eks update-kubeconfig --name CIO-initiatives --region us-east-1
```

### Pod not starting

```bash
kubectl describe pod <pod-name> -n maturity-assessment
kubectl logs <pod-name> -n maturity-assessment
```

### Database connection fails

- Verify database pod is running: `kubectl get pods -n maturity-assessment`
- Check credentials in Kubernetes secret: `kubectl get secret maturity-db-secret -n maturity-assessment -o yaml`
- Test connection: `kubectl exec -it <web-pod> -n maturity-assessment -- env | grep DATABASE`

## Rollback Deployment

```bash
# Rollback web app
kubectl rollout undo deployment/maturity-web -n maturity-assessment

# Rollback database
kubectl rollout undo deployment/maturity-db -n maturity-assessment

# Check rollout history
kubectl rollout history deployment/maturity-web -n maturity-assessment
```

## Clean Up

```bash
# Delete services
kubectl delete service maturity-web maturity-db -n maturity-assessment

# Delete deployments
kubectl delete deployment maturity-web maturity-db -n maturity-assessment

# Delete namespace
kubectl delete namespace maturity-assessment

# Delete ECR repositories
aws ecr delete-repository --repository-name cio-maturity-metrics --force --region us-east-1
aws ecr delete-repository --repository-name cio-maturity-db --force --region us-east-1
```

## Database Details

- **Username**: postgres
- **Password**: Amazon123!
- **Port**: 5432
- **Database**: postgres
- **Schema**: public
- **Backup Restore**: Automatic on first deployment if `maturity_db_backup.dump` exists

## Security Notes

- Database password stored in Kubernetes Secret
- Images scanned in ECR
- Health checks ensure pod restart on failure
- Network policies can be added in K8s yaml files

## Support

For issues or questions:

1. Check logs: `kubectl logs deployment/<name> -n maturity-assessment`
2. Describe pod: `kubectl describe pod <pod-name> -n maturity-assessment`
3. Check events: `kubectl get events -n maturity-assessment`
