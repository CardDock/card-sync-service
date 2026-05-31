import { CardClassificationPrimitives } from '../types/card.types';

export class CardClassification {
  private constructor(private readonly props: CardClassificationPrimitives) {}

  static create(props: Partial<CardClassificationPrimitives> = {}): CardClassification {
    const normalized: CardClassificationPrimitives = {
      race: CardClassification.normalizeNullableText(props.race),
      attribute: CardClassification.normalizeNullableText(props.attribute),
      archetype: CardClassification.normalizeNullableText(props.archetype),
    };

    return new CardClassification(normalized);
  }

  toPrimitives(): CardClassificationPrimitives {
    return { ...this.props };
  }

  private static normalizeNullableText(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }
}
