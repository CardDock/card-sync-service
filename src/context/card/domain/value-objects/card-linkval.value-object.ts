import { CardDomainValidationError } from '../errors';

export class CardLinkval {
  private constructor(private readonly value: number | null) {}

  static create(value: number | null | undefined): CardLinkval {
    if (value == null) {
      return new CardLinkval(null);
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CardDomainValidationError({
        field: 'linkval',
        value,
        source: 'CardLinkval.create',
        rule: 'non-negative-integer-or-null',
        message: 'Card linkval must be a non-negative integer or null',
      });
    }

    return new CardLinkval(value);
  }

  toPrimitives(): number | null {
    return this.value;
  }
}
