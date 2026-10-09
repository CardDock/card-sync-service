export type EdisonCardDocument = {
  _id: string;
  cardId: string;
  syncedAt: Date;
};

export abstract class EdisonCardsRepositoryPort {
  abstract replaceAll(cardIds: string[]): Promise<void>;

  abstract exists(cardId: string): Promise<boolean>;
}
