import { EdisonCardsRepositoryPort } from '../../../../../../src/context/alternative-format/application/ports/edison-cards-repository.port';
import { GetHatCardFormatUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/get-hat-card-format.use-case';
import { GoatCardsRepositoryPort } from '../../../../../../src/context/alternative-format/application/ports/goat-cards-repository.port';
import { HatCardsRepositoryPort } from '../../../../../../src/context/alternative-format/application/ports/hat-cards-repository.port';
import { SyncHatCardsUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/sync-hat-cards.use-case';
import { GetEdisonCardFormatUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/get-edison-card-format.use-case';
import { GetGoatCardFormatUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/get-goat-card-format.use-case';
import { SyncEdisonCardsUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/sync-edison-cards.use-case';
import { SyncGoatCardsUseCase } from '../../../../../../src/context/alternative-format/application/use-cases/sync-goat-cards.use-case';

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

describe('GetGoatCardFormatUseCase', () => {
  it('returns true when the card is in the synchronized GOAT list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(true),
    } as unknown as GoatCardsRepositoryPort;

    await expect(
      new GetGoatCardFormatUseCase(repository).execute(' 86988864 '),
    ).resolves.toEqual({
      card_id: '86988864',
      format: { goat: true },
    });
    expect(repository.exists).toHaveBeenCalledWith('86988864');
  });

  it('returns false when the card is not in the synchronized list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as GoatCardsRepositoryPort;

    await expect(
      new GetGoatCardFormatUseCase(repository).execute('86988864'),
    ).resolves.toEqual({
      card_id: '86988864',
      format: { goat: false },
    });
  });

  it('returns false without querying the repository for a blank ID', async () => {
    const repository = {
      exists: jest.fn(),
    } as unknown as GoatCardsRepositoryPort;

    await expect(
      new GetGoatCardFormatUseCase(repository).execute('   '),
    ).resolves.toEqual({
      card_id: '',
      format: { goat: false },
    });
    expect(repository.exists).not.toHaveBeenCalled();
  });
});

describe('SyncGoatCardsUseCase', () => {
  const sourceUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?format=goat';

  it('extracts only unique IDs from the card objects', async () => {
    const replaceAll = jest.fn().mockResolvedValue(undefined);
    const repository = {
      replaceAll,
    } as unknown as GoatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          { id: 86988864, name: 'Ignored' },
          { id: '46986414', description: 'Ignored' },
          { id: ' 86988864 ', type: 'Ignored' },
        ],
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncGoatCardsUseCase(repository).execute(),
      ).resolves.toEqual({
        total: 2,
        source: sourceUrl,
        syncedAt: expect.any(Date),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).toHaveBeenCalledWith(['86988864', '46986414']);
  });

  it('uses the GOAT_CARDS_URL override when provided', async () => {
    const replaceAll = jest.fn().mockResolvedValue(undefined);
    const repository = {
      replaceAll,
    } as unknown as GoatCardsRepositoryPort;
    const overrideUrl = 'https://example.test/goat-cards';
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ id: 1 }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      await expect(
        new SyncGoatCardsUseCase(repository, overrideUrl).execute(),
      ).resolves.toEqual({
        total: 1,
        source: overrideUrl,
        syncedAt: expect.any(Date),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(fetchMock).toHaveBeenCalledWith(overrideUrl, expect.anything());
  });

  it('rejects an invalid payload before replacing the stored list', async () => {
    const replaceAll = jest.fn();
    const repository = {
      replaceAll,
    } as unknown as GoatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ name: 'Missing ID' }] }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncGoatCardsUseCase(repository).execute(),
      ).rejects.toThrow('missing a valid id');
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).not.toHaveBeenCalled();
  });

  it('throws when the source responds with an error status', async () => {
    const replaceAll = jest.fn();
    const repository = {
      replaceAll,
    } as unknown as GoatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncGoatCardsUseCase(repository).execute(),
      ).rejects.toThrow('GOAT cards from');
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).not.toHaveBeenCalled();
  });
});

describe('GetHatCardFormatUseCase', () => {
  it('returns true when the card is in the synchronized HAT list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(true),
    } as unknown as HatCardsRepositoryPort;

    await expect(
      new GetHatCardFormatUseCase(repository).execute(' 34541863 '),
    ).resolves.toEqual({
      card_id: '34541863',
      format: { hat: true },
    });
    expect(repository.exists).toHaveBeenCalledWith('34541863');
  });

  it('returns false when the card is not in the synchronized list', async () => {
    const repository = {
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as HatCardsRepositoryPort;

    await expect(
      new GetHatCardFormatUseCase(repository).execute('34541863'),
    ).resolves.toEqual({
      card_id: '34541863',
      format: { hat: false },
    });
  });

  it('returns false without querying the repository for a blank ID', async () => {
    const repository = {
      exists: jest.fn(),
    } as unknown as HatCardsRepositoryPort;

    await expect(
      new GetHatCardFormatUseCase(repository).execute('   '),
    ).resolves.toEqual({
      card_id: '',
      format: { hat: false },
    });
    expect(repository.exists).not.toHaveBeenCalled();
  });
});

describe('SyncHatCardsUseCase', () => {
  const sourceUrl =
    'https://db.ygoprodeck.com/api/v7/cardinfo.php?startdate=2002-02-28&enddate=2014-07-08&dateregion=tcg';

  it('extracts only unique IDs from the card objects', async () => {
    const replaceAll = jest.fn().mockResolvedValue(undefined);
    const repository = {
      replaceAll,
    } as unknown as HatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          { id: 34541863, name: 'Ignored' },
          { id: '46986414', description: 'Ignored' },
          { id: ' 34541863 ', type: 'Ignored' },
        ],
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncHatCardsUseCase(repository).execute(),
      ).resolves.toEqual({
        total: 2,
        source: sourceUrl,
        syncedAt: expect.any(Date),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).toHaveBeenCalledWith(['34541863', '46986414']);
  });

  it('uses the HAT_CARDS_URL override when provided', async () => {
    const replaceAll = jest.fn().mockResolvedValue(undefined);
    const repository = {
      replaceAll,
    } as unknown as HatCardsRepositoryPort;
    const overrideUrl = 'https://example.test/hat-cards';
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ id: 1 }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      await expect(
        new SyncHatCardsUseCase(repository, overrideUrl).execute(),
      ).resolves.toEqual({
        total: 1,
        source: overrideUrl,
        syncedAt: expect.any(Date),
      });
    } finally {
      global.fetch = originalFetch;
    }

    expect(fetchMock).toHaveBeenCalledWith(overrideUrl, expect.anything());
  });

  it('rejects an invalid payload before replacing the stored list', async () => {
    const replaceAll = jest.fn();
    const repository = {
      replaceAll,
    } as unknown as HatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ name: 'Missing ID' }] }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncHatCardsUseCase(repository).execute(),
      ).rejects.toThrow('missing a valid id');
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).not.toHaveBeenCalled();
  });

  it('throws when the source responds with an error status', async () => {
    const replaceAll = jest.fn();
    const repository = {
      replaceAll,
    } as unknown as HatCardsRepositoryPort;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SyncHatCardsUseCase(repository).execute(),
      ).rejects.toThrow('HAT cards from');
    } finally {
      global.fetch = originalFetch;
    }

    expect(replaceAll).not.toHaveBeenCalled();
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
