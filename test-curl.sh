#!/bin/bash

# Load environment variables
source .env.local

echo "Testing Gorgias API with curl..."
echo "Domain: $GORGIAS_DOMAIN"
echo "API Key: ${GORGIAS_API_KEY:0:10}... (first 10 chars)"
echo ""

# Test 1: Basic endpoint with Bearer token
echo "Test 1: Bearer token"
curl -v -H "Authorization: Bearer $GORGIAS_API_KEY" \
  "https://$GORGIAS_DOMAIN.gorgias.com/api/account"

echo -e "\n\n"

# Test 2: Basic auth with api:key
echo "Test 2: Basic auth (api:key)"
curl -v -u "api:$GORGIAS_API_KEY" \
  "https://$GORGIAS_DOMAIN.gorgias.com/api/account"

echo -e "\n\n"

# Test 3: If API key is already username:password format
echo "Test 3: Basic auth (direct key)"
curl -v -H "Authorization: Basic $(echo -n "$GORGIAS_API_KEY" | base64)" \
  "https://$GORGIAS_DOMAIN.gorgias.com/api/account"