import { Card } from '../../domain/entities/card.entity';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { PostgresPoolProvider } from '../../infrastructure/persistence/postgres-pool.provider';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface SearchCardByNameInput {
  name: string;
}

export type SearchCardByNameCommand = SearchCardByNameInput;

export class SearchCardByNameUseCase {
  constructor(
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly postgresPoolProvider: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async execute(command: SearchCardByNameCommand): Promise<Card[]> {
    try {
      this.logger.info({ name: command.name }, 'Search card: fetching from YGOPRODeck API');
      return await this.syncFromExternalSource(command.name);
    } catch (error) {
      this.logger.error({ name: command.name, error }, 'Search card: failed');
      throw this.buildProcessError(command.name, error);
    }
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

  private async syncFromExternalSource(name: string): Promise<Card[]> {
    this.logger.info({ name }, 'Search card: requesting YGOPRODeck API');
    const externalResults =
      await this.externalCardSource.findByName(name);

    if (externalResults.length === 0) {
      this.logger.warn({ name }, 'Search card: YGOPRODeck returned no results');
      return [];
    }

    this.logger.info({ name, count: externalResults.length }, 'Search card: data received from YGOPRODeck, persisting to database');
    const cards: Card[] = [];

    for (const externalData of externalResults) {
      const synchronizedCard = Card.create(externalData.card);
      const primitives = synchronizedCard.toPrimitives();

      await this.postgresPoolProvider.transaction(async () => {
        await this.cardRepository.save(synchronizedCard);

        const setIds = await this.cardRelatedDataRepository.saveCardSets(
          externalData.cardSets,
        );

        for (const [index, artwork] of externalData.artworks.entries()) {
          const artworkId =
            await this.cardRelatedDataRepository.saveArtwork(
              primitives.id,
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

      this.logger.info({ name, cardId: primitives.id, cardName: primitives.name }, 'Search card: synced from YGOPRODeck');
      cards.push(synchronizedCard);
    }

    this.logger.info({ name, totalSynced: cards.length }, 'Search card: sync completed');
    return cards;
  }
}
