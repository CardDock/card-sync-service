import { CardSetCache } from '../../../../../src/context/card-sets/domain/card-set-cache';

describe('CardSetCache', () => {
  const cachedAt = new Date('2026-10-04T00:00:00.000Z');

  it('is fresh while it is younger than the TTL', () => {
    const cache = CardSetCache.create({
      cardId: 80181649,
      cardName: 'A Case for K9',
      response: [{ id: 1 }],
      cachedAt,
    });

    expect(
      cache.isFresh(new Date('2026-10-04T23:59:59.999Z'), 24 * 60 * 60 * 1000),
    ).toBe(true);
  });

  it('is expired at the TTL boundary', () => {
    const cache = CardSetCache.create({
      cardId: 80181649,
      cardName: 'A Case for K9',
      response: [],
      cachedAt,
    });

    expect(
      cache.isFresh(new Date('2026-10-05T00:00:00.000Z'), 24 * 60 * 60 * 1000),
    ).toBe(false);
  });
});
