import { CardTypeline } from '../../../../../context/card/domain/value-objects/card-typeline.value-object';

describe('CardTypeline', () => {
  it('creates a normalized typeline', () => {
    const cardTypeline = CardTypeline.create(['  Dragon  ', '  Normal  ']);

    expect(cardTypeline.toPrimitives()).toEqual(['Dragon', 'Normal']);
  });

  it('throws when typeline contains empty strings', () => {
    expect(() => CardTypeline.create(['Dragon', '   '])).toThrow(
      new Error('Card typeline must be an array of non-empty strings'),
    );
  });
});
