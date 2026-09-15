import { CardFrameType } from '../../../../../../src/context/card/domain/value-objects/card-frame-type.value-object';

describe('CardFrameType', () => {
  it('creates a valid frameType', () => {
    const cardFrameType = CardFrameType.create('normal');

    expect(cardFrameType.toPrimitives()).toBe('normal');
  });

  it('creates a valid pendulum frameType', () => {
    const cardFrameType = CardFrameType.create('effect_pendulum');

    expect(cardFrameType.toPrimitives()).toBe('effect_pendulum');
  });

  it('throws when frameType is invalid', () => {
    expect(() => CardFrameType.create('invalid' as never)).toThrow(
      new Error('Card frameType is invalid'),
    );
  });
});
