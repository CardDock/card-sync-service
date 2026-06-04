import { CardDomainValidationError } from '../errors';

export class CardExternalId {
  private constructor(private readonly value: string) {}

  static create(value: string): CardExternalId {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'externalId',
        value,
        source: 'CardExternalId.create',
        rule: 'required-string',
        message: 'Card externalId is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'externalId',
        value,
        source: 'CardExternalId.create',
        rule: 'required-string',
        message: 'Card externalId is required',
      });
    }

    return new CardExternalId(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
