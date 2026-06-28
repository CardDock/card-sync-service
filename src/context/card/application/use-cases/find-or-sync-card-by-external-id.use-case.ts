import { Card } from '../../domain/entities/card.entity';
import { CardId } from '../../domain/value-objects/card-id.value-object';
import { Language } from '../../domain/value-objects/language.value-object';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';
import {
  CardPrimitives,
  CardResponse,
  CardRace,
} from '../../domain/types/card.types';

export interface FindOrSyncCardByIdInput {
  id: string;
  language?: string;
}

export type FindOrSyncCardByIdCommand = FindOrSyncCardByIdInput;

export class FindOrSyncCardByExternalIdUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: FindOrSyncCardByIdCommand,
  ): Promise<CardResponse | null> {
    try {
      const cardId = this.normalizeCardId(command.id);
      const language = this.normalizeLanguage(command.language);

      this.logger.info(
        { id: cardId, language: language.toPrimitives() },
        'Find card: checking database cache',
      );
      const storedCard = await this.findStoredCard(cardId);

      let card: Card;

      if (storedCard) {
        const primitives = storedCard.toPrimitives();
        this.logger.info(
          { id: cardId, cardId: primitives.id, name: primitives.name },
          'Find card: found in cache, skipped sync',
        );
        card = storedCard;
      } else {
        this.logger.info(
          { id: cardId },
          'Find card: not in cache, fetching from YGOPRODeck API',
        );
        const synced = await this.syncMissingCardFromExternalSource(cardId);

        if (!synced) {
          return null;
        }

        card = synced;
      }

      return await this.applyTranslations(card, language.toPrimitives());
    } catch (error) {
      this.logger.error(
        { id: command.id, language: command.language, error },
        'Find card: failed',
      );
      throw this.buildProcessError(command.id, error);
    }
  }

  private async applyTranslations(
    card: Card,
    language: string,
  ): Promise<CardResponse> {
    const primitives = card.toPrimitives();

    if (language === 'en') {
      return this.stripRawData(primitives);
    }

    const translation =
      await this.cardTranslationRepository.findByCardIdAndLanguage(
        primitives.id,
        language,
      );

    if (!translation) {
      return this.stripRawData(primitives);
    }

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
    id: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'FindOrSyncCardByExternalIdUseCase.execute',
      message: `Failed to find or synchronize card with id ${id}`,
      context: {
        id,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }

  private normalizeCardId(id: string): string {
    return CardId.create(id).toPrimitives();
  }

  private normalizeLanguage(language?: string): Language {
    return Language.create(language ?? 'en');
  }

  private async findStoredCard(id: string): Promise<Card | null> {
    try {
      return await this.cardQueryRepository.findById(id);
    } catch (error) {
      const domainError = error as { code?: string };
      if (domainError.code === 'CARD_VALIDATION_ERROR') {
        this.logger.warn(
          { id },
          'Find card: stored card has invalid data, will re-sync from API',
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
      this.logger.warn({ id }, 'Sync card: not found on YGOPRODeck API');
      return null;
    }

    const synchronizedCard = Card.create(externalData.card);
    const primitives = synchronizedCard.toPrimitives();
    this.logger.info(
      { id, cardId: primitives.id, name: primitives.name },
      'Sync card: data received from YGOPRODeck, persisting to database',
    );

    await this.transactionManager.transaction(async () => {
      await this.persistSynchronizedCard(synchronizedCard, externalData);
    });

    this.logger.info(
      { id, cardId: primitives.id, name: primitives.name },
      'Sync card: saved to database successfully',
    );
    return synchronizedCard;
  }

  private async persistSynchronizedCard(
    card: Card,
    externalData: {
      cardSets: { name: string; code: string | null }[];
      artworks: { imageUrl: string }[];
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
}
