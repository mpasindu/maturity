# Complete Deployment Guide - Maturity Assessment Platform

## Overview

This guide covers:

1. ✅ PostgreSQL Docker setup with database restoration
2. ✅ Repository push with git
3. ✅ Docker image build and ECR push
4. ✅ EKS deployment

## Prerequisites

- Docker & Docker Compose installed
- AWS CLI v2
- kubectl configured
- Git configured
- Database dump file: `maturity_db_backup.dump` (already present)

## Quick Start - One Command Deployment

```bash
# Complete deployment pipeline
./deploy-to-eks.sh
```

This single command will:

1. Push code to repository
2. Build Docker image
3. Push to ECR
4. Deploy to EKS
5. Display service URL

## Manual Step-by-Step Deployment

### Step 1: Database Setup (Local Development)

```bash
# Start Docker containers with PostgreSQL
docker-compose up -d

# Restore the database dump
./restore-database.sh

# Verify database is ready
docker exec maturity-postgres psql -U postgres -d maturity_assessment -c "\dt"
```

**Database Credentials:**

- Host: `localhost:5432` (local) or `postgres` (Docker)
- User: `postgres`
- Password: `root`
- Database: `maturity_assessment`

### Step 2: Git Operations

```bash
# Add all changes
git add -A

# Commit changes
git commit -m "chore: deployment and database configuration"

# Push to repository
git push -u origin main
```

### Step 3: Docker Build & Push to ECR

```bash
# Export AWS credentials
export AWS_ACCESS_KEY_ID="***REDACTED***"
export AWS_SECRET_ACCESS_KEY="***REDACTED***"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEJ7//////////wEaCXVzLWVhc3QtMSJIMEYCIQCSp6Y1EcWVMj94+yQpPxgVB77od3y50tBI0HwKxBHTeAIhAPb4/qcFHCDA6Qvd9SGgdFJgncdTendutWOqCKM/U4/HKogDCGcQABoMNDc1ODgyMzkxNjMxIgzK2Z8LS2yrmyPTRmAq5QJilXe4IyUE8CZYItDNBrYlNAzTBcHncLsJ1B8EYcm5oPTGquX+abfbl3dkBEp8ojZeJmWPdz2R6tnZF3jYdX0f+dsBzmFdLw/hlElRPY/gVrAvLxN2hIjNGg4NMmeOZV+Btc5w/4Ck9fQhcMoiRmeL68vT6+3CHnDHm5TDvDoRgmQbxYgWHAbjVg1Bjevo3bfVBpMUexVvelpKFhhSWZiLxGeK9oZtJ/cjyLDdxwHePJ+wmG7nc6KfJTs9ApiN7WWLgHj0Kt8XLHmTcMqaVIErsR8p5j/bKZVSlJv6uIHQV8DZepLyKJIAEOXfQovpDc5+wbrsqOIE03vM9ksfmST/DPMwUKycHSj36b542o39YlrOxCpA7WDypsx0UqZMi4NzmM/zd6/Z/TZ3C87hwDPtnoArCik5axDB8g192G2lD3/QWSQdgoBwhHvMHXk5TuVVZpQRnYHzadkRfS9w7LYe2E57vl4w3cGFygY6owHnMuFFxvaynDzupR9Kale9ncHgS+ScBjwgRcNblhIDfJotgHDXIQ5zNNg8IXn8VNOvabKi4BCxEFVSNYXP6BwBumo05C6gq2IhQR6yV1jfYrrKxvuBs4dAXzA/TkF2QNvr+x1+yljD9HS9uGkZjHyYOZOB+hZj3MWiuZOh9adS1LgNhoZjteH8A9AZh4wzJbcDH/gUpAbRTPG4Tw82RdZAkfa7"
export AWS_REGION="us-east-1"

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin 745882391631.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build image
docker build -t enterprise-architecture-maturity-platform:latest .

# Tag for ECR
docker tag enterprise-architecture-maturity-platform:latest 745882391631.dkr.ecr.${AWS_REGION}.amazonaws.com/enterprise-architecture-maturity-platform:latest

# Push to ECR
docker push 745882391631.dkr.ecr.${AWS_REGION}.amazonaws.com/enterprise-architecture-maturity-platform:latest
```

