import { mapYgoProDeckResponseToSyncCardParams } from '../../../../../../src/context/card/infrastructure/external/ygoprodeck-card.mapper';

const darkMagicianDto = {
  id: 46986414,
  name: 'Dark Magician',
  typeline: ['Spellcaster', 'Normal'],
  type: 'Normal Monster',
  humanReadableCardType: 'Normal Monster',
  frameType: 'normal',
  desc: 'The ultimate wizard in terms of attack and defense.',
  race: 'Spellcaster',
  atk: 2500,
  def: 2100,
  level: 7,
  attribute: 'DARK',
  card_sets: [
    {
      set_name: 'Legend of Blue Eyes White Dragon',
      set_code: 'LOB-000',
      set_rarity: 'Ultra Rare',
      set_rarity_code: 'ur',
      set_price: '12.5',
    },
    {
      set_name: 'Legend of Blue Eyes White Dragon',
      set_code: 'LOB-001',
      set_rarity: 'Super Rare',
      set_rarity_code: 'sr',
      set_price: '5.0',
    },
    {
      set_name: 'Metal Raiders',
      set_code: 'MRD-000',
      set_rarity: 'Ultra Rare',
      set_rarity_code: 'ur',
      set_price: '8.0',
    },
  ],
  card_images: [
    {
      id: 1,
      image_url: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
      image_url_small: '',
      image_url_cropped: '',
    },
  ],
};

describe('mapYgoProDeckResponseToSyncCardParams', () => {
  it('maps a full card DTO correctly', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({
      data: [darkMagicianDto],
    });

    expect(result).not.toBeNull();
    expect(result!.card).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
      typeline: ['Spellcaster', 'Normal'],
      type: 'Normal Monster',
      humanReadableCardType: 'Normal Monster',
      frameType: 'normal',
      desc: 'The ultimate wizard in terms of attack and defense.',
      race: 'Spellcaster',
      atk: 2500,
      def: 2100,
      level: 7,
      scale: null,
      linkval: null,
      linkmarkers: [],
      attribute: 'DARK',
    });
    expect(result!.card.rawData).toMatchObject({
      id: 46986414,
      name: 'Dark Magician',
    });
    expect(
      (result!.card.rawData as Record<string, unknown>).card_sets,
    ).toBeUndefined();
    expect(
      (result!.card.rawData as Record<string, unknown>).card_images,
    ).toBeUndefined();
  });

  it('deduplicates card sets by name', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({
      data: [darkMagicianDto],
    });

    expect(result!.cardSets).toHaveLength(2);
    expect(result!.cardSets[0]).toMatchObject({
      name: 'Legend of Blue Eyes White Dragon',
      code: 'LOB',
    });
    expect(result!.cardSets[1]).toMatchObject({
      name: 'Metal Raiders',
      code: 'MRD',
    });
  });

  it('collects card prints from card_sets', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({
      data: [darkMagicianDto],
    });

    expect(result!.cardPrints).toHaveLength(3);
    expect(result!.cardPrints[0]).toMatchObject({
      setName: 'Legend of Blue Eyes White Dragon',
      setCode: 'LOB-000',
      rarity: 'Ultra Rare',
    });
    expect(result!.cardPrints[1]).toMatchObject({
      setName: 'Legend of Blue Eyes White Dragon',
      setCode: 'LOB-001',
    });
    expect(result!.cardPrints[2]).toMatchObject({
      setName: 'Metal Raiders',
      setCode: 'MRD-000',
    });
  });

  it('collects artworks from card_images', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({
      data: [darkMagicianDto],
    });

    expect(result!.artworks).toHaveLength(1);
    expect(result!.artworks[0]).toMatchObject({
      imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
    });
  });

  it('normalizes race labels like Beast-Warrior', () => {
    const dto = { ...darkMagicianDto, race: 'Beast-Warrior' };
    const result = mapYgoProDeckResponseToSyncCardParams({ data: [dto] });

    expect(result!.card.race).toBe('BeastWarrior');
  });

  it('normalizes link marker labels', () => {
    const dto = {
      ...darkMagicianDto,
      frameType: 'link',
      linkval: 3,
      linkmarkers: ['Bottom-Left', 'Bottom-Right', 'Top'],
    };
    const result = mapYgoProDeckResponseToSyncCardParams({ data: [dto] });

    expect(result!.card.linkmarkers).toEqual([
      'BottomLeft',
      'BottomRight',
      'Top',
    ]);
  });

  it('handles missing optional fields', () => {
    const dto = {
      id: 12345,
      name: 'Minimal Card',
      type: 'Spell Card',
      frameType: 'spell',
      desc: 'A simple spell card.',
      race: 'Normal',
    };
    const result = mapYgoProDeckResponseToSyncCardParams({ data: [dto] });

    expect(result!.card).toMatchObject({
      id: '12345',
      typeline: [],
      humanReadableCardType: 'Spell Card',
      atk: null,
      def: null,
      level: null,
      scale: null,
      linkval: null,
      linkmarkers: [],
      attribute: null,
    });
    expect(result!.cardSets).toEqual([]);
    expect(result!.artworks).toEqual([]);
    expect(result!.cardPrints).toEqual([]);
  });

  it('handles null attribute', () => {
    const dto = { ...darkMagicianDto, attribute: undefined };
    const result = mapYgoProDeckResponseToSyncCardParams({ data: [dto] });

    expect(result!.card.attribute).toBeNull();
  });

  it('returns null for empty data array', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({ data: [] });

    expect(result).toBeNull();
  });

  it('returns null for undefined data', () => {
    const result = mapYgoProDeckResponseToSyncCardParams({});

    expect(result).toBeNull();
  });
});
