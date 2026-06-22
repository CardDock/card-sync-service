-- Re-create trigram index dropped by Prisma auto-migration
CREATE INDEX IF NOT EXISTS "cards_name_trgm_idx" ON "cards" USING GIN ("name" gin_trgm_ops);
