import { CardDomainValidationError } from '../errors';

export class CardPrintSetPrice {
  private constructor(private readonly value: number | null) {}

  static create(value: number | string | null | undefined): CardPrintSetPrice {
    if (value == null) {
      return new CardPrintSetPrice(null);
    }

    const parsed = typeof value === 'string' ? parseFloat(value) : value;

    if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
      throw new CardDomainValidationError({
        field: 'setPrice',
        value,
        source: 'CardPrintSetPrice.create',
        rule: 'valid-number',
        message: 'Card print set price must be a valid number',
      });
    }

    if (parsed < 0) {
      throw new CardDomainValidationError({
        field: 'setPrice',
        value,
        source: 'CardPrintSetPrice.create',
        rule: 'non-negative',
        message: 'Card print set price must be non-negative',
      });
    }

    return new CardPrintSetPrice(parsed);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
