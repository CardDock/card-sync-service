import { CardDomainValidationError } from '../errors';

export type CardImageVariantPrimitive = 'normal' | 'small' | 'cropped';

const VARIANT_URL_SEGMENTS: Record<CardImageVariantPrimitive, string> = {
  normal: 'cards',
  small: 'cards_small',
  cropped: 'cards_cropped',
};

const VALID_VARIANTS = new Set<string>(['normal', 'small', 'cropped']);

export class CardImageVariant {
  private constructor(private readonly value: CardImageVariantPrimitive) {}

  static create(value?: string): CardImageVariant {
    const normalized = (value ?? 'normal')
      .trim()
      .toLowerCase() as CardImageVariantPrimitive;

    if (!VALID_VARIANTS.has(normalized)) {
      throw new CardDomainValidationError({
        field: 'variant',
        value,
        source: 'CardImageVariant.create',
        rule: 'supported-variant',
        message: `Unsupported image variant: ${value}. Supported: normal, small, cropped`,
      });
    }

    return new CardImageVariant(normalized);
  }

  toUrlSegment(): string {
    return VARIANT_URL_SEGMENTS[this.value];
  }

  toPrimitives(): CardImageVariantPrimitive {
    return this.value;
  }
}
