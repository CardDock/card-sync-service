import { Language } from '../../../../../context/card/domain/value-objects/language.value-object';
import { CardDomainValidationError } from '../../../../../context/card/domain/errors';

describe('Language', () => {
  it('creates a valid Language for "en"', () => {
    const language = Language.create('en');
    expect(language.toPrimitives()).toBe('en');
    expect(language.isEnglish()).toBe(true);
  });

  it('creates a valid Language for "es"', () => {
    const language = Language.create('es');
    expect(language.toPrimitives()).toBe('es');
    expect(language.isEnglish()).toBe(false);
  });

  it('normalizes case for "EN"', () => {
    const language = Language.create('EN');
    expect(language.toPrimitives()).toBe('en');
  });

  it('normalizes case for "ES"', () => {
    const language = Language.create('ES');
    expect(language.toPrimitives()).toBe('es');
  });

  it('normalizes mixed case for "Es"', () => {
    const language = Language.create('Es');
    expect(language.toPrimitives()).toBe('es');
  });

  it('trims whitespace', () => {
    const language = Language.create('  en  ');
    expect(language.toPrimitives()).toBe('en');
  });

  it('throws CardDomainValidationError for unsupported language', () => {
    expect(() => Language.create('fr')).toThrow(CardDomainValidationError);
  });

  it('throws CardDomainValidationError for empty string', () => {
    expect(() => Language.create('')).toThrow(CardDomainValidationError);
  });

  it('throws CardDomainValidationError for non-string value', () => {
    expect(() => Language.create(null as unknown as string)).toThrow(CardDomainValidationError);
  });

  it('throws CardDomainValidationError for undefined value', () => {
    expect(() => Language.create(undefined as unknown as string)).toThrow(CardDomainValidationError);
  });

  it('throws CardDomainValidationError for numeric value', () => {
    expect(() => Language.create(123 as unknown as string)).toThrow(CardDomainValidationError);
  });
});
