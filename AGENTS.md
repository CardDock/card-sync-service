# card-sync-service

## Stack

- NestJS 10, TypeScript 5, pnpm, PostgreSQL (Neon), Prisma 7 (schema/migrations only), raw `pg` for queries
- Yu-Gi-Oh! card sync from YGOPRODeck API (`https://db.ygoprodeck.com/api/v7/cardinfo.php`)

## Architecture

- **DDD with Ports & Adapters**. All files under `src/context/card/`:
  - `domain/` — pure TS entities (`Card`), value objects (17x), ports (3 interfaces), errors (`CardDomainValidationError` / `CardDomainProcessError`), types
  - `application/use-cases/` — `FindOrSyncCardByExternalIdUseCase` — single orchestrator
  - `infrastructure/` — NestJS controller (`GET /cards/:externalId`), `pg` pool provider, repository (implements both query + write ports), YGOPRODeck HTTP client, mappers, field normalizers
- `src/generated/prisma/` — Prisma client output (gitignored, regenerated on `prisma generate`)

## Commands

```
pnpm install
pnpm run start:dev          # nest start --watch
pnpm run build                # nest build
pnpm run lint                 # eslint with --fix
pnpm run format               # prettier
pnpm run test                 # jest (unit tests, rootDir=src, matches *.spec.ts)
pnpm run test:cov             # with coverage
pnpm run test:e2e             # jest --config ./test/jest-e2e.json (rootDir=test)
pnpm run start:prod           # node dist/main
```

## Testing

- Unit tests live in `src/tests/` mirroring source tree (not co-located). Jest config in `package.json`.
- E2E tests in `test/` with separate jest config `test/jest-e2e.json`.
- All tests are pure unit/integration — no real database or HTTP calls in CI.
- Use case tests mock ports directly with `jest.fn()`.

## DB / Prisma

- `DIRECT_URL` env var required (postgres://...). Copied from `.env.example`.
- Prisma for schema & migrations only. Runtime queries use raw `pg` (node-postgres) via `PostgresPoolProvider`.
- Run `npx prisma generate` after schema changes to regenerate `src/generated/prisma/`.
- Migrations: `npx prisma migrate dev` (two exist: init, add Fish race).

## Env

- `dotenv/config` loaded in `main.ts` and `prisma.config.ts`. `.env` is gitignored.
- `DIRECT_URL` — DB connection string (required)
- `YGOPRODECK_API_BASE_URL` — optional override for card API
- `PORT` — defaults to 3000

## Quirks

- `tsconfig.json`: `strictNullChecks: false`, `noImplicitAny: false`. Do not add strict mode types.
- Prisma `datasource` block has **no URL** — the actual URL is provided at runtime via `prisma.config.ts` from `DIRECT_URL` env var.
- `Card` entity uses 17 value objects — every field is validated on construction via `CardDomainValidationError`.
- Repository uses `ON CONFLICT (external_id) DO UPDATE` — upsert semantics.
- Field normalizers convert between external API labels (e.g. `"Beast-Warrior"`) and domain types (`"BeastWarrior"`).
- pnpm workspace: `allowBuilds` set for `@nestjs/core`, `@prisma/engines`, `prisma`.
