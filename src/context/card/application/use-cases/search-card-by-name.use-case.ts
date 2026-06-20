import { Card } from '../../domain/entities/card.entity';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { PostgresPoolProvider } from '../../infrastructure/persistence/postgres-pool.provider';
import { CardDomainProcessError, DomainError } from '../../domain/errors';

export interface SearchCardByNameInput {
  name: string;
}

export type SearchCardByNameCommand = SearchCardByNameInput;

export class SearchCardByNameUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly postgresPoolProvider: PostgresPoolProvider,
  ) {}

  async execute(command: SearchCardByNameCommand): Promise<Card[]> {
    try {
      const localResults =
        await this.cardQueryRepository.findByName(command.name);

      if (localResults.length > 0) {
        return localResults;
      }

      return await this.syncFromExternalSource(command.name);
    } catch (error) {
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
    const externalResults =
      await this.externalCardSource.findByName(name);

    if (externalResults.length === 0) {
      return [];
    }

    const cards: Card[] = [];

    for (const externalData of externalResults) {
      const synchronizedCard = Card.create(externalData.card);

      await this.postgresPoolProvider.transaction(async () => {
        await this.cardRepository.save(synchronizedCard);

        const setIds = await this.cardRelatedDataRepository.saveCardSets(
          externalData.cardSets,
        );

        for (const [index, artwork] of externalData.artworks.entries()) {
          const artworkId =
            await this.cardRelatedDataRepository.saveArtwork(
              synchronizedCard.toPrimitives().id,
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

      cards.push(synchronizedCard);
    }

    return cards;
  }
}
