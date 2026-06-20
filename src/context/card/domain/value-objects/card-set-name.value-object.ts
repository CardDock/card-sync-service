import { CardDomainValidationError } from '../errors';

export class CardSetName {
  private constructor(private readonly value: string) {}

  static create(value: string): CardSetName {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'cardSetName',
        value,
        source: 'CardSetName.create',
        rule: 'required-string',
        message: 'Card set name is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'cardSetName',
        value,
        source: 'CardSetName.create',
        rule: 'required-string',
        message: 'Card set name is required',
      });
    }

    return new CardSetName(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
