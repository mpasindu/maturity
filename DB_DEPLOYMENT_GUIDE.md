# PostgreSQL Deployment to ECS with Restored Database

## Overview

This deployment strategy creates a standalone PostgreSQL container with the restored database dump, deploys it to ECR, and runs it on ECS. This keeps the database separate from the web application.

## Prerequisites

- AWS CLI configured
- Docker installed
- AWS credentials with ECR and ECS permissions
- Database dump file: `maturity_db_backup.dump`

## Files Included

1. **Dockerfile.db** - PostgreSQL image with restored dump
2. **deploy-db-to-ecs.sh** - Automated deployment script
3. **ecs-task-definition-db.json** - ECS task definition template

## Step 1: Build and Push to ECR

```bash
# Make script executable
chmod +x deploy-db-to-ecs.sh

# Run deployment script
./deploy-db-to-ecs.sh
```

This script will:

- Create ECR repository if not exists
- Build Docker image with restored database
- Push image to ECR
- Output the ECR URI for use in ECS

## Step 2: Prepare ECS Task Definition

1. Get your AWS Account ID:

```bash
aws sts get-caller-identity --query Account --output text
```

2. Get your EFS ID (if using persistent storage):

```bash
aws efs describe-file-systems --region us-east-1 --query 'FileSystems[0].FileSystemId'
```

3. Create CloudWatch log group:

```bash
aws logs create-log-group --log-group-name /ecs/maturity-db --region us-east-1
```

4. Update **ecs-task-definition-db.json**:
   - Replace `REPLACE_WITH_ECR_URI` with output from Step 1
   - Replace `REPLACE_WITH_EFS_ID` with your EFS ID
   - Replace `ACCOUNT_ID` with your AWS Account ID (3 places)

## Step 3: Register Task Definition

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-db.json \
  --region us-east-1

# Get task definition ARN from output
```

## Step 4: Create ECS Service

```bash
# Create service in ECS cluster
aws ecs create-service \
  --cluster maturity-assessment \
  --service-name maturity-db \
  --task-definition maturity-db \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --region us-east-1
```

## Step 5: Configure Web App

Once the database is running on ECS:

1. Get the database endpoint:

```bash
aws ecs describe-services \
  --cluster maturity-assessment \
  --services maturity-db \
  --query 'services[0].taskDefinition' \
  --region us-east-1
```

2. Update web app environment variables with:
   - `DATABASE_URL=postgresql://postgres:Amazon123!@<DB_ENDPOINT>:5432/postgres?schema=public`

3. Update security groups to allow web app to connect to database security group on port 5432

## Database Credentials

- **Username**: postgres
- **Password**: Amazon123!
- **Port**: 5432
- **Database**: postgres

## Monitoring

Check service status:

```bash
aws ecs describe-services \
  --cluster maturity-assessment \
  --services maturity-db \
  --region us-east-1
```

View logs:

```bash
aws logs tail /ecs/maturity-db --follow --region us-east-1
```

## Rollback

If needed, update service with previous task definition:

```bash
aws ecs update-service \
  --cluster maturity-assessment \
  --service maturity-db \
  --task-definition maturity-db:PREVIOUS_VERSION \
  --region us-east-1
```

## Notes

- Database is persistent using EFS (Elastic File System)
- CPU: 256, Memory: 512MB (adjust as needed)
- Health checks enabled to auto-restart unhealthy containers
- Logs sent to CloudWatch Logs for monitoring
