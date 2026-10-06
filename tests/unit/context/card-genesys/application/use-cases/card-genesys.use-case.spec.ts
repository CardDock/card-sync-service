import { GetCardGenesysPointsUseCase } from '../../../../../../src/context/card-genesys/application/use-cases/get-card-genesys-points.use-case';
import { SyncGenesysPointsUseCase } from '../../../../../../src/context/card-genesys/application/use-cases/sync-genesys-points.use-case';
import { CardLookupPort } from '../../../../../../src/context/card-genesys/application/ports/card-lookup.port';
import { GenesysPointsRepositoryPort } from '../../../../../../src/context/card-genesys/application/ports/genesys-points-repository.port';

describe('GetCardGenesysPointsUseCase', () => {
  it('returns the Genesys points for the mapped Konami card id', async () => {
    const cardLookupPort = {
      findById: jest.fn().mockResolvedValue({
        _id: 46986414,
        misc_info: [{ konami_id: 4095 }],
      }),
    } as unknown as CardLookupPort;

    const genesysPointsRepository = {
      findCurrent: jest.fn().mockResolvedValue({
        _id: 'current',
        date: '2026-10-06',
        regulation: { '4095': 100, '4342': 1 },
        syncedAt: new Date('2026-10-06T00:00:00.000Z'),
      }),
    } as unknown as GenesysPointsRepositoryPort;

    await expect(
      new GetCardGenesysPointsUseCase(cardLookupPort, genesysPointsRepository).execute(
        '46986414',
      ),
    ).resolves.toEqual({ cardId: '46986414', points: 100 });
    expect(cardLookupPort.findById).toHaveBeenCalledWith(46986414);
  });

  it('returns 0 when the card or Konami id is missing', async () => {
    const cardLookupPort = {
      findById: jest.fn().mockResolvedValue({ _id: 42, misc_info: [] }),
    } as unknown as CardLookupPort;

    const genesysPointsRepository = {
      findCurrent: jest.fn(),
    } as unknown as GenesysPointsRepositoryPort;

    await expect(
      new GetCardGenesysPointsUseCase(cardLookupPort, genesysPointsRepository).execute(
        '42',
      ),
    ).resolves.toEqual({ cardId: '42', points: 0 });
    expect(genesysPointsRepository.findCurrent).not.toHaveBeenCalled();
  });
});

describe('SyncGenesysPointsUseCase', () => {
  it('fetches and stores the current Genesys regulation', async () => {
    const upsertCurrent = jest.fn().mockResolvedValue({
      _id: 'current',
      date: '2026-10-06',
      regulation: { '4095': 100, '4342': 1 },
      syncedAt: new Date('2026-10-06T00:00:00.000Z'),
    });

    const genesysPointsRepository = {
      upsertCurrent,
      findCurrent: jest.fn(),
    } as unknown as GenesysPointsRepositoryPort;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        date: '2026-10-06',
        regulation: { '4095': 100, '4342': 1 },
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncGenesysPointsUseCase(genesysPointsRepository).execute(),
      ).resolves.toEqual({
        date: '2026-10-06',
        total: 2,
        source:
          'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/genesys/current.vector.json',
        syncedAt: new Date('2026-10-06T00:00:00.000Z'),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(upsertCurrent).toHaveBeenCalledWith('2026-10-06', {
      '4095': 100,
      '4342': 1,
    });
  });
});
