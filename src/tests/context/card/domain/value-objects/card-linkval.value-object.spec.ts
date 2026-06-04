import { CardLinkval } from '../../../../../context/card/domain/value-objects/card-linkval.value-object';

describe('CardLinkval', () => {
  it('creates a valid linkval value', () => {
    const cardLinkval = CardLinkval.create(2);

    expect(cardLinkval.toPrimitives()).toBe(2);
  });

  it('throws when linkval is negative', () => {
    expect(() => CardLinkval.create(-1)).toThrow(
      new Error('Card linkval must be a non-negative integer or null'),
    );
  });
});
