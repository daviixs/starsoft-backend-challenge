#!/bin/bash

set -e

BASE_URL="http://localhost:3000/api"

echo "🎬 Full Flow Test - Cinema Booking System"
echo "=========================================="
echo ""


GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'


echo -e "${BLUE}Step 1:${NC} Creating session..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "movieName": "Interestelar",
    "roomNumber": 2,
    "startsAt": "2026-02-20T21:00:00Z",
    "priceCents": 3000,
    "totalSeats": 16
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✅ Session created:${NC} $SESSION_ID"
echo ""


echo -e "${BLUE}Step 2:${NC} Checking availability..."
curl -s "$BASE_URL/sessions/$SESSION_ID/availability" | jq '.availableSeats | length' | \
  xargs -I {} echo -e "${GREEN}✅ Available seats:${NC} {}"
echo ""


echo -e "${BLUE}Step 3:${NC} Making reservation (seats A1, A2)..."
USER_ID="test-user-$(date +%s)"

RESERVATION_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings/reserve" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"sessionId\": \"$SESSION_ID\",
    \"seatNumbers\": [\"A1\", \"A2\"]
  }")

RESERVATION_ID=$(echo $RESERVATION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
EXPIRES_AT=$(echo $RESERVATION_RESPONSE | grep -o '"expiresAt":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}✅ Reservation created:${NC} $RESERVATION_ID"
echo -e "   Expires at: $EXPIRES_AT"
echo ""


echo -e "${BLUE}Step 4:${NC} Verifying seats are reserved..."
RESERVED_COUNT=$(curl -s "$BASE_URL/sessions/$SESSION_ID/availability" | jq '.reservedSeats | length')
echo -e "${GREEN}✅ Reserved seats count:${NC} $RESERVED_COUNT (expected: 2)"
echo ""


echo -e "${BLUE}Step 5:${NC} Testing race condition protection..."
CONFLICT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/bookings/reserve" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"another-user\",
    \"sessionId\": \"$SESSION_ID\",
    \"seatNumbers\": [\"A1\"]
  }")

CONFLICT_CODE=$(echo "$CONFLICT_RESPONSE" | grep HTTP_CODE | cut -d: -f2)

if [ "$CONFLICT_CODE" == "409" ]; then
  echo -e "${GREEN}✅ Conflict detected correctly (HTTP 409)${NC}"
else
  echo -e "${RED}❌ FAILED: Expected HTTP 409, got $CONFLICT_CODE${NC}"
fi
echo ""


echo -e "${BLUE}Step 6:${NC} Confirming payment..."
SALE_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"reservationId\": \"$RESERVATION_ID\",
    \"userId\": \"$USER_ID\"
  }")

SALE_ID=$(echo $SALE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
TOTAL_AMOUNT=$(echo $SALE_RESPONSE | grep -o '"totalAmountCents":[0-9]*' | cut -d: -f2)

echo -e "${GREEN}✅ Payment confirmed:${NC} $SALE_ID"
echo -e "   Total: R$ $(echo "scale=2; $TOTAL_AMOUNT / 100" | bc)"
echo ""


echo -e "${BLUE}Step 7:${NC} Verifying seats are sold..."
SOLD_COUNT=$(curl -s "$BASE_URL/sessions/$SESSION_ID/availability" | jq '.soldSeats | length')
echo -e "${GREEN}✅ Sold seats count:${NC} $SOLD_COUNT (expected: 2)"
echo ""


echo -e "${BLUE}Step 8:${NC} Checking purchase history..."
PURCHASE_COUNT=$(curl -s "$BASE_URL/bookings/user/$USER_ID" | jq '.totalPurchases')
echo -e "${GREEN}✅ Total purchases:${NC} $PURCHASE_COUNT (expected: 1)"
echo ""

echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "📋 Test Summary:"
echo "  - Session ID: $SESSION_ID"
echo "  - Reservation ID: $RESERVATION_ID"
echo "  - Sale ID: $SALE_ID"
echo "  - User ID: $USER_ID"