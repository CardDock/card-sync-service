import { CardPrintSetCode } from '../../../../../context/card/domain/value-objects/card-print-set-code.value-object';

describe('CardPrintSetCode', () => {
  it('creates with a valid set code', () => {
    const code = CardPrintSetCode.create('LOB-000');
    expect(code.toPrimitives()).toBe('LOB-000');
  });

  it('trims whitespace', () => {
    const code = CardPrintSetCode.create('  MP22-EN001  ');
    expect(code.toPrimitives()).toBe('MP22-EN001');
  });

  it('throws when value is empty string', () => {
    expect(() => CardPrintSetCode.create('')).toThrow(
      new Error('Card print set code is required'),
    );
  });

  it('throws when value is only whitespace', () => {
    expect(() => CardPrintSetCode.create('   \n   ')).toThrow(
      new Error('Card print set code is required'),
    );
  });
});
