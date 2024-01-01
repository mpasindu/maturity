#!/bin/bash
# Quick Deployment Reference Card
# Save this file and run: chmod +x deploy-quick.sh && ./deploy-quick.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Maturity Assessment - Quick Deployment Setup              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Set credentials
echo "Step 1: Setting AWS Credentials..."
export AWS_ACCESS_KEY_ID="***REDACTED***"
export AWS_SECRET_ACCESS_KEY="***REDACTED***"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEJ7//////////wEaCXVzLWVhc3QtMSJIMEYCIQCSp6Y1EcWVMj94+yQpPxgVB77od3y50tBI0HwKxBHTeAIhAPb4/qcFHCDA6Qvd9SGgdFJgncdTendutWOqCKM/U4/HKogDCGcQABoMNDc1ODgyMzkxNjMxIgzK2Z8LS2yrmyPTRmAq5QJilXe4IyUE8CZYItDNBrYlNAzTBcHncLsJ1B8EYcm5oPTGquX+abfbl3dkBEp8ojZeJmWPdz2R6tnZF3jYdX0f+dsBzmFdLw/hlElRPY/gVrAvLxN2hIjNGg4NMmeOZV+Btc5w/4Ck9fQhcMoiRmeL68vT6+3CHnDHm5TDvDoRgmQbxYgWHAbjVg1Bjevo3bfVBpMUexVvelpKFhhSWZiLxGeK9oZtJ/cjyLDdxwHePJ+wmG7nc6KfJTs9ApiN7WWLgHj0Kt8XLHmTcMqaVIErsR8p5j/bKZVSlJv6uIHQV8DZepLyKJIAEOXfQovpDc5+wbrsqOIE03vM9ksfmST/DPMwUKycHSj36b542o39YlrOxCpA7WDypsx0UqZMi4NzmM/zd6/Z/TZ3C87hwDPtnoArCik5axDB8g192G2lD3/QWSQdgoBwhHvMHXk5TuVVZpQRnYHzadkRfS9w7LYe2E57vl4w3cGFygY6owHnMuFFxvaynDzupR9Kale9ncHgS+ScBjwgRcNblhIDfJotgHDXIQ5zNNg8IXn8VNOvabKi4BCxEFVSNYXP6BwBumo05C6gq2IhQR6yV1jfYrrKxvuBs4dAXzA/TkF2QNvr+x1+yljD9HS9uGkZjHyYOZOB+hZj3MWiuZOh9adS1LgNhoZjteH8A9AZh4wzJbcDH/gUpAbRTPG4Tw82RdZAkfa7"
echo "✓ Credentials set"
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
