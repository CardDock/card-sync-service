-- DropIndex
DROP INDEX "cards_name_trgm_idx";

-- CreateTable
CREATE TABLE "card_translations" (
    "card_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "type" TEXT,
    "human_readable_card_type" TEXT,
    "race" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "card_translations_card_id_language_key" ON "card_translations"("card_id", "language");

-- AddForeignKey
ALTER TABLE "card_translations" ADD CONSTRAINT "card_translations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
