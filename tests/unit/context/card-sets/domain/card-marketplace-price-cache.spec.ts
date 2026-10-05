import { CardMarketplacePriceCache } from '../../../../../src/context/card-sets/domain/card-marketplace-price-cache';

describe('CardMarketplacePriceCache', () => {
  const cachedAt = new Date('2026-10-04T00:00:00.000Z');

  it('is fresh while it is younger than the TTL', () => {
    const cache = CardMarketplacePriceCache.create({
      blueprintId: 380475,
      response: [{ price: 1 }],
      cachedAt,
    });

    expect(
      cache.isFresh(new Date('2026-10-04T23:59:59.999Z'), 24 * 60 * 60 * 1000),
    ).toBe(true);
  });

  it('is expired at the TTL boundary', () => {
    const cache = CardMarketplacePriceCache.create({
      blueprintId: 380475,
      response: [],
      cachedAt,
    });

    expect(
      cache.isFresh(new Date('2026-10-05T00:00:00.000Z'), 24 * 60 * 60 * 1000),
    ).toBe(false);
  });
});
