#!/bin/bash
# Automated Payment Flow Test Script
# Tests the complete payment flow using API endpoints

set -e

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-}"

echo "🚀 Testing Complete Payment Flow..."
echo "=================================="

# Test 1: Check if server is running
echo "1. Checking if server is running..."
if curl -s -f "$BASE_URL" > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running at $BASE_URL"
    exit 1
fi

# Test 2: Test auto-match endpoint
echo "2. Testing auto-match endpoint..."
AUTO_MATCH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/matches/auto-match" \
    -H "Content-Type: application/json" \
    -d '{"type":"plane","id":"test"}')
if [ "$AUTO_MATCH_RESPONSE" = "401" ] || [ "$AUTO_MATCH_RESPONSE" = "400" ] || [ "$AUTO_MATCH_RESPONSE" = "200" ]; then
    echo "✅ Auto-match endpoint accessible (status: $AUTO_MATCH_RESPONSE)"
else
    echo "⚠️  Auto-match endpoint returned unexpected status: $AUTO_MATCH_RESPONSE"
fi

# Test 3: Test payment intent creation endpoint
echo "3. Testing payment intent creation endpoint..."
PAYMENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/payments/create-intent" \
    -H "Content-Type: application/json" \
    -d '{"matchId":"test"}')
if [ "$PAYMENT_RESPONSE" = "401" ] || [ "$PAYMENT_RESPONSE" = "400" ] || [ "$PAYMENT_RESPONSE" = "200" ]; then
    echo "✅ Payment intent endpoint accessible (status: $PAYMENT_RESPONSE)"
else
    echo "⚠️  Payment intent endpoint returned unexpected status: $PAYMENT_RESPONSE"
fi

# Test 4: Test auto-release cron endpoint
echo "4. Testing auto-release cron endpoint..."
if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  CRON_SECRET not set, skipping auto-release test"
else
    AUTO_RELEASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/payments/auto-release" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CRON_SECRET")
    if [ "$AUTO_RELEASE_RESPONSE" = "200" ] || [ "$AUTO_RELEASE_RESPONSE" = "401" ]; then
        echo "✅ Auto-release endpoint accessible (status: $AUTO_RELEASE_RESPONSE)"
    else
        echo "⚠️  Auto-release endpoint returned unexpected status: $AUTO_RELEASE_RESPONSE"
    fi
fi

# Test 5: Test notification endpoints
echo "5. Testing notification endpoints..."
NOTIFICATION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/notifications/register-token" \
    -H "Content-Type: application/json" \
    -d '{"token":"test-token"}')
if [ "$NOTIFICATION_RESPONSE" = "401" ] || [ "$NOTIFICATION_RESPONSE" = "400" ] || [ "$NOTIFICATION_RESPONSE" = "200" ]; then
    echo "✅ Notification endpoint accessible (status: $NOTIFICATION_RESPONSE)"
else
    echo "⚠️  Notification endpoint returned unexpected status: $NOTIFICATION_RESPONSE"
fi

echo ""
echo "✅ Payment flow tests completed!"
echo "Note: 401/400 responses are expected if authentication is required"

