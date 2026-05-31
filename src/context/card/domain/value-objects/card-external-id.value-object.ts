export class CardExternalId {
  private constructor(private readonly value: number) {}

  static create(value: number): CardExternalId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Card externalId must be a positive integer');
    }

    return new CardExternalId(value);
  }

  toPrimitives(): number {
    return this.value;
  }
}
