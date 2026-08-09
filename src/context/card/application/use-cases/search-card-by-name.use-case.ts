import { Card } from '../../domain/entities/card.entity';
import { CardId } from '../../domain/value-objects/card-id.value-object';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';
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
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly transactionManager: TransactionManagerPort,
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
      const resolvedCards = new Map<string, Card>();

      for (const rawId of limitedIds) {
        const id = CardId.create(rawId).toPrimitives();
        const card = await this.findOrSyncCardById(id);
        if (card) {
          resolvedCards.set(id, card);
        }
      }

      if (resolvedCards.size === 0) {
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
        const card = resolvedCards.get(id);

        if (!card) {
          continue;
        }

        const primitives = card.toPrimitives();
        const prints =
          await this.cardRelatedDataRepository.findPrintsWithArtworkByCardId(
            id,
          );

        if (language === 'en') {
          results.push({ ...this.stripRawData(primitives), prints });
          continue;
        }

        const translation = translationsMap.get(id);

        if (!translation) {
          results.push({ ...this.stripRawData(primitives), prints });
          continue;
        }

        results.push(this.mergeTranslation(primitives, translation, prints));
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

  private async findOrSyncCardById(id: string): Promise<Card | null> {
    const storedCard = await this.findStoredCard(id);

    if (storedCard) {
      return storedCard;
    }

    this.logger.info(
      { id },
      'Search card: card not in cache, fetching from YGOPRODeck API',
    );

    return this.syncMissingCardFromExternalSource(id);
  }

  private async findStoredCard(id: string): Promise<Card | null> {
    try {
      return await this.cardQueryRepository.findById(id);
    } catch (error) {
      const domainError = error as { code?: string };
      if (domainError.code === 'CARD_VALIDATION_ERROR') {
        this.logger.warn(
          { id },
          'Search card: stored card has invalid data, will re-sync from API',
        );
        return null;
      }
      throw error;
    }
  }

  private async syncMissingCardFromExternalSource(
    id: string,
  ): Promise<Card | null> {
    const externalData = await this.externalCardSource.findById(id);

    if (!externalData) {
      this.logger.warn({ id }, 'Search card: card not found on YGOPRODeck API');
      return null;
    }

    const synchronizedCard = Card.create(externalData.card);
    const primitives = synchronizedCard.toPrimitives();
    this.logger.info(
      { id, cardId: primitives.id, name: primitives.name },
      'Search card: data received from YGOPRODeck, persisting to database',
    );

    await this.transactionManager.transaction(async () => {
      await this.persistSynchronizedCard(synchronizedCard, externalData);
    });

    this.logger.info(
      { id, cardId: primitives.id, name: primitives.name },
      'Search card: saved to database successfully',
    );

    return synchronizedCard;
  }

  private async persistSynchronizedCard(
    card: Card,
    externalData: {
      cardSets: { name: string; code: string | null }[];
      artworks: {
        imageUrl: string;
        imageUrlSmall: string;
        imageUrlCropped: string;
      }[];
      cardPrints: {
        setName: string;
        setCode: string;
        rarity: string;
        rarityCode: string | null;
        setPrice: number | null;
      }[];
    },
  ): Promise<void> {
    const storedId = await this.cardRepository.save(card);

    const setIds = await this.cardRelatedDataRepository.saveCardSets(
      externalData.cardSets,
    );

    for (const [index, artwork] of externalData.artworks.entries()) {
      const artworkId = await this.cardRelatedDataRepository.saveArtwork(
        storedId,
        artwork.imageUrl,
        artwork.imageUrlSmall,
        artwork.imageUrlCropped,
      );

      if (index === 0) {
        await this.cardRelatedDataRepository.saveCardPrints(
          artworkId,
          externalData.cardPrints,
          setIds,
        );
      }
    }
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
    prints: CardResponse['prints'],
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
      prints,
    };
  }

  private stripRawData(
    primitives: CardPrimitives,
  ): Omit<CardResponse, 'prints'> {
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
