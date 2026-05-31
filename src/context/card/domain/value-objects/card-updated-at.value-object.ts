export class CardUpdatedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date = new Date()): CardUpdatedAt {
    CardUpdatedAt.ensureValidDate(value, 'updatedAt');

    return new CardUpdatedAt(new Date(value));
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
