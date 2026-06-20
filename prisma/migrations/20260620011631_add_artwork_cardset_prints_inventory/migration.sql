-- CreateEnum
CREATE TYPE "CardCondition" AS ENUM ('MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'LIGHT_PLAYED', 'PLAYED', 'POOR');

-- CreateEnum
CREATE TYPE "CardLanguage" AS ENUM ('EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'JP');

-- AlterTable: add unique constraint on name
CREATE UNIQUE INDEX "cards_name_key" ON "cards"("name");

-- CreateTable
CREATE TABLE "card_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "card_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artworks" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_prints" (
    "id" TEXT NOT NULL,
    "artwork_id" TEXT NOT NULL,
    "card_set_id" TEXT NOT NULL,
    "set_code" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "rarity_code" TEXT,
    "set_price" DOUBLE PRECISION,

    CONSTRAINT "card_prints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_cards" (
    "id" TEXT NOT NULL,
    "artwork_id" TEXT NOT NULL,
    "card_print_id" TEXT,
    "condition" "CardCondition" NOT NULL,
    "language" "CardLanguage" NOT NULL,
    "is_first_edition" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "physical_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_sets_name_key" ON "card_sets"("name");

-- CreateIndex
CREATE INDEX "artworks_card_id_idx" ON "artworks"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "artworks_card_id_image_url_key" ON "artworks"("card_id", "image_url");

-- CreateIndex
CREATE UNIQUE INDEX "card_prints_set_code_key" ON "card_prints"("set_code");

-- CreateIndex
CREATE INDEX "card_prints_artwork_id_idx" ON "card_prints"("artwork_id");

-- CreateIndex
CREATE INDEX "card_prints_card_set_id_idx" ON "card_prints"("card_set_id");

-- CreateIndex
CREATE INDEX "physical_cards_artwork_id_idx" ON "physical_cards"("artwork_id");

-- CreateIndex
CREATE INDEX "physical_cards_card_print_id_idx" ON "physical_cards"("card_print_id");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_prints" ADD CONSTRAINT "card_prints_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_prints" ADD CONSTRAINT "card_prints_card_set_id_fkey" FOREIGN KEY ("card_set_id") REFERENCES "card_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_cards" ADD CONSTRAINT "physical_cards_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_cards" ADD CONSTRAINT "physical_cards_card_print_id_fkey" FOREIGN KEY ("card_print_id") REFERENCES "card_prints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
