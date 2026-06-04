import { CardAttribute } from '../../../../../context/card/domain/value-objects/card-attribute.value-object';

describe('CardAttribute', () => {
  it('creates a valid attribute', () => {
    const cardAttribute = CardAttribute.create('DARK');

    expect(cardAttribute.toPrimitives()).toBe('DARK');
  });

  it('throws when attribute is invalid', () => {
    expect(() => CardAttribute.create('SHADOW' as never)).toThrow(
      new Error('Card attribute is invalid'),
    );
  });
});
