export type GoatCardDocument = {
  _id: string;
  cardId: string;
  syncedAt: Date;
};

export abstract class GoatCardsRepositoryPort {
  abstract replaceAll(cardIds: string[]): Promise<void>;

  abstract exists(cardId: string): Promise<boolean>;
}
