#!/bin/bash

# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --region us-east-1 \
  --db-instance-identifier maturity-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.8 \
  --master-username dbadmin \
  --master-user-password 'MaturityDB2024SecurePass!' \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-0469799e3b4729e7d \
  --publicly-accessible \
  --backup-retention-period 7 \
  --no-multi-az \
  --storage-type gp3 \
  --db-name maturity_db \
  --tags Key=Name,Value=maturity-assessment-db

echo "RDS instance creation initiated. This will take 5-10 minutes."
echo "Check status with: aws rds describe-db-instances --region us-east-1 --db-instance-identifier maturity-postgres --query 'DBInstances[0].DBInstanceStatus'"
