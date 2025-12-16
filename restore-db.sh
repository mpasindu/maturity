#!/bin/bash

# Verify AWS credentials are loaded from environment
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS credentials not set"
  echo "Please load them first: source .env"
  exit 1
fi

echo "Getting RDS database details..."
aws rds describe-db-instances \
  --region us-east-1 \
  --db-instance-identifier maturity-assessment \
  --query 'DBInstances[0].[Endpoint.Address,Endpoint.Port,MasterUsername,DBName,VpcSecurityGroups[0].VpcSecurityGroupId]' \
  --output text

echo ""
echo "RDS Endpoint: maturity-assessment.ca1knf44urgk.us-east-1.rds.amazonaws.com"
echo "Port: 5432"
echo "Database: postgres"
echo "Username: postgres"
echo ""
echo "Checking if dump file exists..."
ls -lh /Users/pgunarathn/Documents/maturity/maturity_db_backup.dump
