-- Enable pg_trgm extension for trigram-based ILIKE indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index to accelerate WHERE "name" ILIKE '%term%' queries
-- The existing B-tree index on "name" cannot be used with leading wildcards
CREATE INDEX "cards_name_trgm_idx" ON "cards" USING GIN ("name" gin_trgm_ops);
