import { CardFrameType } from '../../../../../context/card/domain/value-objects/card-frame-type.value-object';

describe('CardFrameType', () => {
  it('creates a valid frameType', () => {
    const cardFrameType = CardFrameType.create('normal');

    expect(cardFrameType.toPrimitives()).toBe('normal');
  });

  it('throws when frameType is invalid', () => {
    expect(() => CardFrameType.create('invalid' as never)).toThrow(
      new Error('Card frameType is invalid'),
    );
  });
});
