import { Card } from '../../domain/entities/card.entity';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
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
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
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
