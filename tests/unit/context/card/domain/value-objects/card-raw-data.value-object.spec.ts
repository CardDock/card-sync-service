import { CardRawData } from '../../../../../../src/context/card/domain/value-objects/card-raw-data.value-object';

describe('CardRawData', () => {
  it('returns defensive clones of raw data', () => {
    const source = {
      id: 1,
      name: 'Dark Magician',
      card_images: [{ id: 1, image_url: 'https://example.com/dm.png' }],
    };

    const cardRawData = CardRawData.create(source);
    const firstSnapshot = cardRawData.toPrimitives() as {
      name: string;
      card_images: { image_url: string }[];
    };

    firstSnapshot.name = 'Mutated Name';
    firstSnapshot.card_images[0].image_url = 'https://mutated.example.com';

    const secondSnapshot = cardRawData.toPrimitives();

    expect(secondSnapshot).toEqual(source);
  });
});
