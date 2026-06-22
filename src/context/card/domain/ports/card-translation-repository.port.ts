import { CardTranslationData } from '../types/card-translation.types';

export abstract class CardTranslationRepositoryPort {
  abstract findByCardIdAndLanguage(
    cardId: string,
    language: string,
  ): Promise<CardTranslationData | null>;

  abstract findCardIdsByName(
    name: string,
    language: string,
  ): Promise<string[]>;

  abstract save(
    cardId: string,
    language: string,
    data: CardTranslationData,
  ): Promise<void>;
}
