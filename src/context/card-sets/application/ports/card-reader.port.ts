export type ImportedCard = {
  id: number;
  name: string;
};

export abstract class CardReaderPort {
  abstract findById(cardId: number): Promise<ImportedCard | null>;
}
