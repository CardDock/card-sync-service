import { PhysicalCardCondition } from '../../../../../context/card/domain/value-objects/physical-card-condition.value-object';

describe('PhysicalCardCondition', () => {
  it('creates with a valid condition in uppercase', () => {
    const condition = PhysicalCardCondition.create('NEAR_MINT');
    expect(condition.toPrimitives()).toBe('NEAR_MINT');
  });

  it('normalizes lowercase to uppercase', () => {
    const condition = PhysicalCardCondition.create('near_mint');
    expect(condition.toPrimitives()).toBe('NEAR_MINT');
  });

  it('normalizes spaces to underscores', () => {
    const condition = PhysicalCardCondition.create('Near Mint');
    expect(condition.toPrimitives()).toBe('NEAR_MINT');
  });

  it('trims whitespace', () => {
    const condition = PhysicalCardCondition.create('  played  ');
    expect(condition.toPrimitives()).toBe('PLAYED');
  });

  it('throws for invalid condition', () => {
    expect(() => PhysicalCardCondition.create('MINTY')).toThrow(
      new Error('Invalid card condition: MINTY. Valid values: MINT, NEAR_MINT, EXCELLENT, GOOD, LIGHT_PLAYED, PLAYED, POOR'),
    );
  });
});
