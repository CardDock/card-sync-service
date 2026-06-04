import { CardDomainValidationError } from '../errors';

export class CardHumanReadableCardType {
  private constructor(private readonly value: string) {}

  static create(value: string): CardHumanReadableCardType {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'humanReadableCardType',
        value,
        source: 'CardHumanReadableCardType.create',
        rule: 'required-trimmed-string',
        message: 'Card humanReadableCardType is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'humanReadableCardType',
        value,
        source: 'CardHumanReadableCardType.create',
        rule: 'required-trimmed-string',
        message: 'Card humanReadableCardType is required',
      });
    }

    return new CardHumanReadableCardType(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
