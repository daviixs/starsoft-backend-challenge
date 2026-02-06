#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./concurrency-test.sh <SESSION_ID>"
  exit 1
fi

SESSION_ID="$1"
SEAT_NUMBER="A1"
BASE_URL="http://localhost:3000/api"

echo "🔥 Concurrency Test - Cinema Booking System"
echo "==========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "Target Seat: $SEAT_NUMBER"
echo "Simulating: 10 simultaneous users"
echo ""

SUCCESS_COUNT=0
CONFLICT_COUNT=0

# Arquivo temporário para resultados
RESULTS_FILE=$(mktemp)

for i in {1..10}; do
  (
    USER_ID="user-$(uuidgen)"
    
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
      "$BASE_URL/bookings/reserve" \
      -H "Content-Type: application/json" \
      -d "{
        \"userId\": \"$USER_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"seatNumbers\": [\"$SEAT_NUMBER\"]
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" == "201" ]; then
      RESERVATION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
      echo "✅,$i,$USER_ID,$RESERVATION_ID" >> "$RESULTS_FILE"
    elif [ "$HTTP_CODE" == "409" ]; then
      echo "❌,$i,$USER_ID,CONFLICT" >> "$RESULTS_FILE"
    else
      echo "⚠️,$i,$USER_ID,ERROR_$HTTP_CODE" >> "$RESULTS_FILE"
    fi
  ) &
done

# Aguardar todos os processos
wait

echo "📊 Results:"
echo ""

cat "$RESULTS_FILE" | while IFS=',' read -r STATUS USER_NUM USER_ID RESULT; do
  echo "$STATUS User #$USER_NUM: $RESULT"
  
  if [ "$STATUS" == "✅" ]; then
    ((SUCCESS_COUNT++)) || true
  elif [ "$STATUS" == "❌" ]; then
    ((CONFLICT_COUNT++)) || true
  fi
done

echo ""
echo "📈 Summary:"
grep -c "^✅" "$RESULTS_FILE" && echo "  Successful: $(grep -c '^✅' $RESULTS_FILE)" || echo "  Successful: 0"
grep -c "^❌" "$RESULTS_FILE" && echo "  Conflicts: $(grep -c '^❌' $RESULTS_FILE)" || echo "  Conflicts: 0"
grep -c "^⚠️" "$RESULTS_FILE" && echo "  Errors: $(grep -c '^⚠️' $RESULTS_FILE)" || echo "  Errors: 0"

echo ""

SUCCESS=$(grep -c "^✅" "$RESULTS_FILE" || echo "0")

if [ "$SUCCESS" == "1" ]; then
  echo "🎉 TEST PASSED! Exactly 1 reservation succeeded (as expected)"
elif [ "$SUCCESS" == "0" ]; then
  echo "⚠️  WARNING: No reservations succeeded (possible system issue)"
else
  echo "❌ TEST FAILED! $SUCCESS reservations succeeded (expected only 1)"
  echo "   This indicates a race condition bug!"
fi

rm "$RESULTS_FILE"