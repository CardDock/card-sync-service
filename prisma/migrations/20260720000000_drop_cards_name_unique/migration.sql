-- DropUniqueIndex
-- Yu-Gi-Oh! has multiple card printings sharing the same name (e.g. "Kuriboh"
-- has dozens of variants with different IDs). The unique constraint on
-- cards.name prevented syncing more than one variant, breaking searches
-- that resolve to multiple IDs (e.g. translating "kuriboh" returns every
-- printing's id and the second sync attempt failed with 23505).
-- The non-unique index on name is preserved for search performance.
DROP INDEX "cards_name_key";
