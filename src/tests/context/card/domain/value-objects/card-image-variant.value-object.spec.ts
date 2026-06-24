import { CardImageVariant } from '../../../../../context/card/domain/value-objects/card-image-variant.value-object';

describe('CardImageVariant', () => {
  it('creates normal variant by default', () => {
    const variant = CardImageVariant.create();
    expect(variant.toPrimitives()).toBe('normal');
  });

  it('creates normal variant explicitly', () => {
    const variant = CardImageVariant.create('normal');
    expect(variant.toPrimitives()).toBe('normal');
    expect(variant.toUrlSegment()).toBe('cards');
  });

  it('creates small variant', () => {
    const variant = CardImageVariant.create('small');
    expect(variant.toPrimitives()).toBe('small');
    expect(variant.toUrlSegment()).toBe('cards_small');
  });

  it('creates cropped variant', () => {
    const variant = CardImageVariant.create('cropped');
    expect(variant.toPrimitives()).toBe('cropped');
    expect(variant.toUrlSegment()).toBe('cards_cropped');
  });

  it('trims whitespace and lowercases', () => {
    const variant = CardImageVariant.create('  SMALL  ');
    expect(variant.toPrimitives()).toBe('small');
  });

  it('throws for unsupported variant', () => {
    expect(() => CardImageVariant.create('huge')).toThrow(
      new Error(
        'Unsupported image variant: huge. Supported: normal, small, cropped',
      ),
    );
  });
});