### Step 4: EKS Deployment

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name maturity-assessment

# Create namespace
kubectl create namespace maturity-assessment --dry-run=client -o yaml | kubectl apply -f -

# Create ECR secret for image pull (if needed)
kubectl create secret docker-registry ecr-secret \
  --docker-server=745882391631.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n maturity-assessment

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl rollout status deployment/maturity -n maturity-assessment

# Get service URL
kubectl get svc -n maturity-assessment
```

## Deployment Configuration

### Docker Compose Services

```yaml
postgres: # PostgreSQL 15 on port 5432
redis: # Redis 7 on port 6379
app: # Next.js app on port 3000
```

### Kubernetes Resources

- **Cluster:** maturity-assessment
- **Namespace:** maturity-assessment
- **Deployment:** maturity (2 replicas, scales to 10)
- **Service:** maturity-service (LoadBalancer with internet-facing access)

### Database Configuration

```bash
DATABASE_URL=postgresql://postgres:root@postgres:5432/maturity_assessment?schema=public
```

## Verification

### Local Development

```bash
# Check database
docker exec maturity-postgres psql -U postgres -d maturity_assessment -c "SELECT version();"

# Check if app is running
curl http://localhost:3000

# Check Wiley page
curl http://localhost:3000/wiley
```

### EKS Production

```bash
# Check pod status
kubectl get pods -n maturity-assessment

# Check service
kubectl get svc maturity-service -n maturity-assessment

# View logs
kubectl logs -f deployment/maturity -n maturity-assessment

# SSH into pod
kubectl exec -it <pod-name> -n maturity-assessment -- /bin/sh
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep maturity-postgres

# Check database logs
docker logs maturity-postgres

# Test connection
docker exec maturity-postgres psql -U postgres -c "SELECT 1"
```

### Docker Build Failures

```bash
# Clean up
docker system prune -a

# Rebuild
docker build -t enterprise-architecture-maturity-platform:latest --no-cache .
```

### EKS Deployment Issues

```bash
# Check pod events
kubectl describe pod <pod-name> -n maturity-assessment

# Check service endpoints
kubectl get endpoints maturity-service -n maturity-assessment

# Check LoadBalancer status
kubectl describe svc maturity-service -n maturity-assessment
```

## Cleanup

### Local Development

```bash
# Stop containers
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v
```

### EKS

```bash
# Delete deployment
kubectl delete deployment maturity -n maturity-assessment

# Delete service
kubectl delete svc maturity-service -n maturity-assessment

# Delete namespace
kubectl delete namespace maturity-assessment
```

## AWS Resources

- **AWS Account ID:** 745882391631
- **AWS Region:** us-east-1
- **ECR Repository:** enterprise-architecture-maturity-platform
- **EKS Cluster:** maturity-assessment
- **RDS Endpoint:** maturity-assessment.ca1knf44urgk.us-east-1.rds.amazonaws.com

## Security Notes

⚠️ **IMPORTANT:** The AWS credentials in the deployment scripts are temporary session tokens. For production:

1. Use IAM roles instead of hard-coded credentials
2. Use AWS Secrets Manager for sensitive data
3. Enable MFA for AWS console access
4. Rotate credentials regularly
5. Use separate AWS accounts for environments (dev/staging/prod)

## Next Steps

1. ✅ Run `./restore-database.sh` to restore database locally
2. ✅ Run `./deploy-to-eks.sh` to deploy to production
3. ✅ Verify deployment at the provided LoadBalancer URL
4. ✅ Monitor logs and metrics in CloudWatch

---

**Last Updated:** 2025-12-16
**Status:** Ready for Deployment
