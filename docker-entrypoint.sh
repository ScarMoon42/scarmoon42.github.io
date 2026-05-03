#!/bin/sh
set -e

echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=2
RETRIES=0

# Извлекаем хост и порт из DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\).*|\2|p')

until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Could not connect to database at $DB_HOST:$DB_PORT after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Database not ready yet (attempt $RETRIES/$MAX_RETRIES)... retrying in ${RETRY_INTERVAL}s"
  sleep "$RETRY_INTERVAL"
done

echo "Database is ready! Running migrations..."
npx prisma migrate deploy

echo "Starting server..."
exec npm run dev:server
