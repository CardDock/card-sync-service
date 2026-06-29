import { CardType } from '../../../../../../src/context/card/domain/value-objects/card-type.value-object';

describe('CardType', () => {
  describe('create', () => {
    it('creates a CardType with a valid value', () => {
      const cardType = CardType.create('Spell Card');

      expect(cardType.toPrimitives()).toBe('Spell Card');
    });

    it('trims leading and trailing spaces', () => {
      const cardType = CardType.create('  Trap Card  ');

      expect(cardType.toPrimitives()).toBe('Trap Card');
    });

    it('throws when value is an empty string', () => {
      expect(() => CardType.create('')).toThrow(
        new Error('Card type is required'),
      );
    });

    it('throws when value is only whitespace', () => {
      expect(() => CardType.create('   \n\t   ')).toThrow(
        new Error('Card type is required'),
      );
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['number', 123],
      ['boolean', false],
      ['object', { type: 'monster' }],
      ['array', ['monster']],
    ])('throws when value is %s', (_label, invalidValue) => {
      expect(() => CardType.create(invalidValue as unknown as string)).toThrow(
        new Error('Card type is required'),
      );
    });
  });

  describe('toPrimitives', () => {
    it('returns the normalized string value', () => {
      const cardType = CardType.create('  Monster Card  ');

      expect(cardType.toPrimitives()).toBe('Monster Card');
    });
  });
});
