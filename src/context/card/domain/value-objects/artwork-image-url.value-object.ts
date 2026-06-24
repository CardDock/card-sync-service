import { CardDomainValidationError } from '../errors';

export class ArtworkImageUrl {
  private constructor(private readonly value: string) {}

  static create(value: string): ArtworkImageUrl {
    if (typeof value !== 'string') {
      throw new CardDomainValidationError({
        field: 'imageUrl',
        value,
        source: 'ArtworkImageUrl.create',
        rule: 'required-string',
        message: 'Artwork image URL is required',
      });
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new CardDomainValidationError({
        field: 'imageUrl',
        value,
        source: 'ArtworkImageUrl.create',
        rule: 'required-string',
        message: 'Artwork image URL is required',
      });
    }

    if (
      !normalized.startsWith('http://') &&
      !normalized.startsWith('https://')
    ) {
      throw new CardDomainValidationError({
        field: 'imageUrl',
        value,
        source: 'ArtworkImageUrl.create',
        rule: 'valid-url',
        message: 'Artwork image URL must be a valid HTTP or HTTPS URL',
      });
    }

    return new ArtworkImageUrl(normalized);
  }

  toPrimitives(): string {
    return this.value;
  }
}
