import { Card } from '../../domain/entities/card.entity';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardSyncDiscrepancyRepositoryPort } from '../../domain/ports/card-sync-discrepancy-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';

export interface SyncCardInput {
  id: string;
}

export type SyncCardCommand = SyncCardInput;

export class SyncCardUseCase {
  constructor(
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly cardSyncDiscrepancyRepository: CardSyncDiscrepancyRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: SyncCardCommand): Promise<Card> {
    try {
      this.logger.info(
        { id: command.id },
        'Sync card: fetching from YGOPRODeck API',
      );

      const externalData = await this.externalCardSource.findById(command.id);

      if (!externalData) {
        this.logger.warn(
          { id: command.id },
          'Sync card: YGOPRODeck returned no data',
        );
        return null;
      }

      const isManuallyEdited = await this.cardRepository.isManuallyEdited(
        command.id,
      );

      if (isManuallyEdited) {
        this.logger.info(
          { id: command.id },
          'Sync card: card is manually edited, detecting discrepancies',
        );

        await this.detectDiscrepancies(command.id, externalData.card);

        this.logger.info(
          { id: command.id },
          'Sync card: manual edit preserved, discrepancies recorded',
        );

        return this.cardQueryRepository.findById(command.id);
      }

      this.logger.info(
        { id: command.id, name: externalData.card.name },
        'Sync card: data received, persisting to database',
      );

      const card = Card.create(externalData.card);

      await this.transactionManager.transaction(async () => {
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
      });

      const primitives = card.toPrimitives();
      this.logger.info(
        { id: command.id, cardId: primitives.id, cardName: primitives.name },
        'Sync card: completed',
      );

      return card;
    } catch (error) {
      this.logger.error({ id: command.id, error }, 'Sync card: failed');
      throw this.buildProcessError(command.id, error);
    }
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
    id: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'SyncCardUseCase.execute',
      message: `Failed to sync card by id ${id}`,
      context: {
        id,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
