import { CardExternalId } from '../../../../../context/card/domain/value-objects/card-external-id.value-object';

describe('CardExternalId', () => {
  it('creates a normalized externalId', () => {
    const cardExternalId = CardExternalId.create('  12345  ');

    expect(cardExternalId.toPrimitives()).toBe('12345');
  });

  it('throws when externalId is empty after trim', () => {
    expect(() => CardExternalId.create('   ')).toThrow(
      new Error('Card externalId is required'),
    );
  });
});
