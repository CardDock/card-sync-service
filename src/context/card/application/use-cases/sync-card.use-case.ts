import { Card } from '../../domain/entities/card.entity';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { PostgresPoolProvider } from '../../infrastructure/persistence/postgres-pool.provider';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface SyncCardInput {
  externalId: string;
}

export type SyncCardCommand = SyncCardInput;

export class SyncCardUseCase {
  constructor(
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly postgresPoolProvider: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async execute(command: SyncCardCommand): Promise<Card> {
    try {
      this.logger.info(
        { externalId: command.externalId },
        'Sync card: fetching from YGOPRODeck API',
      );

      const externalData =
        await this.externalCardSource.findByExternalId(command.externalId);

      if (!externalData) {
        this.logger.warn(
          { externalId: command.externalId },
          'Sync card: YGOPRODeck returned no data',
        );
        return null;
      }

      this.logger.info(
        { externalId: command.externalId, name: externalData.card.name },
        'Sync card: data received, persisting to database',
      );

      const card = Card.create(externalData.card);

      await this.postgresPoolProvider.transaction(async () => {
        const storedId = await this.cardRepository.save(card);

        const setIds = await this.cardRelatedDataRepository.saveCardSets(
          externalData.cardSets,
        );

        for (const [index, artwork] of externalData.artworks.entries()) {
          const artworkId =
            await this.cardRelatedDataRepository.saveArtwork(
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
        { externalId: command.externalId, cardId: primitives.id, cardName: primitives.name },
        'Sync card: completed',
      );

      return card;
    } catch (error) {
      this.logger.error(
        { externalId: command.externalId, error },
        'Sync card: failed',
      );
      throw this.buildProcessError(command.externalId, error);
    }
  }

  private buildProcessError(
    externalId: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'SyncCardUseCase.execute',
      message: `Failed to sync card by externalId ${externalId}`,
      context: {
        externalId,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
