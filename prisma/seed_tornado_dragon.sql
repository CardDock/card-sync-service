-- ============================================================
-- Seed: Tornado Dragon (YGOPRODeck ID: 6983839)
-- Idempotent — safe to run multiple times
-- ============================================================

-- ============================================================
-- 1. Insert / ignore Card
-- ============================================================
INSERT INTO cards (id, name, typeline, type, human_readable_card_type, frame_type, "desc", race, atk, def, level, scale, linkval, linkmarkers, attribute, "rawData")
VALUES (
  '6983839',
  'Tornado Dragon',
  ARRAY['Wyrm', 'Xyz', 'Effect'],
  'XYZ Monster',
  'Xyz Effect Monster',
  'xyz'::"FrameType",
  '2 Level 4 monsters\nOnce per turn (Quick Effect): You can detach 1 material from this card, then target 1 Spell/Trap on the field; destroy it.',
  'Wyrm'::"Race",
  2100,
  2000,
  4,
  NULL,
  NULL,
  ARRAY[]::"LinkMarker"[],
  'WIND'::"Attribute",
  '{
  "id": 6983839,
  "name": "Tornado Dragon",
  "typeline": ["Wyrm", "Xyz", "Effect"],
  "type": "XYZ Monster",
  "humanReadableCardType": "Xyz Effect Monster",
  "frameType": "xyz",
  "desc": "2 Level 4 monsters\nOnce per turn (Quick Effect): You can detach 1 material from this card, then target 1 Spell/Trap on the field; destroy it.",
  "race": "Wyrm",
  "atk": 2100,
  "def": 2000,
  "level": 4,
  "attribute": "WIND",
  "ygoprodeck_url": "https://ygoprodeck.com/card/tornado-dragon-8538",
  "card_sets": [
    {"set_name": "Battles of Legend: Relentless Revenge", "set_code": "BLRR-EN084", "set_rarity": "Secret Rare", "set_rarity_code": "(ScR)", "set_price": "0"},
    {"set_name": "Crossover Breakers", "set_code": "CRBR-EN013", "set_rarity": "Rare", "set_rarity_code": "(R)", "set_price": "0"},
    {"set_name": "Crossover Breakers", "set_code": "CRBR-EN013", "set_rarity": "Super Rare", "set_rarity_code": "(SR)", "set_price": "0"},
    {"set_name": "Duel Devastator", "set_code": "DUDE-EN019", "set_rarity": "Ultra Rare", "set_rarity_code": "(UR)", "set_price": "1.58"},
    {"set_name": "Legendary Duelists: Synchro Storm", "set_code": "LED8-EN055", "set_rarity": "Common", "set_rarity_code": "(C)", "set_price": "0.96"},
    {"set_name": "Legendary Modern Decks 2026", "set_code": "L26D-ENM23", "set_rarity": "Common", "set_rarity_code": "(C)", "set_price": "0"},
    {"set_name": "Maximum Crisis", "set_code": "MACR-EN081", "set_rarity": "Secret Rare", "set_rarity_code": "(ScR)", "set_price": "0"},
    {"set_name": "Quarter Century Stampede", "set_code": "RA04-EN289", "set_rarity": "Platinum Secret Rare", "set_rarity_code": "(PS)", "set_price": "0"},
    {"set_name": "Quarter Century Stampede", "set_code": "RA04-EN289", "set_rarity": "Quarter Century Secret Rare", "set_rarity_code": "", "set_price": "0"}
  ],
  "card_images": [{"id": 6983839, "image_url": "https://images.ygoprodeck.com/images/cards/6983839.jpg", "image_url_small": "https://images.ygoprodeck.com/images/cards_small/6983839.jpg", "image_url_cropped": "https://images.ygoprodeck.com/images/cards_cropped/6983839.jpg"}],
  "card_prices": [{"cardmarket_price": "0.06", "tcgplayer_price": "0.10", "ebay_price": "0.99", "amazon_price": "1.39", "coolstuffinc_price": "0.25"}]
}'::json
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "rawData" = EXCLUDED."rawData";

