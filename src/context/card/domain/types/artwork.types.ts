import { ArtworkImageUrl } from '../value-objects/artwork-image-url.value-object';

export interface ArtworkData {
  imageUrl: string;
}

export function createArtworkData(imageUrl: string): ArtworkData {
  return {
    imageUrl: ArtworkImageUrl.create(imageUrl).toPrimitives(),
  };
}
