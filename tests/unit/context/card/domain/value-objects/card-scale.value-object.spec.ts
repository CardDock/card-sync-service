import { CardScale } from '../../../../../../src/context/card/domain/value-objects/card-scale.value-object';

describe('CardScale', () => {
  it('creates a valid scale value', () => {
    const cardScale = CardScale.create(3);

    expect(cardScale.toPrimitives()).toBe(3);
  });

  it('throws when scale is negative', () => {
    expect(() => CardScale.create(-1)).toThrow(
      new Error('Card scale must be a non-negative integer or null'),
    );
  });
});
