export class CardLastSyncedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date = new Date()): CardLastSyncedAt {
    CardLastSyncedAt.ensureValidDate(value, 'lastSyncedAt');

    return new CardLastSyncedAt(new Date(value));
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
