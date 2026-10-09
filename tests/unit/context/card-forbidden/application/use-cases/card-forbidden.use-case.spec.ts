import { CardLookupPort } from '../../../../../../src/context/card-forbidden/application/ports/card-lookup.port';
import { ForbiddenCardsRepositoryPort } from '../../../../../../src/context/card-forbidden/application/ports/forbidden-cards-repository.port';
import { GetCardForbiddenPointsUseCase } from '../../../../../../src/context/card-forbidden/application/use-cases/get-card-forbidden-points.use-case';
import { SyncForbiddenCardsUseCase } from '../../../../../../src/context/card-forbidden/application/use-cases/sync-forbidden-cards.use-case';

describe('GetCardForbiddenPointsUseCase', () => {
  it('returns the limit value for a mapped Konami card id', async () => {
    const cardLookupPort = {
      findById: jest.fn().mockResolvedValue({
        _id: 46986414,
        misc_info: [{ konami_id: 4023 }],
      }),
    } as unknown as CardLookupPort;

    const forbiddenCardsRepository = {
      findCurrent: jest.fn().mockResolvedValue({
        _id: 'current',
        date: '2026-05-18',
        regulation: { '4023': 1, '4024': 1 },
        syncedAt: new Date('2026-05-18T00:00:00.000Z'),
      }),
    } as unknown as ForbiddenCardsRepositoryPort;

    await expect(
      new GetCardForbiddenPointsUseCase(
        cardLookupPort,
        forbiddenCardsRepository,
      ).execute('46986414'),
    ).resolves.toEqual({ cardId: '46986414', points: 1 });
    expect(cardLookupPort.findById).toHaveBeenCalledWith(46986414);
  });

  it('returns 3 when the card is missing from the regulation', async () => {
    const cardLookupPort = {
      findById: jest.fn().mockResolvedValue({
        _id: 42,
        misc_info: [{ konami_id: 9999 }],
      }),
    } as unknown as CardLookupPort;

    const forbiddenCardsRepository = {
      findCurrent: jest.fn().mockResolvedValue({
        _id: 'current',
        date: '2026-05-18',
        regulation: { '4023': 1 },
        syncedAt: new Date('2026-05-18T00:00:00.000Z'),
      }),
    } as unknown as ForbiddenCardsRepositoryPort;

    await expect(
      new GetCardForbiddenPointsUseCase(
        cardLookupPort,
        forbiddenCardsRepository,
      ).execute('42'),
    ).resolves.toEqual({ cardId: '42', points: 3 });
  });
});

describe('SyncForbiddenCardsUseCase', () => {
  it('fetches and normalizes the current TCG regulation', async () => {
    const upsertCurrent = jest.fn().mockResolvedValue({
      _id: 'current',
      date: '2026-05-18',
      regulation: { '4023': 1, '4024': 1 },
      syncedAt: new Date('2026-05-18T00:00:00.000Z'),
    });

    const forbiddenCardsRepository = {
      upsertCurrent,
      findCurrent: jest.fn(),
    } as unknown as ForbiddenCardsRepositoryPort;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        date: '2026-05-18',
        regulation: { '4023': 1, '4024': 1 },
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncForbiddenCardsUseCase(forbiddenCardsRepository).execute(),
      ).resolves.toEqual({
        date: '2026-05-18',
        total: 2,
        source:
          'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/tcg/current.vector.json',
        syncedAt: new Date('2026-05-18T00:00:00.000Z'),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(upsertCurrent).toHaveBeenCalledWith('2026-05-18', {
      '4023': 1,
      '4024': 1,
    });
  });
});
