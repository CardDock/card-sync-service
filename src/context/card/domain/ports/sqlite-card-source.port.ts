export interface CardTranslationRow {
  cardId: string;
  name: string;
  desc: string;
}

export abstract class SqliteCardSourcePort {
  abstract readChunk(limit: number, offset: number): CardTranslationRow[];
  abstract count(): number;
  abstract close(): void;
}
