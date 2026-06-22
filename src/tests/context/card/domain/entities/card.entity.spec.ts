import { Card } from '../../../../../context/card/domain/entities/card.entity';
import {
  CreateCardParams,
  SyncCardParams,
} from '../../../../../context/card/domain/types/card.types';

describe('Card', () => {
  const buildCreateParams = (
    overrides: Partial<CreateCardParams> = {},
  ): CreateCardParams => ({
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
    rawData: {
      id: 46986414,
      name: 'Dark Magician',
      card_images: [
        { id: 46986414, image_url: 'https://example.com/image.png' },
      ],
    },
    ...overrides,
  });

  const buildSyncParams = (
    overrides: Partial<SyncCardParams> = {},
  ): SyncCardParams => ({
    id: '89631139',
    name: 'Blue-Eyes White Dragon',
    typeline: ['Dragon', 'Normal'],
    type: 'Normal Monster',
    humanReadableCardType: 'Normal Monster',
    frameType: 'normal',
    desc: 'This legendary dragon is a powerful engine of destruction.',
    race: 'Dragon',
    atk: 3000,
    def: 2500,
    level: 8,
    scale: null,
    linkval: null,
    linkmarkers: [],
    attribute: 'LIGHT',
    rawData: {
      id: 89631139,
      name: 'Blue-Eyes White Dragon',
      card_images: [
        { id: 89631139, image_url: 'https://example.com/blue-eyes.png' },
      ],
    },
    ...overrides,
  });

  describe('create', () => {
    it('creates a card with normalized primitives', () => {
      const card = Card.create(
        buildCreateParams({
          id: '46986414',
          name: '  Dark Magician  ',
          type: '  Normal Monster  ',
        }),
      );

      const primitives = card.toPrimitives();

      expect(primitives).toMatchObject({
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
      expect(primitives.rawData).toEqual({
        id: 46986414,
        name: 'Dark Magician',
        card_images: [
          { id: 46986414, image_url: 'https://example.com/image.png' },
        ],
      });
    });

    it('propagates domain validation errors from value objects', () => {
      expect(() =>
        Card.create(buildCreateParams({ type: '   \n\t   ' })),
      ).toThrow(new Error('Card type is required'));
    });
  });

  describe('syncFromSource', () => {
    it('updates mutable properties while preserving id', () => {
      const card = Card.create(buildCreateParams());

      card.syncFromSource(buildSyncParams());

      expect(card.toPrimitives()).toEqual({
        id: '89631139',
        name: 'Blue-Eyes White Dragon',
        typeline: ['Dragon', 'Normal'],
        type: 'Normal Monster',
        humanReadableCardType: 'Normal Monster',
        frameType: 'normal',
        desc: 'This legendary dragon is a powerful engine of destruction.',
        race: 'Dragon',
        atk: 3000,
        def: 2500,
        level: 8,
        scale: null,
        linkval: null,
        linkmarkers: [],
        attribute: 'LIGHT',
        rawData: {
          id: 89631139,
          name: 'Blue-Eyes White Dragon',
          card_images: [
            { id: 89631139, image_url: 'https://example.com/blue-eyes.png' },
          ],
        },
      });
    });
  });

  describe('toPrimitives', () => {
    it('returns defensive copies for arrays and rawData', () => {
      const card = Card.create(buildCreateParams());

      const firstSnapshot = card.toPrimitives();
      firstSnapshot.typeline.push('InjectedType');
      firstSnapshot.linkmarkers.push('Top');
      (firstSnapshot.rawData as { name: string }).name = 'Mutated Name';

      const secondSnapshot = card.toPrimitives();

      expect(secondSnapshot.typeline).toEqual(['Spellcaster', 'Normal']);
      expect(secondSnapshot.linkmarkers).toEqual([]);
      expect(secondSnapshot.rawData).toEqual({
        id: 46986414,
        name: 'Dark Magician',
        card_images: [
          { id: 46986414, image_url: 'https://example.com/image.png' },
        ],
      });
    });
  });
});
