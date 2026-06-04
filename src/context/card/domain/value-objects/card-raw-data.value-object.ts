import type { JsonValue } from '../types/card.types';

export class CardRawData {
  private constructor(private readonly value: JsonValue) {}

  static create(value: JsonValue): CardRawData {
    return new CardRawData(CardRawData.cloneJson(value));
  }

  toPrimitives(): JsonValue {
    return CardRawData.cloneJson(this.value);
  }

  private static cloneJson(value: JsonValue): JsonValue {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  }
}
