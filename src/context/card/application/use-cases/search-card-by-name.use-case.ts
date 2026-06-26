import { Card } from '../../domain/entities/card.entity';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardSyncDiscrepancyRepositoryPort } from '../../domain/ports/card-sync-discrepancy-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Language } from '../../domain/value-objects/language.value-object';
import { Logger } from '../../domain/ports/logger.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';
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
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly cardSyncDiscrepancyRepository: CardSyncDiscrepancyRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: SearchCardByNameCommand): Promise<CardResponse[]> {
    try {
      const language = Language.create(command.language ?? 'en');

      this.logger.info(
        { name: command.name, language: language.toPrimitives() },
        'Search card: starting',
      );

      if (!language.isEnglish()) {
        const translated = await this.searchByTranslatedName(
          command.name,
          language.toPrimitives(),
        );

        if (translated.length > 0) {
          return translated;
        }

        this.logger.info(
          { name: command.name, language: language.toPrimitives() },
          'Search card: no translations found, falling back to YGOPRODeck',
        );
      }

      return await this.syncFromExternalSource(
        command.name,
        language.toPrimitives(),
      );
    } catch (error) {
      this.logger.error(
        { name: command.name, language: command.language, error },
        'Search card: failed',
      );
      throw this.buildProcessError(command.name, error);
    }
  }

  private async searchByTranslatedName(
    name: string,
    language: string,
  ): Promise<CardResponse[]> {
    const cardIds = await this.cardTranslationRepository.findCardIdsByName(
      name,
      language,
    );

    if (cardIds.length === 0) {
      return [];
    }

    const results: CardResponse[] = [];

    for (const cardId of cardIds) {
      const card = await this.cardQueryRepository.findById(cardId);

      if (!card) {
        continue;
      }

      const response = await this.applyTranslations(card, language);
      results.push(response);
    }

    this.logger.info(
      { name, language, count: results.length },
      'Search card: found via translations',
    );
    return results;
  }

  private async syncFromExternalSource(
    name: string,
    language: string,
  ): Promise<CardResponse[]> {
    this.logger.info({ name }, 'Search card: requesting YGOPRODeck API');
    const externalResults = await this.externalCardSource.findByName(name);

    if (externalResults.length === 0) {
      this.logger.warn({ name }, 'Search card: YGOPRODeck returned no results');
      return [];
    }

    this.logger.info(
      { name, count: externalResults.length },
      'Search card: data received from YGOPRODeck, persisting to database',
    );
    const cards: Card[] = [];

    for (const externalData of externalResults) {
      const cardId = externalData.card.id;
      const isManuallyEdited =
        await this.cardRepository.isManuallyEdited(cardId);

      if (isManuallyEdited) {
        this.logger.info(
          { id: cardId, name: externalData.card.name },
          'Search card: card is manually edited, tracking discrepancies',
        );

        await this.detectDiscrepancies(cardId, externalData.card);

        const storedCard = await this.cardQueryRepository.findById(cardId);
        if (storedCard) {
          cards.push(storedCard);
        }

        continue;
      }

      const synchronizedCard = Card.create(externalData.card);

      await this.transactionManager.transaction(async () => {
        const storedId = await this.cardRepository.save(synchronizedCard);

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
      });

      const primitives = synchronizedCard.toPrimitives();
      this.logger.info(
        { name, cardId: primitives.id, cardName: primitives.name },
        'Search card: synced from YGOPRODeck',
      );
      cards.push(synchronizedCard);
    }

    this.logger.info(
      { name, totalSynced: cards.length },
      'Search card: sync completed',
    );

    const responses: CardResponse[] = [];

    for (const card of cards) {
      const response = await this.applyTranslations(card, language);
      responses.push(response);
    }

    return responses;
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

  private async detectDiscrepancies(
    cardId: string,
    apiCardParams: Parameters<typeof Card.create>[0],
  ): Promise<void> {
    const storedCard = await this.cardQueryRepository.findById(cardId);

    if (!storedCard) {
      return;
    }

    const localPrimitives = storedCard.toPrimitives();

    const fieldsToCompare: Array<{
      name: string;
      local: unknown;
      api: unknown;
    }> = [
      { name: 'name', local: localPrimitives.name, api: apiCardParams.name },
      {
        name: 'typeline',
        local: localPrimitives.typeline,
        api: apiCardParams.typeline,
      },
      { name: 'type', local: localPrimitives.type, api: apiCardParams.type },
      {
        name: 'humanReadableCardType',
        local: localPrimitives.humanReadableCardType,
        api: apiCardParams.humanReadableCardType,
      },
      {
        name: 'frameType',
        local: localPrimitives.frameType,
        api: apiCardParams.frameType,
      },
      { name: 'desc', local: localPrimitives.desc, api: apiCardParams.desc },
      { name: 'race', local: localPrimitives.race, api: apiCardParams.race },
      {
        name: 'atk',
        local: localPrimitives.atk,
        api: apiCardParams.atk ?? null,
      },
      {
        name: 'def',
        local: localPrimitives.def,
        api: apiCardParams.def ?? null,
      },
      {
        name: 'level',
        local: localPrimitives.level,
        api: apiCardParams.level ?? null,
      },
      {
        name: 'scale',
        local: localPrimitives.scale,
        api: apiCardParams.scale ?? null,
      },
      {
        name: 'linkval',
        local: localPrimitives.linkval,
        api: apiCardParams.linkval ?? null,
      },
      {
        name: 'linkmarkers',
        local: localPrimitives.linkmarkers,
        api: apiCardParams.linkmarkers,
      },
      {
        name: 'attribute',
        local: localPrimitives.attribute,
        api: apiCardParams.attribute ?? null,
      },
    ];

    for (const field of fieldsToCompare) {
      if (!this.valuesAreEqual(field.local, field.api)) {
        await this.cardSyncDiscrepancyRepository.upsert(
          cardId,
          field.name,
          field.local,
          field.api,
        );
      }
    }
  }

  private valuesAreEqual(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((val, index) => val === b[index]);
    }

    return a === b;
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
