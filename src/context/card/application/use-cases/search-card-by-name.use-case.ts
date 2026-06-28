import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';
import {
  CardPrimitives,
  CardResponse,
  CardRace,
} from '../../domain/types/card.types';

export interface SearchCardByNameInput {
  name: string;
  language?: string;
}

export type SearchCardByNameCommand = SearchCardByNameInput;

export class SearchCardByNameUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: SearchCardByNameCommand): Promise<CardResponse[]> {
    try {
      this.logger.info(
        { name: command.name, language: command.language },
        'Search card: starting',
      );

      const cardIds = await this.resolveCardIds(command.name, command.language);

      if (cardIds.length === 0) {
        this.logger.info(
          { name: command.name, language: command.language },
          'Search card: no local results found',
        );
        return [];
      }

      const limitedIds = cardIds.slice(0, 20);
      const cardsMap = await this.cardQueryRepository.findByIds(limitedIds);

      if (cardsMap.size === 0) {
        return [];
      }

      const language = command.language ?? 'en';

      const translationsMap =
        language !== 'en'
          ? await this.cardTranslationRepository.findByCardIdsAndLanguage(
              limitedIds,
              language,
            )
          : new Map();

      const results: CardResponse[] = [];

      for (const id of limitedIds) {
        const card = cardsMap.get(id);

        if (!card) {
          continue;
        }

        const primitives = card.toPrimitives();

        if (language === 'en') {
          results.push(this.stripRawData(primitives));
          continue;
        }

        const translation = translationsMap.get(id);

        if (!translation) {
          results.push(this.stripRawData(primitives));
          continue;
        }

        results.push(this.mergeTranslation(primitives, translation));
      }

      this.logger.info(
        { name: command.name, count: results.length },
        'Search card: completed',
      );

      return results;
    } catch (error) {
      this.logger.error(
        { name: command.name, language: command.language, error },
        'Search card: failed',
      );
      throw this.buildProcessError(command.name, error);
    }
  }

  private async resolveCardIds(
    name: string,
    language?: string,
  ): Promise<string[]> {
    if (language !== undefined) {
      return this.cardTranslationRepository.findCardIdsByName(name, language);
    }

    const cards = await this.cardQueryRepository.findByName(name);
    return cards.map((c) => c.toPrimitives().id);
  }

  private mergeTranslation(
    primitives: CardPrimitives,
    translation: {
      name: string;
      desc: string;
      type?: string | null;
      humanReadableCardType?: string | null;
      race?: string | null;
    },
  ): CardResponse {
    const response = this.stripRawData(primitives);

    return {
      ...response,
      name: translation.name,
      desc: translation.desc,
      type: translation.type ?? response.type,
      humanReadableCardType:
        translation.humanReadableCardType ?? response.humanReadableCardType,
      race: (translation.race ?? response.race) as CardRace,
    };
  }

  private stripRawData(primitives: CardPrimitives): CardResponse {
    const { rawData: _, ...response } = primitives;
    return response;
  }

  private buildProcessError(
    name: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'SearchCardByNameUseCase.execute',
      message: `Failed to search card by name ${name}`,
      context: {
        name,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
