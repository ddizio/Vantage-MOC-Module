#!/bin/sh
set -e

mkdir -p /app/data/uploads

# Apply any pending database migrations, then seed the first admin account
# (the seed is a no-op when users already exist).
npx prisma migrate deploy
npx tsx prisma/seed.ts

exec npm run start
