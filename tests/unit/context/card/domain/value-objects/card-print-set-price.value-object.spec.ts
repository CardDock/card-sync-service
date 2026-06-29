import { CardPrintSetPrice } from '../../../../../../src/context/card/domain/value-objects/card-print-set-price.value-object';

describe('CardPrintSetPrice', () => {
  it('creates with a valid number', () => {
    const price = CardPrintSetPrice.create(12.5);
    expect(price.toPrimitives()).toBe(12.5);
  });

  it('creates with a string number', () => {
    const price = CardPrintSetPrice.create('5.99');
    expect(price.toPrimitives()).toBe(5.99);
  });

  it('returns null for null input', () => {
    const price = CardPrintSetPrice.create(null);
    expect(price.toPrimitives()).toBeNull();
  });

  it('returns null for undefined input', () => {
    const price = CardPrintSetPrice.create(undefined);
    expect(price.toPrimitives()).toBeNull();
  });

  it('creates with zero', () => {
    const price = CardPrintSetPrice.create(0);
    expect(price.toPrimitives()).toBe(0);
  });

  it('throws for negative number', () => {
    expect(() => CardPrintSetPrice.create(-1)).toThrow(
      new Error('Card print set price must be non-negative'),
    );
  });

  it('throws for non-numeric string', () => {
    expect(() => CardPrintSetPrice.create('abc')).toThrow(
      new Error('Card print set price must be a valid number'),
    );
  });
});
