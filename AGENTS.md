# card-sync-service

## Stack

- NestJS 10, TypeScript 5, pnpm, PostgreSQL (Neon), Prisma 7 (schema/migrations only), raw `pg` for queries
- Yu-Gi-Oh! card sync from YGOPRODeck API (`https://db.ygoprodeck.com/api/v7/cardinfo.php`)

## Architecture

- **DDD with Ports & Adapters**. All files under `src/context/card/`:
  - `domain/` — pure TS entities (`Card`), value objects (18x), ports (4 abstract classes), errors (`CardDomainValidationError` / `CardDomainProcessError`), types
  - `application/use-cases/` — `FindOrSyncCardByExternalIdUseCase`, `SearchCardByNameUseCase`, etc.
  - `infrastructure/` — NestJS controller (`GET /cards/:id?language=es`), `pg` pool provider, repositories (implements query + write + translation ports), YGOPRODeck HTTP client, mappers, field normalizers
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
- Migrations: `npx prisma migrate dev` (create, view migration SQL, apply).

## Env

- `dotenv/config` loaded in `main.ts` and `prisma.config.ts`. `.env` is gitignored.
- `DIRECT_URL` — DB connection string (required)
- `YGOPRODECK_API_BASE_URL` — optional override for card API
- `PORT` — defaults to 3000

## Quirks

- `tsconfig.json`: `strictNullChecks: false`, `noImplicitAny: false`. Do not add strict mode types.
- Prisma `datasource` block has **no URL** — the actual URL is provided at runtime via `prisma.config.ts` from `DIRECT_URL` env var.
- `Card` entity uses 17 value objects — every field is validated on construction via `CardDomainValidationError`.
- Repository uses `ON CONFLICT (id) DO UPDATE` — upsert semantics.
- Field normalizers convert between external API labels (e.g. `"Beast-Warrior"`) and domain types (`"BeastWarrior"`).
- **i18n**: Cards are always synced from YGOPRODeck in English (canonical). Translations stored in `card_translations` table. `GET /cards/:id?language=es` and `GET /cards?name=...&language=es` merge translations at the application layer. If no translation exists, English is the fallback. Supported languages: `en`, `es`. `Language` value object validates this.
- pnpm workspace: `allowBuilds` set for `@nestjs/core`, `@prisma/engines`, `prisma`.
- Coverage: ~77% statements, ~75% branches (233 tests, 41 suites). `src/generated/prisma/` excluido via `coveragePathIgnorePatterns` en Jest config.
- `card.controller.ts`, `card-field-normalizers.ts`, `logging.interceptor.ts`, `domain-error.filter.ts`, `json-value.mapper.ts`, `language.value-object.ts` al 100%.
- `postgres-card.mapper.ts` al 95.65% (solo línea 98 sin cubrir: `inner === ''`, caso borde de Postgres).
- Capa de persistencia (repos, pool, logger) con 0-10% — no mockeada intencionalmente por bajo ROI. Business logic cubierta via use cases.
