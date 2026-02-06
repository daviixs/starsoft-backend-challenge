#!/bin/bash

set -e

BASE_URL="http://localhost:3000/api"

echo "🎬 Cinema Booking System - Data Seeder"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1:${NC} Creating cinema session..."

SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "movieName": "Oppenheimer",
    "roomNumber": 1,
    "startsAt": "2026-02-15T19:00:00Z",
    "priceCents": 2500,
    "totalSeats": 24
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  echo "Response: $SESSION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Session created:${NC} $SESSION_ID"
echo ""

echo -e "${BLUE}Step 2:${NC} Checking availability..."

AVAILABILITY=$(curl -s "$BASE_URL/sessions/$SESSION_ID/availability")

echo "$AVAILABILITY" | jq '.'

echo ""
echo -e "${GREEN}✅ System ready!${NC}"
echo ""
echo "📋 Session Details:"
echo "  - ID: $SESSION_ID"
echo "  - Movie: Oppenheimer"
echo "  - Room: 1"
echo "  - Price: R$ 25.00"
echo "  - Total Seats: 24"
echo ""
echo "🎟️  You can now test reservations:"
echo "  curl -X POST $BASE_URL/bookings/reserve \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"userId\":\"user-123\",\"sessionId\":\"$SESSION_ID\",\"seatNumbers\":[\"A1\"]}'"
echo ""