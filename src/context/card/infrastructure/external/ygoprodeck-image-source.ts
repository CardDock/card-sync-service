import { Injectable } from '@nestjs/common';
import { ExternalImageSourcePort } from '../../domain/ports/external-image-source.port';
import { CardImageVariant } from '../../domain/value-objects/card-image-variant.value-object';
import { CardDomainProcessError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

@Injectable()
export class YgoProDeckImageSourceAdapter extends ExternalImageSourcePort {
  private readonly baseUrl =
    process.env.YGOPRODECK_IMAGE_BASE_URL ??
    'https://images.ygoprodeck.com/images';

  constructor(private readonly logger: Logger) {
    super();
  }

  async fetchImage(
    cardId: string,
    variant: CardImageVariant,
  ): Promise<Buffer | null> {
    const url = `${this.baseUrl}/${variant.toUrlSegment()}/${cardId}.jpg`;

    this.logger.info(
      { cardId, variant: variant.toPrimitives(), url },
      'Fetching image from YGOPRODeck',
    );

    const response = await fetch(url, {
      headers: {
        Accept: 'image/jpeg,image/*,*/*',
      },
    });

    if (response.status === 404) {
      this.logger.warn(
        { cardId, variant: variant.toPrimitives(), url },
        'Image not found on YGOPRODeck',
      );
      return null;
    }

    if (!response.ok) {
      throw new CardDomainProcessError({
        stage: 'YgoProDeckImageSourceAdapter.fetchImage',
        message: `Failed to fetch image for card ${cardId} from YGOPRODeck`,
        context: {
          cardId,
          variant: variant.toPrimitives(),
          httpStatus: response.status,
          provider: 'YGOPRODeck',
        },
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
