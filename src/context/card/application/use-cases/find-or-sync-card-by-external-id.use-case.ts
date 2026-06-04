import { Card } from '../../domain/entities/card.entity';
import { CardExternalId } from '../../domain/value-objects/card-external-id.value-object';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';

export interface FindOrSyncCardByExternalIdInput {
  externalId: string;
}

export type FindOrSyncCardByExternalIdCommand = FindOrSyncCardByExternalIdInput;

export class FindOrSyncCardByExternalIdUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly externalCardSource: ExternalCardSourcePort,
    private readonly cardRepository: CardRepositoryPort,
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
    const externalCard =
      await this.externalCardSource.findByExternalId(externalId);

    if (!externalCard) {
      return null;
    }

    const synchronizedCard = Card.create(externalCard);

    await this.persistSynchronizedCard(synchronizedCard);

    return synchronizedCard;
  }

  private async persistSynchronizedCard(card: Card): Promise<void> {
    await this.cardRepository.save(card);
  }
}
