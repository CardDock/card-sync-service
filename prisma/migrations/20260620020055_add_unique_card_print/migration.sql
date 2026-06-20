-- CreateUniqueIndex
CREATE UNIQUE INDEX "card_prints_artwork_id_card_set_id_set_code_rarity_key"
  ON "card_prints"("artwork_id", "card_set_id", "set_code", "rarity");
