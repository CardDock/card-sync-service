import { PhysicalCardLanguage } from '../../../../../context/card/domain/value-objects/physical-card-language.value-object';

describe('PhysicalCardLanguage', () => {
  it('creates with a valid language in uppercase', () => {
    const language = PhysicalCardLanguage.create('EN');
    expect(language.toPrimitives()).toBe('EN');
  });

  it('normalizes lowercase to uppercase', () => {
    const language = PhysicalCardLanguage.create('es');
    expect(language.toPrimitives()).toBe('ES');
  });

  it('trims whitespace', () => {
    const language = PhysicalCardLanguage.create('  fr  ');
    expect(language.toPrimitives()).toBe('FR');
  });

  it('throws for invalid language', () => {
    expect(() => PhysicalCardLanguage.create('ZZ')).toThrow(
      new Error('Invalid card language: ZZ. Valid values: EN, ES, FR, DE, IT, PT, JP'),
    );
  });
});
