import { CardTranslationData } from '../types/card-translation.types';

export interface BatchTranslationRow {
  cardId: string;
  language: string;
  name: string;
  desc: string;
}

export abstract class CardTranslationRepositoryPort {
  abstract findByCardIdAndLanguage(
    cardId: string,
    language: string,
  ): Promise<CardTranslationData | null>;

  abstract findCardIdsByName(name: string, language: string): Promise<string[]>;

  abstract findByCardIdsAndLanguage(
    cardIds: string[],
    language: string,
  ): Promise<Map<string, CardTranslationData>>;

  abstract save(
    cardId: string,
    language: string,
    data: CardTranslationData,
  ): Promise<void>;

  abstract deleteByCardId(cardId: string): Promise<void>;

  abstract batchUpsert(rows: BatchTranslationRow[]): Promise<void>;
}
