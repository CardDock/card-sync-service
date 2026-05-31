import { randomUUID } from 'crypto';

export class CardId {
  private constructor(private readonly value: string) {}

  static create(value?: string): CardId {
    if (value == null) {
      return new CardId(randomUUID());
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new Error('Card id is required');
    }

    return new CardId(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
