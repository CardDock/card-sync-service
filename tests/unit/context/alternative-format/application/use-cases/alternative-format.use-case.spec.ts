import { EdisonCardsRepositoryPort } from '../../../../../../src/context/alternative-format/application/ports/edison-cards-repository.port';
import { GetEdisonCardFormatUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/get-edison-card-format.use-case';
import { SyncEdisonCardsUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/sync-edison-cards.use-case';

describe('GetEdisonCardFormatUseCase', () => {
  it('returns true when the card is in the synchronized Edison list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(true),
    } as unknown as EdisonCardsRepositoryPort;

    await expect(
      new GetEdisonCardFormatUseCase(repository).execute(' 235235 '),
    ).resolves.toEqual({
      card_id: '235235',
      format: { edison: true },
    });
    expect(repository.exists).toHaveBeenCalledWith('235235');
  });

  it('returns false when the card is not in the synchronized list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as EdisonCardsRepositoryPort;

    await expect(
      new GetEdisonCardFormatUseCase(repository).execute('235235'),
    ).resolves.toEqual({
      card_id: '235235',
      format: { edison: false },
    });
  });
});

describe('SyncEdisonCardsUseCase', () => {
  const sourceUrl =
    'https://db.ygoprodeck.com/api/v7/cardinfo.php?format=Edison';

  it('extracts only unique IDs from the card objects', async () => {
    const replaceAll = jest.fn().mockResolvedValue(undefined);
    const repository = {
      replaceAll,
    } as unknown as EdisonCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          { id: '235235', name: 'Ignored' },
          { id: 123123, description: 'Ignored' },
          { id: ' 235235 ', type: 'Ignored' },
        ],
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncEdisonCardsUseCase(repository).execute(),
      ).resolves.toEqual({
        total: 2,
        source: sourceUrl,
        syncedAt: expect.any(Date),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).toHaveBeenCalledWith(['235235', '123123']);
  });

  it('rejects an invalid payload before replacing the stored list', async () => {
    const replaceAll = jest.fn();
    const repository = {
      replaceAll,
    } as unknown as EdisonCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ name: 'Missing ID' }] }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncEdisonCardsUseCase(repository).execute(),
      ).rejects.toThrow('missing a valid id');
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).not.toHaveBeenCalled();
  });
});
