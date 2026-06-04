import { CardDomainValidationError } from '../errors';

export class CardAtk {
  private constructor(private readonly value: number | null) {}

  static create(value: number | null | undefined): CardAtk {
    if (value == null) {
      return new CardAtk(null);
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CardDomainValidationError({
        field: 'atk',
        value,
        source: 'CardAtk.create',
        rule: 'non-negative-integer-or-null',
        message: 'Card atk must be a non-negative integer or null',
      });
    }

    return new CardAtk(value);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
