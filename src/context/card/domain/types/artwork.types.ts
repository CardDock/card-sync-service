import { ArtworkImageUrl } from '../value-objects/artwork-image-url.value-object';

export interface ArtworkData {
  imageUrl: string;
  imageUrlSmall: string;
  imageUrlCropped: string;
}

export function createArtworkData(
  imageUrl: string,
  imageUrlSmall: string,
  imageUrlCropped: string,
): ArtworkData {
  return {
    imageUrl: ArtworkImageUrl.create(imageUrl).toPrimitives(),
    imageUrlSmall: ArtworkImageUrl.create(imageUrlSmall).toPrimitives(),
    imageUrlCropped: ArtworkImageUrl.create(imageUrlCropped).toPrimitives(),
  };
}
