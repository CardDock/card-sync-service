export class CardName {
  private constructor(private readonly value: string) {}

  static create(value: string): CardName {
    const normalized = CardName.normalizeRequiredText(value, 'name');

    return new CardName(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }

  private static normalizeRequiredText(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new Error(`Card ${fieldName} is required`);
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new Error(`Card ${fieldName} is required`);
    }

    return normalized;
  }
}
