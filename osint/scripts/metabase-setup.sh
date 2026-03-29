#!/bin/sh
# Auto-configure Metabase on first boot.
# Creates admin user, connects Postgres, removes sample DB.
# Skips silently if already configured.

METABASE_URL="http://metabase:3000"
MAX_WAIT=120

echo "[metabase-setup] Waiting for Metabase..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$METABASE_URL/api/health" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    echo "[metabase-setup] Ready (${elapsed}s)"
    break
  fi
  sleep 5
  elapsed=$((elapsed + 5))
done

if [ $elapsed -ge $MAX_WAIT ]; then
  echo "[metabase-setup] Timed out"
  exit 1
fi

# Check if first boot
SETUP_TOKEN=$(curl -s "$METABASE_URL/api/session/properties" | grep -o '"setup-token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SETUP_TOKEN" ] || [ "$SETUP_TOKEN" = "null" ]; then
  echo "[metabase-setup] Already configured, skipping"
  exit 0
fi

echo "[metabase-setup] First boot — creating admin user..."

# Step 1: Create admin user (skip DB in setup — it's unreliable)
curl -s -X POST "$METABASE_URL/api/setup" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$SETUP_TOKEN\",
    \"user\": {
      \"email\": \"admin@pharos.local\",
      \"password\": \"Pharos123!\",
      \"first_name\": \"Pharos\",
      \"last_name\": \"Admin\",
      \"site_name\": \"Pharos OSINT\"
    },
    \"prefs\": {
      \"allow_tracking\": false,
      \"site_name\": \"Pharos OSINT\"
    }
  }" > /dev/null 2>&1

# Step 2: Login to get session
echo "[metabase-setup] Logging in..."
SESSION=$(curl -s -X POST "$METABASE_URL/api/session" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@pharos.local","password":"Pharos123!"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION" ]; then
  echo "[metabase-setup] Login failed"
  exit 1
fi

# Step 3: Add Postgres database
echo "[metabase-setup] Connecting Pharos Postgres..."
DB_RESULT=$(curl -s -X POST "$METABASE_URL/api/database" \
  -H "Content-Type: application/json" \
  -H "X-Metabase-Session: $SESSION" \
  -d '{
    "engine": "postgres",
    "name": "Pharos DB",
    "details": {
      "host": "host.docker.internal",
      "port": 5434,
      "dbname": "pharos",
      "user": "pharos",
      "password": "pharos"
    }
  }')

if echo "$DB_RESULT" | grep -q '"id"'; then
  echo "[metabase-setup] Database connected!"
else
  echo "[metabase-setup] DB connection failed: $DB_RESULT"
fi

# Step 4: Remove the sample database (DB #1)
echo "[metabase-setup] Removing sample database..."
curl -s -X DELETE "$METABASE_URL/api/database/1" \
  -H "X-Metabase-Session: $SESSION" > /dev/null 2>&1

echo "[metabase-setup] Done! Login: admin@pharos.local / Pharos123!"
