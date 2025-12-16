#!/bin/bash
# Quick Deployment Reference Card
# Save this file and run: chmod +x deploy-quick.sh && ./deploy-quick.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Maturity Assessment - Quick Deployment Setup              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Load credentials from .env
echo "Step 1: Loading AWS Credentials..."
if [ -f ".env" ]; then
  source .env
  echo "✓ Credentials loaded from .env"
else
  echo "✗ .env file not found"
  echo ""
  echo "Create .env file:"
  echo "  cp .env.example .env"
  echo "  # Edit .env with your AWS credentials"
  echo "  source .env"
  echo "  ./deploy-quick.sh"
  echo ""
  exit 1
fi
echo ""

# 2. Verify setup
echo "Step 2: Verifying setup..."
command -v docker > /dev/null && echo "✓ Docker found" || echo "✗ Docker NOT found - install it first"
command -v aws > /dev/null && echo "✓ AWS CLI found" || echo "✗ AWS CLI NOT found - install it first"
command -v kubectl > /dev/null && echo "✓ kubectl found" || echo "✗ kubectl NOT found - install it first"
echo ""

# 3. Run main deployment
echo "Step 3: Starting deployment..."
echo ""
chmod +x ./deploy.sh
./deploy.sh
