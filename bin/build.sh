#!/bin/bash

set -e

psql $DATABASE_URL -c 'DROP TABLE IF EXISTS "session";'
psql $DATABASE_URL -f node_modules/connect-pg-simple/table.sql

echo "Database setup complete"
