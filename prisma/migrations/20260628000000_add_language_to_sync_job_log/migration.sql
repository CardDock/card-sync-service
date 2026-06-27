-- AlterTable: add language column to sync_job_logs
ALTER TABLE "sync_job_logs" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'es';

-- CreateIndex for language lookups
CREATE INDEX "sync_job_logs_language_idx" ON "sync_job_logs"("language");