-- ============================================================
-- 2. Insert / ignore Card Sets
-- ============================================================
INSERT INTO card_sets (id, name, code)
VALUES
  (gen_random_uuid(), 'Battles of Legend: Relentless Revenge', 'BLRR'),
  (gen_random_uuid(), 'Crossover Breakers',                   'CRBR'),
  (gen_random_uuid(), 'Duel Devastator',                      'DUDE'),
  (gen_random_uuid(), 'Legendary Duelists: Synchro Storm',    'LED8'),
  (gen_random_uuid(), 'Legendary Modern Decks 2026',          'L26D'),
  (gen_random_uuid(), 'Maximum Crisis',                        'MACR'),
  (gen_random_uuid(), 'Quarter Century Stampede',              'RA04')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. Insert Artwork (unique per card_id + image_url)
-- ============================================================
INSERT INTO artworks (id, card_id, image_url)
VALUES (gen_random_uuid(), '6983839', 'https://images.ygoprodeck.com/images/cards/6983839.jpg')
ON CONFLICT (card_id, image_url) DO NOTHING;

-- ============================================================
-- 4. Insert Card Prints (unique per artwork + set + code + rarity)
-- ============================================================
WITH
artwork_id AS (
  SELECT a.id FROM artworks a
  WHERE a.card_id = '6983839'
  LIMIT 1
),
prints_data(set_name, set_code, rarity, rarity_code, set_price) AS (
  VALUES
    ('Battles of Legend: Relentless Revenge', 'BLRR-EN084', 'Secret Rare',              '(ScR)', 0),
    ('Crossover Breakers',                    'CRBR-EN013', 'Rare',                      '(R)',   0),
    ('Crossover Breakers',                    'CRBR-EN013', 'Super Rare',                '(SR)',  0),
    ('Duel Devastator',                        'DUDE-EN019', 'Ultra Rare',                '(UR)',  1.58),
    ('Legendary Duelists: Synchro Storm',      'LED8-EN055', 'Common',                    '(C)',   0.96),
    ('Legendary Modern Decks 2026',            'L26D-ENM23', 'Common',                    '(C)',   0),
    ('Maximum Crisis',                         'MACR-EN081', 'Secret Rare',              '(ScR)', 0),
    ('Quarter Century Stampede',               'RA04-EN289', 'Platinum Secret Rare',     '(PS)',  0),
    ('Quarter Century Stampede',               'RA04-EN289', 'Quarter Century Secret Rare', '',     0)
)
INSERT INTO card_prints (id, artwork_id, card_set_id, set_code, rarity, rarity_code, set_price)
SELECT
  gen_random_uuid(),
  (SELECT id FROM artwork_id),
  cs.id,
  pd.set_code,
  pd.rarity,
  pd.rarity_code,
  pd.set_price::double precision
FROM prints_data pd
JOIN card_sets cs ON cs.name = pd.set_name
ON CONFLICT (artwork_id, card_set_id, set_code, rarity) DO NOTHING;

-- ============================================================
-- 5. Insert Physical Card (inventario del usuario)
--    Tornado Dragon (L26D-ENM23, Common) — MINT, EN, no 1ra edición
-- ============================================================
DO $$
DECLARE
  v_artwork_id   TEXT;
  v_print_id     TEXT;
BEGIN
  SELECT a.id INTO v_artwork_id
  FROM artworks a
  WHERE a.card_id = '6983839'
  LIMIT 1;

  SELECT cp.id INTO v_print_id
  FROM card_prints cp
  JOIN artworks a ON a.id = cp.artwork_id
  WHERE a.card_id = '6983839' AND cp.set_code = 'L26D-ENM23' AND cp.rarity = 'Common'
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1 FROM physical_cards
    WHERE artwork_id = v_artwork_id AND card_print_id = v_print_id
      AND condition = 'MINT'::"CardCondition"
      AND language = 'EN'::"CardLanguage"
  ) THEN
    INSERT INTO physical_cards (id, artwork_id, card_print_id, condition, language, is_first_edition)
    VALUES (gen_random_uuid(), v_artwork_id, v_print_id, 'MINT'::"CardCondition", 'EN'::"CardLanguage", false);
  END IF;
END $$;

-- ============================================================
-- Verify
-- ============================================================
SELECT '✅ Tornado Dragon seeded successfully' AS result;
