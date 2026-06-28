import { describe, expect, it } from '@jest/globals';
import { CardDescription } from '../../../../../context/card/domain/value-objects/card-description.value-object';

describe('CardDescription', () => {
  describe('create', () => {
    it('creates a CardDescription with a valid value', () => {
      const cardDescription = CardDescription.create(
        'Destroys one monster on the field.',
      );

      expect(cardDescription.toPrimitives()).toBe(
        'Destroys one monster on the field.',
      );
    });

    it('trims leading and trailing spaces', () => {
      const cardDescription = CardDescription.create(
        '  Special summon one token.  ',
      );

      expect(cardDescription.toPrimitives()).toBe('Special summon one token.');
    });

    it('allows empty string and returns empty', () => {
      const cardDescription = CardDescription.create('');

      expect(cardDescription.toPrimitives()).toBe('');
    });

    it('allows whitespace-only string and returns trimmed empty', () => {
      const cardDescription = CardDescription.create('   \n\t   ');

      expect(cardDescription.toPrimitives()).toBe('');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['number', 123],
      ['boolean', false],
      ['object', { description: 'effect' }],
      ['array', ['effect']],
    ])('throws when value is %s', (_label, invalidValue) => {
      expect(() =>
        CardDescription.create(invalidValue as unknown as string),
      ).toThrow(new Error('Card description is required'));
    });
  });

  describe('toPrimitives', () => {
    it('returns the normalized string value', () => {
      const cardDescription = CardDescription.create('  Draw two cards.  ');

      expect(cardDescription.toPrimitives()).toBe('Draw two cards.');
    });
  });
});
