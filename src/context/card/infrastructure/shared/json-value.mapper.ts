import { JsonValue } from '../../domain/types/card.types';

export function toJsonValue(value: unknown): JsonValue {
  if (value == null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as JsonValue;
}
