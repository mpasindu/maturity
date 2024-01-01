#!/bin/bash

export AWS_ACCESS_KEY_ID="***REDACTED***"
export AWS_SECRET_ACCESS_KEY="***REDACTED***"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEHgaCXVzLWVhc3QtMSJHMEUCIB9d73zggknoC+E72W1/skP9oZCEBZLJaY8hI47MpJoSAiEA+CM6O4awn3EGpHfuxVP8+OkDMmj8m/WuG/CwmdowjAgqiAMIQRAAGgw0NzU4ODIzOTE2MzEiDDOVSuBIk9D9AweYVirlAr0x1U/TDeN2dyKlg9lYnFYTAD9onLdQMtLC6iD5HeXhSJKx7q3t0QRkOKdxrN1c7hNbPlMHiP8nu7Ex5qTLFElgdAA+EA60ABJC9nVNWsbQrD08lyaw4CFtZ0GggzCHFRh6RlCh19u5JBtGklOu6kWH198agJUP/6E9IWz0fHZZIanyvTS5E1CtbvA7//EXmYyoWn4JRFh/VEA40t5eQAD2v7A6YCYa58X03JX80waWqNSYHBs/43A/GZaYLHY9mLdYi6Zu+mFv29l6YJFaEmzT4aZk22t4f4cZcznvKAhc1+h8WjRO2At4k78EWAzUTOGgbp+ysg/qJwtLNQFsR1eNzW0Hj6ygSkbzWOC5DiZby+KpkkkF25Yex9yDSDc6c7pojB/fj7KB+2dhjWeGmCLU/Saen0yT3bpwT3mFRoCwDowaCZBqLG+nA3UFPL57kmghc/olpdEpCLCygjAcwZhdQn1Q1DC/kP3JBjqkAUA6WcDvodT7csM7G8NkVy94a+BcM1inC1QGgGcFRwdQJAjEXuEqBp0kz6kDC8DRuZSOE5dDUCMkA+lcih5e20z028EgdaY8INTp4Pb3obpYrCL3UJjBnaj2BEWgb7S1wZz2GhamxkoB4nKEBNyOzbvUg5zsHz4G96raoiF0NCEi0qR34LSX036MyOnkOAEOPYX/nY15B9HXg2ZP+S7+A+pJ8WLO"

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
