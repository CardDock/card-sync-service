import { CardSetCode } from '../../../../../../src/context/card/domain/value-objects/card-set-code.value-object';

describe('CardSetCode', () => {
  it('creates with a valid code', () => {
    const code = CardSetCode.create('LOB');
    expect(code.toPrimitives()).toBe('LOB');
  });

  it('trims whitespace', () => {
    const code = CardSetCode.create('  MP22  ');
    expect(code.toPrimitives()).toBe('MP22');
  });

  it('returns null for null input', () => {
    const code = CardSetCode.create(null);
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for undefined input', () => {
    const code = CardSetCode.create(undefined);
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for empty string', () => {
    const code = CardSetCode.create('');
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    const code = CardSetCode.create('    ');
    expect(code.toPrimitives()).toBeNull();
  });
});
