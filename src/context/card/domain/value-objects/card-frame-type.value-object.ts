import type { CardFrameType as CardFrameTypePrimitive } from '../types/card.types';
import { CardDomainValidationError } from '../errors';

export class CardFrameType {
  private static readonly ALLOWED_VALUES = new Set<CardFrameTypePrimitive>([
    'normal',
    'effect',
    'ritual',
    'fusion',
    'synchro',
    'xyz',
    'link',
    'spell',
    'trap',
    'token',
    'skill',
  ]);

  private constructor(private readonly value: CardFrameTypePrimitive) {}

  static create(value: CardFrameTypePrimitive): CardFrameType {
    if (!CardFrameType.ALLOWED_VALUES.has(value)) {
      throw new CardDomainValidationError({
        field: 'frameType',
        value,
        source: 'CardFrameType.create',
        rule: 'allowed-frame-types',
        message: 'Card frameType is invalid',
      });
    }

    return new CardFrameType(value);
  }

  toPrimitives(): CardFrameTypePrimitive {
    return this.value;
  }
}
