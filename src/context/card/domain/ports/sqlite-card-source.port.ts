export interface CardTranslationRow {
  cardId: string;
  name: string;
  desc: string;
}

export abstract class SqliteCardSourcePort {
  abstract readChunk(
    limit: number,
    offset: number,
    language: string,
  ): CardTranslationRow[];
  abstract count(language: string): number;
  abstract close(language?: string): void;
}
