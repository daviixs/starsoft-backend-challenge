#!/bin/bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./concurrency-test.sh <SESSION_ID>"
  exit 1
fi

SESSION_ID="$1"
SEAT_NUMBER="A1"
BASE_URL="http://localhost:3000/api"

# Generates UUID on Linux/macOS/Windows-Git-Bash without hard dependency on uuidgen.
make_uuid() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr 'A-Z' 'a-z'
    return
  fi

  if [ -r /proc/sys/kernel/random/uuid ]; then
    cat /proc/sys/kernel/random/uuid
    return
  fi

  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "[guid]::NewGuid().ToString().ToLower()" | tr -d '\r'
    return
  fi

  # Last resort pseudo UUID (keeps format for validation)
  printf '%08x-%04x-%04x-%04x-%012x\n' "$RANDOM$RANDOM" "$RANDOM" "$RANDOM" "$RANDOM" "$RANDOM$RANDOM$RANDOM"
}

echo "Concurrency Test - Cinema Booking System"
echo "==========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "Target Seat: $SEAT_NUMBER"
echo "Simulating: 10 simultaneous users"
echo ""

RESULTS_FILE=$(mktemp)

for i in {1..10}; do
  (
    USER_ID="$(make_uuid)"

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

    if [ "$HTTP_CODE" = "201" ]; then
      RESERVATION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
      echo "SUCCESS,$i,$USER_ID,${RESERVATION_ID:-NO_ID}" >>"$RESULTS_FILE"
    elif [ "$HTTP_CODE" = "409" ]; then
      echo "CONFLICT,$i,$USER_ID,CONFLICT" >>"$RESULTS_FILE"
    else
      echo "ERROR,$i,$USER_ID,HTTP_$HTTP_CODE" >>"$RESULTS_FILE"
    fi
  ) &
done

wait

echo "Results:"
echo ""
while IFS=',' read -r STATUS USER_NUM USER_ID RESULT; do
  echo "$STATUS User #$USER_NUM: $RESULT"
done <"$RESULTS_FILE"

SUCCESS=$(grep -c '^SUCCESS,' "$RESULTS_FILE" || true)
CONFLICTS=$(grep -c '^CONFLICT,' "$RESULTS_FILE" || true)
ERRORS=$(grep -c '^ERROR,' "$RESULTS_FILE" || true)

echo ""
echo "Summary:"
echo "  Successful: $SUCCESS"
echo "  Conflicts: $CONFLICTS"
echo "  Errors: $ERRORS"

echo ""
if [ "$SUCCESS" = "1" ]; then
  echo "TEST PASSED! Exactly 1 reservation succeeded (as expected)"
elif [ "$SUCCESS" = "0" ]; then
  echo "WARNING: No reservations succeeded (possible system issue)"
else
  echo "TEST FAILED! $SUCCESS reservations succeeded (expected only 1)"
  echo "This indicates a race condition bug!"
fi

rm -f "$RESULTS_FILE"
