import { CardDomainValidationError } from '../errors';

export class CardDef {
  private constructor(private readonly value: number | null) {}

  static create(value: number | null | undefined): CardDef {
    if (value == null) {
      return new CardDef(null);
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CardDomainValidationError({
        field: 'def',
        value,
        source: 'CardDef.create',
        rule: 'non-negative-integer-or-null',
        message: 'Card def must be a non-negative integer or null',
      });
    }

    return new CardDef(value);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
