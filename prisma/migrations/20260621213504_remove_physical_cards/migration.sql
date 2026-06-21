-- DropForeignKey
ALTER TABLE "physical_cards" DROP CONSTRAINT IF EXISTS "physical_cards_artwork_id_fkey";

-- DropForeignKey
ALTER TABLE "physical_cards" DROP CONSTRAINT IF EXISTS "physical_cards_card_print_id_fkey";

-- DropTable
DROP TABLE "physical_cards";

-- DropEnum
DROP TYPE "CardCondition";

-- DropEnum
DROP TYPE "CardLanguage";
