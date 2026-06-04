import { CardHumanReadableCardType } from '../../../../../context/card/domain/value-objects/card-human-readable-card-type.value-object';

describe('CardHumanReadableCardType', () => {
  it('creates a normalized humanReadableCardType', () => {
    const cardType = CardHumanReadableCardType.create('  Effect Monster  ');

    expect(cardType.toPrimitives()).toBe('Effect Monster');
  });

  it('throws when value is empty after trim', () => {
    expect(() => CardHumanReadableCardType.create('   ')).toThrow(
      new Error('Card humanReadableCardType is required'),
    );
  });
});
