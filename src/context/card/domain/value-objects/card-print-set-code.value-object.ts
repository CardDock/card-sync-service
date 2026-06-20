import { CardDomainValidationError } from '../errors';

export class CardPrintSetCode {
  private constructor(private readonly value: string) {}

  static create(value: string): CardPrintSetCode {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'setCode',
        value,
        source: 'CardPrintSetCode.create',
        rule: 'required-string',
        message: 'Card print set code is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'setCode',
        value,
        source: 'CardPrintSetCode.create',
        rule: 'required-string',
        message: 'Card print set code is required',
      });
    }

    return new CardPrintSetCode(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
