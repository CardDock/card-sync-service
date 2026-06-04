import { CardDomainValidationError } from '../errors';

export class CardType {
  private constructor(private readonly value: string) {}

  static create(value: string): CardType {
    const normalized = CardType.normalizeRequiredText(value, 'type');

    return new CardType(normalized);
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
        source: 'CardType.normalizeRequiredText',
        rule: 'required-trimmed-string',
        message: `Card ${fieldName} is required`,
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: fieldName,
        value,
        source: 'CardType.normalizeRequiredText',
        rule: 'required-trimmed-string',
        message: `Card ${fieldName} is required`,
      });
    }

    return normalized;
  }
}
