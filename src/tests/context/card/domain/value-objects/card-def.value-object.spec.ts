import { CardDef } from '../../../../../context/card/domain/value-objects/card-def.value-object';

describe('CardDef', () => {
  it('creates a valid def value', () => {
    const cardDef = CardDef.create(2000);

    expect(cardDef.toPrimitives()).toBe(2000);
  });

  it('throws when def is negative', () => {
    expect(() => CardDef.create(-1)).toThrow(
      new Error('Card def must be a non-negative integer or null'),
    );
  });
});
