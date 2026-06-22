import { CardDomainValidationError } from '../errors';

export type LanguagePrimitive = 'en' | 'es';

export class Language {
  private static readonly SUPPORTED = new Set<string>(['en', 'es']);

  private constructor(private readonly value: LanguagePrimitive) {}

  static create(value: string): Language {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'language',
        value,
        source: 'Language.create',
        rule: 'supported-language',
        message: 'Card language is required',
      });
    }

    const normalized = value.trim().toLowerCase() as LanguagePrimitive;

    if (!Language.SUPPORTED.has(normalized)) {
      throw new CardDomainValidationError({
        field: 'language',
        value,
        source: 'Language.create',
        rule: 'supported-language',
        message: `Unsupported language: ${value}. Supported: en, es`,
      });
    }

    return new Language(normalized);
  }

  toPrimitives(): LanguagePrimitive {
    return this.value;
  }

  isEnglish(): boolean {
    return this.value === 'en';
  }
}
