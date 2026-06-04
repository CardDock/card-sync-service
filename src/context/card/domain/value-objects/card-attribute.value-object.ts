import type { CardAttribute as CardAttributePrimitive } from '../types/card.types';
import { CardDomainValidationError } from '../errors';

export class CardAttribute {
  private static readonly ALLOWED_VALUES = new Set<CardAttributePrimitive>([
    'DARK',
    'LIGHT',
    'EARTH',
    'WATER',
    'FIRE',
    'WIND',
    'DIVINE',
  ]);

  private constructor(private readonly value: CardAttributePrimitive | null) {}

  static create(
    value: CardAttributePrimitive | null | undefined,
  ): CardAttribute {
    if (value == null) {
      return new CardAttribute(null);
    }

    if (!CardAttribute.ALLOWED_VALUES.has(value)) {
      throw new CardDomainValidationError({
        field: 'attribute',
        value,
        source: 'CardAttribute.create',
        rule: 'allowed-attributes',
        message: 'Card attribute is invalid',
      });
    }

    return new CardAttribute(value);
  }

  toPrimitives(): CardAttributePrimitive | null {
    return this.value;
  }
}
