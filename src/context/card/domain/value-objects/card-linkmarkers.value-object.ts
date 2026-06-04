import type { CardLinkMarker } from '../types/card.types';
import { CardDomainValidationError } from '../errors';

export class CardLinkmarkers {
  private static readonly ALLOWED_VALUES = new Set<CardLinkMarker>([
    'Top',
    'Bottom',
    'Left',
    'Right',
    'BottomLeft',
    'BottomRight',
    'TopLeft',
    'TopRight',
  ]);

  private constructor(private readonly value: CardLinkMarker[]) {}

  static create(value: CardLinkMarker[]): CardLinkmarkers {
    if (!Array.isArray(value)) {
      throw new CardDomainValidationError({
        field: 'linkmarkers',
        value,
        source: 'CardLinkmarkers.create',
        rule: 'array-of-valid-link-markers',
        message: 'Card linkmarkers must be an array of valid link markers',
      });
    }

    if (value.some((item) => !CardLinkmarkers.ALLOWED_VALUES.has(item))) {
      throw new CardDomainValidationError({
        field: 'linkmarkers',
        value,
        source: 'CardLinkmarkers.create',
        rule: 'array-of-valid-link-markers',
        message: 'Card linkmarkers must be an array of valid link markers',
      });
    }

    return new CardLinkmarkers([...value]);
  }

  toPrimitives(): CardLinkMarker[] {
    return [...this.value];
  }
}
