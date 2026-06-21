import { ArtworkImageUrl } from '../../../../../context/card/domain/value-objects/artwork-image-url.value-object';

describe('ArtworkImageUrl', () => {
  it('creates a valid URL', () => {
    const url = ArtworkImageUrl.create('https://images.ygoprodeck.com/images/cards/46986414.jpg');
    expect(url.toPrimitives()).toBe('https://images.ygoprodeck.com/images/cards/46986414.jpg');
  });

  it('trims whitespace', () => {
    const url = ArtworkImageUrl.create('  https://example.com/card.jpg  ');
    expect(url.toPrimitives()).toBe('https://example.com/card.jpg');
  });

  it('accepts http:// URLs', () => {
    const url = ArtworkImageUrl.create('http://example.com/card.jpg');
    expect(url.toPrimitives()).toBe('http://example.com/card.jpg');
  });

  it('throws when value is empty string', () => {
    expect(() => ArtworkImageUrl.create('')).toThrow(
      new Error('Artwork image URL is required'),
    );
  });

  it('throws when value is only whitespace', () => {
    expect(() => ArtworkImageUrl.create('   \n   ')).toThrow(
      new Error('Artwork image URL is required'),
    );
  });

  it('throws when URL does not start with http:// or https://', () => {
    expect(() => ArtworkImageUrl.create('ftp://example.com/card.jpg')).toThrow(
      new Error('Artwork image URL must be a valid HTTP or HTTPS URL'),
    );
  });
});
