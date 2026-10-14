# NFL Quiz Central

Football trivia / classroom quiz platform. Node.js 24 LTS, Express 5, Replit PostgreSQL.

## Setup (QA — Replit workspace)

1. Create `.env` with `DATABASE_URL` (QA database) and `SESSION_SECRET`. Never commit `.env`.
2. `npm install`
3. Apply schema: `psql $DATABASE_URL -f db/schema.sql`
4. (QA only) Seed test data: `psql $DATABASE_URL -f db/seed.sql`
5. `npm start`

## Branching

Work happens on `phase-N-...` feature branches; `main` only receives approved, tested merges.
