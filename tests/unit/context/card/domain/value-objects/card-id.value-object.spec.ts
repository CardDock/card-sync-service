import { CardId } from '../../../../../../src/context/card/domain/value-objects/card-id.value-object';

describe('CardId', () => {
  describe('create', () => {
    it('creates a CardId with a valid value', () => {
      const cardId = CardId.create('46986414');
      expect(cardId.toPrimitives()).toBe('46986414');
    });

    it('trims leading and trailing spaces', () => {
      const cardId = CardId.create('  46986414  ');
      expect(cardId.toPrimitives()).toBe('46986414');
    });

    it('throws when value is an empty string', () => {
      expect(() => CardId.create('')).toThrow(new Error('Card id is required'));
    });

    it('throws when value is undefined', () => {
      expect(() => CardId.create(undefined as unknown as string)).toThrow(
        new Error('Card id is required'),
      );
    });

    it('throws when value is null', () => {
      expect(() => CardId.create(null as unknown as string)).toThrow(
        new Error('Card id is required'),
      );
    });

    it('throws when value is only whitespace', () => {
      expect(() => CardId.create('   \n\t   ')).toThrow(
        new Error('Card id is required'),
      );
    });
  });

  describe('toPrimitives', () => {
    it('returns the normalized string value', () => {
      const cardId = CardId.create('  89631139  ');
      expect(cardId.toPrimitives()).toBe('89631139');
    });
  });
});
