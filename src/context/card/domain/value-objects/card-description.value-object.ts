import { CardDomainValidationError } from '../errors';

export class CardDescription {
  private constructor(private readonly value: string) {}

  static create(value: string): CardDescription {
    const normalized = CardDescription.normalizeRequiredText(
      value,
      'description',
    );

    return new CardDescription(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }

  private static normalizeRequiredText(
    value: string,
    fieldName: string,
  ): string {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: fieldName,
        value,
        source: 'CardDescription.normalizeRequiredText',
        rule: 'required-trimmed-string',
        message: `Card ${fieldName} is required`,
      });
    }

    return value.trim();
  }
}
