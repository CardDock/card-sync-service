export class CardDescription {
  private constructor(private readonly value: string) {}

  static create(value: string): CardDescription {
    const normalized = CardDescription.normalizeRequiredText(value, 'description');

    return new CardDescription(normalized);
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
