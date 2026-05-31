import { CardName } from '../../../../../context/card/domain/value-objects/card-name.value-object';

describe('CardName', () => {
  describe('create', () => {
    it('creates a CardName with a valid value', () => {
      const cardName = CardName.create('Blue-Eyes White Dragon');

      expect(cardName.toPrimitives()).toBe('Blue-Eyes White Dragon');
    });

    it('trims leading and trailing spaces', () => {
      const cardName = CardName.create('  Dark Magician  ');

      expect(cardName.toPrimitives()).toBe('Dark Magician');
    });

    it('throws when value is an empty string', () => {
      expect(() => CardName.create('')).toThrow(new Error('Card name is required'));
    });

    it('throws when value is only whitespace', () => {
      expect(() => CardName.create('   \n\t   ')).toThrow(
        new Error('Card name is required'),
      );
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['number', 123],
      ['boolean', false],
      ['object', { name: 'card' }],
      ['array', ['card']],
    ])('throws when value is %s', (_label, invalidValue) => {
      expect(() => CardName.create(invalidValue as unknown as string)).toThrow(
        new Error('Card name is required'),
      );
    });
  });

  describe('toPrimitives', () => {
    it('returns the normalized string value', () => {
      const cardName = CardName.create('  Red-Eyes Black Dragon  ');

      expect(cardName.toPrimitives()).toBe('Red-Eyes Black Dragon');
    });
  });
});
