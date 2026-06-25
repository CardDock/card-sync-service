import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { ArtworkImageUrl } from '../../domain/value-objects/artwork-image-url.value-object';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface AddCardArtworkInput {
  cardId: string;
  imageUrl: string;
}

export type AddCardArtworkCommand = AddCardArtworkInput;

export class AddCardArtworkUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: AddCardArtworkCommand): Promise<{ id: string }> {
    try {
      this.logger.info(
        { cardId: command.cardId },
        'Add artwork: checking card exists',
      );

      const existing = await this.cardQueryRepository.findById(command.cardId);

      if (!existing) {
        throw new CardDomainProcessError({
          stage: 'AddCardArtworkUseCase.execute',
          message: `Card with id ${command.cardId} not found`,
          context: { cardId: command.cardId },
        });
      }

      const imageUrl = ArtworkImageUrl.create(command.imageUrl);

      this.logger.info(
        { cardId: command.cardId, imageUrl: imageUrl.toPrimitives() },
        'Add artwork: saving',
      );

      const artworkId = await this.cardRelatedDataRepository.saveArtwork(
        command.cardId,
        imageUrl.toPrimitives(),
      );

      this.logger.info(
        { cardId: command.cardId, artworkId },
        'Add artwork: completed',
      );

      return { id: artworkId };
    } catch (error) {
      this.logger.error(
        { cardId: command.cardId, error },
        'Add artwork: failed',
      );
      throw this.buildProcessError(command.cardId, error);
    }
  }

  private buildProcessError(
    cardId: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'AddCardArtworkUseCase.execute',
      message: `Failed to add artwork for card ${cardId}`,
      context: {
        cardId,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
