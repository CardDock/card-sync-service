import { Card } from '../../domain/entities/card.entity';
import { CardExternalId } from '../../domain/value-objects/card-external-id.value-object';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { PostgresPoolProvider } from '../../infrastructure/persistence/postgres-pool.provider';

export interface FindOrSyncCardByExternalIdInput {
  externalId: string;
}

export type FindOrSyncCardByExternalIdCommand = FindOrSyncCardByExternalIdInput;

export class FindOrSyncCardByExternalIdUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly postgresPoolProvider: PostgresPoolProvider,
  ) {}

  async execute(
    command: FindOrSyncCardByExternalIdCommand,
  ): Promise<Card | null> {
    try {
      const cardExternalId = this.normalizeCardExternalId(command.externalId);

      const storedCard = await this.findStoredCard(cardExternalId);

      if (storedCard) {
        return storedCard;
      }

      return await this.syncMissingCardFromExternalSource(cardExternalId);
    } catch (error) {
      throw this.buildProcessError(command.externalId, error);
    }
  }

  private buildProcessError(
    externalId: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'FindOrSyncCardByExternalIdUseCase.execute',
      message: `Failed to find or synchronize card with external id ${externalId}`,
      context: {
        externalId,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }

  private normalizeCardExternalId(externalId: string): string {
    return CardExternalId.create(externalId).toPrimitives();
  }

  private async findStoredCard(externalId: string): Promise<Card | null> {
    return this.cardQueryRepository.findByExternalId(externalId);
  }

  private async syncMissingCardFromExternalSource(
    externalId: string,
  ): Promise<Card | null> {
    const externalData =
      await this.externalCardSource.findByExternalId(externalId);

    if (!externalData) {
      return null;
    }

    const synchronizedCard = Card.create(externalData.card);

    await this.postgresPoolProvider.transaction(async () => {
      await this.persistSynchronizedCard(synchronizedCard, externalData);
    });

    return synchronizedCard;
  }

  private async persistSynchronizedCard(
    card: Card,
    externalData: {
      cardSets: { name: string; code: string | null }[];
      artworks: { imageUrl: string }[];
      cardPrints: { setName: string; setCode: string; rarity: string; rarityCode: string | null; setPrice: number | null }[];
    },
  ): Promise<void> {
    const cardPrimitives = card.toPrimitives();

    await this.cardRepository.save(card);

    const setIds = await this.cardRelatedDataRepository.saveCardSets(
      externalData.cardSets,
    );

    for (const [index, artwork] of externalData.artworks.entries()) {
      const artworkId = await this.cardRelatedDataRepository.saveArtwork(
        cardPrimitives.id,
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
