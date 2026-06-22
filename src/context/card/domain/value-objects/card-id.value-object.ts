import { CardDomainValidationError } from '../errors';

export class CardId {
  private constructor(private readonly value: string) {}

  static create(value: string): CardId {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'id',
        value,
        source: 'CardId.create',
        rule: 'required-string',
        message: 'Card id is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'id',
        value,
        source: 'CardId.create',
        rule: 'required-trimmed-string',
        message: 'Card id is required',
      });
    }

    return new CardId(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
