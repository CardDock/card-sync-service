import { Card } from '../../src/context/card/domain/entities/card.entity';
import { SyncCardWithRelatedData } from '../../src/context/card/domain/types/sync-card-with-related.types';

export const buildSourceCard = (
  overrides: Partial<SyncCardWithRelatedData['card']> = {},
): SyncCardWithRelatedData => ({
  card: {
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
    rawData: { id: 46986414, name: 'Dark Magician' },
    ...overrides,
  },
  cardSets: [{ name: 'Legend of Blue Eyes White Dragon', code: 'LOB' }],
  artworks: [{ imageUrl: 'https://example.com/image.png' }],
  cardPrints: [
    {
      setName: 'Legend of Blue Eyes White Dragon',
      setCode: 'LOB-001',
      rarity: 'Ultra Rare',
      rarityCode: 'UR',
      setPrice: 12.5,
    },
  ],
});

export const buildCard = (overrides: Partial<Record<string, unknown>> = {}): Card =>
  Card.create({
    id: '23771716',
    name: 'Elemental HERO Neos',
    typeline: ['Warrior', 'Normal'],
    type: 'Normal Monster',
    humanReadableCardType: 'Normal Monster',
    frameType: 'normal',
    desc: 'A hero from another world.',
    race: 'Warrior',
    atk: 2500,
    def: 2000,
    level: 7,
    scale: null,
    linkval: null,
    linkmarkers: [],
    attribute: 'LIGHT',
    rawData: {
      id: 23771716,
      name: 'Elemental HERO Neos',
    },
    ...overrides,
  });
