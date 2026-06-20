import { CardDomainValidationError } from '../errors';

export class CardPrintRarity {
  private constructor(private readonly value: string) {}

  static create(value: string): CardPrintRarity {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'rarity',
        value,
        source: 'CardPrintRarity.create',
        rule: 'required-string',
        message: 'Card print rarity is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'rarity',
        value,
        source: 'CardPrintRarity.create',
        rule: 'required-string',
        message: 'Card print rarity is required',
      });
    }

    return new CardPrintRarity(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
