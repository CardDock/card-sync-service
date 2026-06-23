import { CardImageVariant } from '../value-objects/card-image-variant.value-object';

export abstract class ImageStoragePort {
  abstract getImagePath(
    cardId: string,
    variant: CardImageVariant,
  ): Promise<string | null>;

  abstract saveImage(
    cardId: string,
    variant: CardImageVariant,
    buffer: Buffer,
  ): Promise<string>;
}
