import { CardImageVariant } from '../value-objects/card-image-variant.value-object';

export abstract class ExternalImageSourcePort {
  abstract fetchImage(
    cardId: string,
    variant: CardImageVariant,
  ): Promise<Buffer | null>;
}
