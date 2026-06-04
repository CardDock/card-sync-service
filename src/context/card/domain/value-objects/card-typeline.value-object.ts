export class CardTypeline {
  private constructor(private readonly value: string[]) {}

  static create(value: string[]): CardTypeline {
    if (!Array.isArray(value)) {
      throw new Error('Card typeline must be an array of non-empty strings');
    }

    const normalized = value.map((item) => {
      if (typeof item !== 'string') {
        throw new Error('Card typeline must be an array of non-empty strings');
      }

      return item.trim();
    });

    if (normalized.some((item) => item.length === 0)) {
      throw new Error('Card typeline must be an array of non-empty strings');
    }

    return new CardTypeline(normalized);
  }

  toPrimitives(): string[] {
    return [...this.value];
  }
}
