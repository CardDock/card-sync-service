import { CardDomainValidationError } from '../errors';

export class CardScale {
  private constructor(private readonly value: number | null) {}

  static create(value: number | null | undefined): CardScale {
    if (value == null) {
      return new CardScale(null);
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CardDomainValidationError({
        field: 'scale',
        value,
        source: 'CardScale.create',
        rule: 'non-negative-integer-or-null',
        message: 'Card scale must be a non-negative integer or null',
      });
    }

    return new CardScale(value);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
