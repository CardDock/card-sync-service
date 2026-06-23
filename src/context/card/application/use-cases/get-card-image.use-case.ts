import { CardImageVariant } from '../../domain/value-objects/card-image-variant.value-object';
import { ImageStoragePort } from '../../domain/ports/image-storage.port';
import { ExternalImageSourcePort } from '../../domain/ports/external-image-source.port';
import { Logger } from '../../domain/ports/logger.port';

export interface GetCardImageInput {
  cardId: string;
  variant?: string;
}

export interface GetCardImageResult {
  filePath: string;
}

export class GetCardImageUseCase {
  constructor(
    private readonly imageStorage: ImageStoragePort,
    private readonly externalImageSource: ExternalImageSourcePort,
    private readonly logger: Logger,
  ) {}

  async execute(input: GetCardImageInput): Promise<GetCardImageResult | null> {
    const variant = CardImageVariant.create(input.variant);

    this.logger.info(
      { cardId: input.cardId, variant: variant.toPrimitives() },
      'Get card image: checking local storage',
    );

    const localPath = await this.imageStorage.getImagePath(
      input.cardId,
      variant,
    );

    if (localPath) {
      this.logger.info(
        { cardId: input.cardId, variant: variant.toPrimitives(), filePath: localPath },
        'Get card image: found in local storage',
      );
      return { filePath: localPath };
    }

    this.logger.info(
      { cardId: input.cardId, variant: variant.toPrimitives() },
      'Get card image: not found locally, fetching from YGOPRODeck',
    );

    const buffer = await this.externalImageSource.fetchImage(
      input.cardId,
      variant,
    );

    if (!buffer) {
      this.logger.warn(
        { cardId: input.cardId, variant: variant.toPrimitives() },
        'Get card image: not found in YGOPRODeck',
      );
      return null;
    }

    const savedPath = await this.imageStorage.saveImage(
      input.cardId,
      variant,
      buffer,
    );

    this.logger.info(
      { cardId: input.cardId, variant: variant.toPrimitives(), filePath: savedPath },
      'Get card image: saved to local storage',
    );

    return { filePath: savedPath };
  }
}
