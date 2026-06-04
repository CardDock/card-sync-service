-- CreateEnum
CREATE TYPE "Attribute" AS ENUM ('DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE');

-- CreateEnum
CREATE TYPE "LinkMarker" AS ENUM ('Top', 'Bottom', 'Left', 'Right', 'Bottom-Left', 'Bottom-Right', 'Top-Left', 'Top-Right');

-- CreateEnum
CREATE TYPE "FrameType" AS ENUM ('normal', 'effect', 'ritual', 'fusion', 'synchro', 'xyz', 'link', 'spell', 'trap', 'token', 'skill');

-- CreateEnum
CREATE TYPE "Race" AS ENUM ('Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast', 'Wyrm', 'Zombie', 'Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual', 'Counter');

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeline" TEXT[],
    "type" TEXT NOT NULL,
    "human_readable_card_type" TEXT NOT NULL,
    "frame_type" "FrameType" NOT NULL,
    "desc" TEXT NOT NULL,
    "race" "Race" NOT NULL,
    "atk" INTEGER,
    "def" INTEGER,
    "level" INTEGER,
    "scale" INTEGER,
    "linkval" INTEGER,
    "linkmarkers" "LinkMarker"[],
    "attribute" "Attribute",
    "rawData" JSON NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_external_id_key" ON "cards"("external_id");

-- CreateIndex
CREATE INDEX "cards_name_idx" ON "cards"("name");
