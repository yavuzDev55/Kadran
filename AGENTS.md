# KADRAN Agent Instructions

KADRAN is a full-stack academic task and calendar manager for university
students. The repository contains a Node.js/Express/Prisma backend and a
React/Vite frontend.

## Project structure

- `kadran-backend/prisma/` — Prisma schema and database migrations.
- `kadran-backend/src/features/` — backend features organized by domain.
- `kadran-backend/src/shared/` — shared middleware and utilities.
- `kadran-backend/tests/` — backend tests, runnable without a database.
- `kadran-frontend/src/` — React pages, components, services, and utilities.

## Development commands

Run from the repository root unless noted:

- `npm run dev` — start the backend and frontend together.
- `npm --prefix kadran-backend test` — run backend tests.
- `npm --prefix kadran-frontend run lint` — lint the frontend.
- `npm --prefix kadran-frontend run build` — build the frontend.

Install dependencies with `npm install --prefix kadran-backend`,
`npm install --prefix kadran-frontend`, and `npm install` at the repository
root. Configure `kadran-backend/.env` using `.env.example` before starting the
backend; database migrations are managed with Prisma.

## Implementation conventions

- Keep backend features in the existing router, validator, controller, service,
  and database-layer pattern.
- Enforce authentication and user ownership in backend operations.
- Keep task rules in `kadran-backend/src/features/task/task.rules.js` and
  `kadran-frontend/src/utils/taskRules.js` consistent.
- Follow the API, setup, and domain documentation in `README.md`; update it
  when user-visible behavior, API contracts, or setup steps change.
