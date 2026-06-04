import { CardLinkmarkers } from '../../../../../context/card/domain/value-objects/card-linkmarkers.value-object';

describe('CardLinkmarkers', () => {
  it('creates linkmarkers with valid markers', () => {
    const cardLinkmarkers = CardLinkmarkers.create(['Top', 'BottomLeft']);

    expect(cardLinkmarkers.toPrimitives()).toEqual(['Top', 'BottomLeft']);
  });

  it('throws when a marker is invalid', () => {
    expect(() => CardLinkmarkers.create(['Top', 'Center' as never])).toThrow(
      new Error('Card linkmarkers must be an array of valid link markers'),
    );
  });
});
