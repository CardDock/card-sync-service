import { CardPrintRarity } from '../../../../../../src/context/card/domain/value-objects/card-print-rarity.value-object';

describe('CardPrintRarity', () => {
  it('creates a valid rarity', () => {
    const rarity = CardPrintRarity.create('Ultra Rare');
    expect(rarity.toPrimitives()).toBe('Ultra Rare');
  });

  it('trims whitespace', () => {
    const rarity = CardPrintRarity.create('  Common  ');
    expect(rarity.toPrimitives()).toBe('Common');
  });

  it('throws when value is empty string', () => {
    expect(() => CardPrintRarity.create('')).toThrow(
      new Error('Card print rarity is required'),
    );
  });

  it('throws when value is only whitespace', () => {
    expect(() => CardPrintRarity.create('   \t   ')).toThrow(
      new Error('Card print rarity is required'),
    );
  });
});
