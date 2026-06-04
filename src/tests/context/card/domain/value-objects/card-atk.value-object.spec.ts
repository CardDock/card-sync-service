import { CardAtk } from '../../../../../context/card/domain/value-objects/card-atk.value-object';

describe('CardAtk', () => {
  it('creates a valid atk value', () => {
    const cardAtk = CardAtk.create(2500);

    expect(cardAtk.toPrimitives()).toBe(2500);
  });

  it('throws when atk is negative', () => {
    expect(() => CardAtk.create(-1)).toThrow(
      new Error('Card atk must be a non-negative integer or null'),
    );
  });
});
