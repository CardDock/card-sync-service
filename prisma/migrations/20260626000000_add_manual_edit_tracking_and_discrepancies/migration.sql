-- AlterTable
ALTER TABLE "cards" ADD COLUMN "manually_edited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cards" ADD COLUMN "manually_edited_at" TIMESTAMPTZ;

-- CreateEnum
CREATE TYPE "DiscrepancyStatus" AS ENUM ('PENDING', 'REVIEWED_LOCAL_WINS', 'REVIEWED_API_WINS', 'RESOLVED');

-- CreateTable
CREATE TABLE "card_sync_discrepancies" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "local_value" JSONB NOT NULL,
    "api_value" JSONB NOT NULL,
    "status" "DiscrepancyStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_sync_discrepancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_sync_discrepancies_card_id_field_name_key" ON "card_sync_discrepancies"("card_id", "field_name");

-- CreateIndex
CREATE INDEX "card_sync_discrepancies_status_idx" ON "card_sync_discrepancies"("status");

-- CreateIndex
CREATE INDEX "card_sync_discrepancies_card_id_idx" ON "card_sync_discrepancies"("card_id");

-- AddForeignKey
ALTER TABLE "card_sync_discrepancies" ADD CONSTRAINT "card_sync_discrepancies_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
