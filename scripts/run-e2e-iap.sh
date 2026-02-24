#!/bin/bash
# IAP E2E Test Runner
# Follows Google Cloud IAP JWT authentication pattern

set -e

PROJECT_ID="cosmic-heaven-479306-v5"
SA_EMAIL="id-above-office-openclaw@${PROJECT_ID}.iam.gserviceaccount.com"
BASE_URL="${BASE_URL:-https://payrix-api-tester-dev-czwo4jlhdq-uc.a.run.app}"

echo "=== IAP E2E Test Runner ==="
echo "Project: $PROJECT_ID"
echo "Service Account: $SA_EMAIL"
echo "Base URL: $BASE_URL"
echo ""

# Check if gcloud is authenticated
echo "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "$SA_EMAIL"; then
    echo "⚠️  Not authenticated as $SA_EMAIL"
    echo "Current active account:"
    gcloud auth list --filter=status:ACTIVE --format="value(account)"
fi

# Create JWT payload
echo "Generating IAP JWT token..."
NOW=$(date +%s)
EXP=$((NOW + 3600))

JWT_PAYLOAD=$(cat <<EOF
{
  "iss": "$SA_EMAIL",
  "sub": "$SA_EMAIL",
  "aud": "$BASE_URL/*",
  "iat": $NOW,
  "exp": $EXP
}
EOF
)

echo "JWT Payload:"
echo "$JWT_PAYLOAD"
echo ""

# Sign JWT using IAMCredentials API
echo "Signing JWT with IAMCredentials API..."
if ! SIGNED_JWT=$(gcloud iam service-accounts sign-jwt \
    --iam-account="$SA_EMAIL" \
    /dev/stdin /dev/stdout <<< "$JWT_PAYLOAD" 2>&1); then
    echo "❌ Failed to sign JWT"
    echo "Error: $SIGNED_JWT"
    exit 1
fi

SIGNED_JWT=$(echo "$SIGNED_JWT" | tr -d '\n')
echo "✅ JWT signed successfully"
echo ""

# Preflight check
echo "Running preflight check..."
if curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $SIGNED_JWT" \
    "$BASE_URL/" | grep -q "200\|302\|307"; then
    echo "✅ Preflight check passed (service accessible)"
else
    echo "⚠️  Preflight check warning - service may still require additional auth"
fi
echo ""

# Run E2E tests
echo "Running E2E tests with IAP authentication..."
export IAP_ID_TOKEN="$SIGNED_JWT"
export BASE_URL="$BASE_URL"

if [ -f "e2e/default-prefill-iap.spec.ts" ]; then
    npx playwright test e2e/default-prefill-iap.spec.ts --workers=2 --reporter=list "$@"
else
    echo "❌ Test file not found: e2e/default-prefill-iap.spec.ts"
    exit 1
fi

echo ""
echo "=== E2E Tests Complete ==="
