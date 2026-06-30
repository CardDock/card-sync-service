# card-sync-service

## Stack

- NestJS 10, TypeScript 5, pnpm, PostgreSQL (Neon), Prisma 7 (schema/migrations only), raw `pg` for queries
- Yu-Gi-Oh! card sync from YGOPRODeck API (`https://db.ygoprodeck.com/api/v7/cardinfo.php`)
- Swagger at `/api`, Pino logger, Husky + commitlint, Cucumber for BDD

## Architecture

- **DDD with Ports & Adapters**. All files under `src/context/card/`:
  - `domain/` — `Card` entity, 25 value objects, 13 ports (abstract classes), errors (`CardDomainValidationError` / `CardDomainProcessError` / `DomainError`), types for artwork, prints, sets, translations, sync
  - `application/use-cases/` — 15 use cases covering CRUD, sync, translations, artwork, prints, discrepancies
  - `infrastructure/` — NestJS controllers (`CardController`, `MediaController`, `SyncController`), `pg` pool provider, 5 repositories, YGOPRODeck HTTP client, local image storage, SQLite source adapter, Pino logger, mappers, field normalizers, DTOs, exception filters, logging interceptor
- `src/generated/prisma/` — Prisma client output (gitignored, regenerated on `prisma generate`)

## Commands

```
pnpm install
pnpm run start:dev          # nest start --watch --preserveWatchOutput --debug 0.0.0.0:9229
pnpm run build              # nest build
pnpm run clean              # rimraf dist
pnpm run lint               # eslint "{src,apps,libs,test}/**/*.ts" --cache
pnpm run lint:fix           # eslint with --fix
pnpm run format             # prettier --write .
pnpm run test               # jest (testMatch: tests/unit/**/*.spec.ts)
pnpm run test:cov           # with coverage
pnpm run test:e2e           # jest --config ./tests/e2e/jest-e2e.json
pnpm run test:bdd           # cucumber-js --format pretty
pnpm run validate           # lint + test + build
pnpm run start:prod         # cross-env NODE_ENV=production node dist/main.js
```

## Testing

- **Unit tests** in `tests/unit/` mirroring source tree (not co-located). Jest config in `package.json`.
- **E2E tests** in `tests/e2e/` with separate jest config `tests/e2e/jest-e2e.json`.
- **BDD tests** in `tests/bdd/` using Cucumber (5 feature files, 1 step definitions file).
- **Integration tests** in `tests/integration/`.
- **Test helpers** in `tests/helpers/` (card factory, logger mock, transaction manager mock).
- All unit tests are pure — no real database or HTTP calls. Use case tests mock ports with `jest.fn()`.
- Coverage: ~77% statements, ~75% branches (233 tests, 41 suites).

## DB / Prisma (6 models)

- `DIRECT_URL` env var required (postgres://...). Copied from `.env.example`.
- Prisma for schema & migrations only. Runtime queries use raw `pg` (node-postgres) via `PostgresPoolProvider`.
- `prisma.config.ts` provides `DIRECT_URL` at runtime. **Datasource block has no URL**.
- Models: `Card`, `CardTranslation` (no FK, unique on cardId+language), `CardSyncDiscrepancy`, `CardSet`, `Artwork`, `CardPrint`, `SyncJobLog`.
- Enums: `Attribute` (7), `LinkMarker` (8), `FrameType` (11), `Race` (28), `DiscrepancyStatus` (4), `SyncJobStatus` (4).
- Run `npx prisma generate` after schema changes to regenerate `src/generated/prisma/`.
- Migrations: `npx prisma migrate dev` (create, view migration SQL, apply). Currently 14 migrations.

## Env

- `dotenv/config` loaded in `main.ts` and `prisma.config.ts`. `.env` is gitignored.
- `DIRECT_URL` — DB connection string (required)
- `YGOPRODECK_API_BASE_URL` — optional override for card API
- `LOG_LEVEL` — error, warn, info, debug, trace (default: info)
- `PORT` — defaults to 3001

## Quirks

- `tsconfig.json`: `strictNullChecks: false`, `noImplicitAny: false`. Do not add strict mode types.
- **25 value objects** — every `Card` field is validated on construction via `CardDomainValidationError`.
- **13 ports** — `CardQueryRepository`, `CardRelatedDataRepository`, `CardRepository`, `CardSyncDiscrepancyRepository`, `CardTranslationRepository`, `ExternalCardSource`, `ExternalImageSource`, `ImageStorage`, `Logger`, `SqliteCardSource`, `SyncJobRepository`, `TransactionManager`.
- **15 use cases** — add artwork, add print, delete card, find-or-sync, get artworks, get image, get prints, list card sets, list cards, search by name, set translation, sync card, sync translations, update card, list/resolve discrepancies.
- Repositories use `ON CONFLICT (id) DO UPDATE` — upsert semantics.
- Field normalizers convert between external API labels (e.g. `"Beast-Warrior"`) and domain types (`"BeastWarrior"`).
- **i18n**: Cards synced from YGOPRODeck in English (canonical). Translations stored in `card_translations` table. `GET /cards/:id?language=es` and `GET /cards?name=...&language=es` merge at application layer. Fallback to English. Supported: `en`, `es`. `Language` value object validates.
- pnpm workspace: `allowBuilds` set for `@nestjs/core`, `@prisma/engines`, `prisma`.
- Husky hooks: `commit-msg` (commitlint), `pre-commit` (npm test), `pre-push` (pnpm run lint).
- 100% coverage files: `card.controller.ts`, `card-field-normalizers.ts`, `logging.interceptor.ts`, `domain-error.filter.ts`, `json-value.mapper.ts`, `language.value-object.ts`.
- Persistence layer (repos, pool, logger) at 0-10% — not mocked intentionally (low ROI). Business logic covered via use cases.
