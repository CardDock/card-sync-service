export class CardPrintRarityCode {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): CardPrintRarityCode {
    if (value == null) {
      return new CardPrintRarityCode(null);
    }

    const normalized = String(value).trim();

    return new CardPrintRarityCode(normalized.length > 0 ? normalized : null);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
