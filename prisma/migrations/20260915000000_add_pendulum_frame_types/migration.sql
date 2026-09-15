-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "FrameType" ADD VALUE 'normal_pendulum';
ALTER TYPE "FrameType" ADD VALUE 'effect_pendulum';
ALTER TYPE "FrameType" ADD VALUE 'ritual_pendulum';
ALTER TYPE "FrameType" ADD VALUE 'fusion_pendulum';
ALTER TYPE "FrameType" ADD VALUE 'synchro_pendulum';
ALTER TYPE "FrameType" ADD VALUE 'xyz_pendulum';
