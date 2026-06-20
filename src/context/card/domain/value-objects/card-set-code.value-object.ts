export class CardSetCode {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): CardSetCode {
    if (value == null) {
      return new CardSetCode(null);
    }

    const normalized = String(value).trim();

    return new CardSetCode(normalized.length > 0 ? normalized : null);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
