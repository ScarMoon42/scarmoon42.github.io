#!/bin/sh
set -e

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRIES=0

# Извлекаем хост и порт из DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\).*|\2|p')

echo "Waiting for database at $DB_HOST:$DB_PORT ..."

# Используем /dev/tcp через node вместо nc, т.к. busybox nc в Alpine не поддерживает -z
until node -e "const s = require('net').createConnection({host:'$DB_HOST',port:$DB_PORT}); s.on('connect',()=>{s.end();process.exit(0)}); s.on('error',()=>process.exit(1));" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Could not connect to database at $DB_HOST:$DB_PORT after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Database not ready yet (attempt $RETRIES/$MAX_RETRIES)... retrying in ${RETRY_INTERVAL}s"
  sleep "$RETRY_INTERVAL"
done

echo "Database is ready!"
npx prisma migrate deploy

exec npm run dev:server
