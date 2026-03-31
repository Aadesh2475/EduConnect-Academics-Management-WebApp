#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Waiting for database to be ready..."
# The app service depends on db, but postgres might take a few seconds to initialize.
# We'll use a simple sleep for now, or you can add a more robust check.
sleep 5

# Apply migrations or push schema using the locally installed Prisma CLI
echo "Pushing database schema..."

npx prisma db push --accept-data-loss --skip-generate

echo "Starting the application..."
exec "$@"
