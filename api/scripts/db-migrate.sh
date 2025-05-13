#!/bin/bash
set -e

echo -e "\n=========================================================================\n"
echo -e "\n=========================\n\nMigrating Data\n\n==========================\n"

if [ "$NODE_ENV" = "production" ]; then
    if [ -d "/app/db/migrations" ]; then
        echo "Running migrations for production..."
        npm run db:migration-run
    else
        echo "No migrations folder found, skipping migration."
    fi
else
    echo "Skipping migrations since NODE_ENV is not production"
fi

echo -e "\n=========================================================================\n"

exec "$@"
