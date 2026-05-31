export class CardCreatedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date = new Date()): CardCreatedAt {
    CardCreatedAt.ensureValidDate(value, 'createdAt');

    return new CardCreatedAt(new Date(value));
  }

  toPrimitives(): Date {
    return new Date(this.value);
  }

  private static ensureValidDate(value: Date, fieldName: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`Card ${fieldName} must be a valid date`);
    }
  }
}
