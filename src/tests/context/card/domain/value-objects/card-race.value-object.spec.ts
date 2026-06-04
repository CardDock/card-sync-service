import { CardRace } from '../../../../../context/card/domain/value-objects/card-race.value-object';

describe('CardRace', () => {
  it('creates a valid race', () => {
    const cardRace = CardRace.create('Dragon');

    expect(cardRace.toPrimitives()).toBe('Dragon');
  });

  it('creates Fish race', () => {
    const cardRace = CardRace.create('Fish');

    expect(cardRace.toPrimitives()).toBe('Fish');
  });

  it('throws when race is invalid', () => {
    expect(() => CardRace.create('UnknownRace' as never)).toThrow(
      new Error('Card race is invalid'),
    );
  });
});
