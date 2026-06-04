import { CardDomainValidationError } from '../errors';

export class CardLevel {
  private constructor(private readonly value: number | null) {}

  static create(value: number | null | undefined): CardLevel {
    if (value == null) {
      return new CardLevel(null);
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CardDomainValidationError({
        field: 'level',
        value,
        source: 'CardLevel.create',
        rule: 'non-negative-integer-or-null',
        message: 'Card level must be a non-negative integer or null',
      });
    }

    return new CardLevel(value);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
