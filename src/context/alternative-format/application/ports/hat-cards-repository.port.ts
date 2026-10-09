export type HatCardDocument = {
  _id: string;
  cardId: string;
  syncedAt: Date;
};

export abstract class HatCardsRepositoryPort {
  abstract replaceAll(cardIds: string[]): Promise<void>;

  abstract exists(cardId: string): Promise<boolean>;
}
