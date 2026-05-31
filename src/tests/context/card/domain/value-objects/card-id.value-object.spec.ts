import { CardId } from '../../../../../context/card/domain/value-objects/card-id.value-object';

describe('CardId', () => {
  describe('create', () => {
    it('creates a CardId with a valid value', () => {
      const cardId = CardId.create('f0f09f9a-52f4-47f7-92f7-399d5e8ad6c1');

      expect(cardId.toPrimitives()).toBe('f0f09f9a-52f4-47f7-92f7-399d5e8ad6c1');
    });

    it('trims leading and trailing spaces', () => {
      const cardId = CardId.create('  6f88c6df-e5db-47f7-a47f-6c8c419f27a2  ');

      expect(cardId.toPrimitives()).toBe('6f88c6df-e5db-47f7-a47f-6c8c419f27a2');
    });

    it('generates a UUID when value is undefined', () => {
      const cardId = CardId.create(undefined);

      expect(cardId.toPrimitives()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('generates a UUID when value is null', () => {
      const cardId = CardId.create(null as unknown as string);

      expect(cardId.toPrimitives()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('throws when value is an empty string', () => {
      expect(() => CardId.create('')).toThrow(new Error('Card id is required'));
    });

    it('throws when value is only whitespace', () => {
      expect(() => CardId.create('   \n\t   ')).toThrow(
        new Error('Card id is required'),
      );
    });
  });

  describe('toPrimitives', () => {
    it('returns the normalized string value', () => {
      const cardId = CardId.create('  95de7a75-f08e-4f23-b4ae-cf6f476ab7f0  ');

      expect(cardId.toPrimitives()).toBe('95de7a75-f08e-4f23-b4ae-cf6f476ab7f0');
    });
  });
});
