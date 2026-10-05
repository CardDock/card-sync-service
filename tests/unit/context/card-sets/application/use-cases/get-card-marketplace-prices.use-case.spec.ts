import { CardMarketplacePriceCache } from '../../../../../../src/context/card-sets/domain/card-marketplace-price-cache';
import {
  CardTraderUnavailableError,
  InvalidBlueprintIdError,
} from '../../../../../../src/context/card-sets/application/errors/card-sets.errors';
import { CardMarketplacePriceCacheRepositoryPort } from '../../../../../../src/context/card-sets/application/ports/card-marketplace-price-cache-repository.port';
import { CardTraderMarketplaceSourcePort } from '../../../../../../src/context/card-sets/application/ports/card-trader-marketplace-source.port';
import { GetCardMarketplacePricesUseCase } from '../../../../../../src/context/card-sets/application/use-cases/get-card-marketplace-prices.use-case';

describe('GetCardMarketplacePricesUseCase', () => {
  let cacheRepository: jest.Mocked<CardMarketplacePriceCacheRepositoryPort>;
  let trader: jest.Mocked<CardTraderMarketplaceSourcePort>;
  const now = new Date('2026-10-04T12:00:00.000Z');

  beforeEach(() => {
    cacheRepository = {
      findByBlueprintId: jest.fn(),
      save: jest.fn(),
    };
    trader = { findMarketplaceProducts: jest.fn() };
  });

  function createUseCase() {
    return new GetCardMarketplacePricesUseCase(
      cacheRepository,
      trader,
      24 * 60 * 60 * 1000,
      () => now,
    );
  }

  it('rejects an invalid blueprint id', async () => {
    await expect(createUseCase().execute('abc')).rejects.toBeInstanceOf(
      InvalidBlueprintIdError,
    );
    expect(cacheRepository.findByBlueprintId).not.toHaveBeenCalled();
  });

  it('returns a fresh cache without calling CardTrader', async () => {
    const cached = CardMarketplacePriceCache.create({
      blueprintId: 380475,
      response: [{ price: 1 }],
      cachedAt: new Date('2026-10-04T00:00:00.000Z'),
    });
    cacheRepository.findByBlueprintId.mockResolvedValue(cached);

    await expect(createUseCase().execute(380475)).resolves.toEqual({
      blueprintId: 380475,
      cachedAt: cached.snapshot().cachedAt,
      data: [{ price: 1 }],
    });
    expect(trader.findMarketplaceProducts).not.toHaveBeenCalled();
  });

  it('fetches and stores data when no cache exists', async () => {
    cacheRepository.findByBlueprintId.mockResolvedValue(null);
    trader.findMarketplaceProducts.mockResolvedValue([{ price: 1 }]);

    await expect(createUseCase().execute('380475')).resolves.toEqual({
      blueprintId: 380475,
      cachedAt: now,
      data: [{ price: 1 }],
    });
    expect(trader.findMarketplaceProducts).toHaveBeenCalledWith(380475);
    expect(cacheRepository.save).toHaveBeenCalledTimes(1);
  });

  it('refreshes an expired cache', async () => {
    cacheRepository.findByBlueprintId.mockResolvedValue(
      CardMarketplacePriceCache.create({
        blueprintId: 380475,
        response: [{ price: 1 }],
        cachedAt: new Date('2026-10-03T00:00:00.000Z'),
      }),
    );
    trader.findMarketplaceProducts.mockResolvedValue([{ price: 2 }]);

    await expect(createUseCase().execute(380475)).resolves.toMatchObject({
      data: [{ price: 2 }],
      cachedAt: now,
    });
    expect(cacheRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns the old cache when CardTrader is unavailable', async () => {
    const cached = CardMarketplacePriceCache.create({
      blueprintId: 380475,
      response: [{ price: 1 }],
      cachedAt: new Date('2026-10-03T00:00:00.000Z'),
    });
    cacheRepository.findByBlueprintId.mockResolvedValue(cached);
    trader.findMarketplaceProducts.mockRejectedValue(
      new CardTraderUnavailableError('timeout'),
    );

    await expect(createUseCase().execute(380475)).resolves.toMatchObject({
      data: [{ price: 1 }],
      cachedAt: cached.snapshot().cachedAt,
    });
    expect(cacheRepository.save).not.toHaveBeenCalled();
  });

  it('propagates CardTrader errors when no old cache exists', async () => {
    cacheRepository.findByBlueprintId.mockResolvedValue(null);
    const error = new CardTraderUnavailableError('timeout');
    trader.findMarketplaceProducts.mockRejectedValue(error);

    await expect(createUseCase().execute(380475)).rejects.toBe(error);
  });
});
