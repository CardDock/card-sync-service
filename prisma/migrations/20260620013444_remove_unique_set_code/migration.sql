-- DropIndex
DROP INDEX IF EXISTS "card_prints_set_code_key";

-- DropIndex (if created by unique constraint in PG)
ALTER TABLE "card_prints" DROP CONSTRAINT IF EXISTS "card_prints_set_code_key";
