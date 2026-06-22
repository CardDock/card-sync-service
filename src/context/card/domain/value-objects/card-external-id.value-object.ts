export class CardExternalId {
  private constructor() {}

  static create(value: string): never {
    throw new Error('CardExternalId is deprecated — use CardId instead');
  }
}
