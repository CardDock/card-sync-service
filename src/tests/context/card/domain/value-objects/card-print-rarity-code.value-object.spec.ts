import { CardPrintRarityCode } from '../../../../../context/card/domain/value-objects/card-print-rarity-code.value-object';

describe('CardPrintRarityCode', () => {
  it('creates with a valid code', () => {
    const code = CardPrintRarityCode.create('ur');
    expect(code.toPrimitives()).toBe('ur');
  });

  it('trims whitespace', () => {
    const code = CardPrintRarityCode.create('  sr  ');
    expect(code.toPrimitives()).toBe('sr');
  });

  it('returns null for null input', () => {
    const code = CardPrintRarityCode.create(null);
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for undefined input', () => {
    const code = CardPrintRarityCode.create(undefined);
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for empty string', () => {
    const code = CardPrintRarityCode.create('');
    expect(code.toPrimitives()).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    const code = CardPrintRarityCode.create('   ');
    expect(code.toPrimitives()).toBeNull();
  });
});
