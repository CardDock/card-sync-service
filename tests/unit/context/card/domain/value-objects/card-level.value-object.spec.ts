import { CardLevel } from '../../../../../../src/context/card/domain/value-objects/card-level.value-object';

describe('CardLevel', () => {
  it('creates a valid level value', () => {
    const cardLevel = CardLevel.create(8);

    expect(cardLevel.toPrimitives()).toBe(8);
  });

  it('throws when level is negative', () => {
    expect(() => CardLevel.create(-1)).toThrow(
      new Error('Card level must be a non-negative integer or null'),
    );
  });
});
