import { CardSetCache } from '../../../../../../src/context/card-sets/domain/card-set-cache';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  InvalidCardIdError,
} from '../../../../../../src/context/card-sets/application/errors/card-sets.errors';
import { CardReaderPort } from '../../../../../../src/context/card-sets/application/ports/card-reader.port';
import { CardSetCacheRepositoryPort } from '../../../../../../src/context/card-sets/application/ports/card-set-cache-repository.port';
import { CardTraderSourcePort } from '../../../../../../src/context/card-sets/application/ports/card-trader-source.port';
import { GetCardSetsUseCase } from '../../../../../../src/context/card-sets/application/use-cases/get-card-sets.use-case';

describe('GetCardSetsUseCase', () => {
  let reader: jest.Mocked<CardReaderPort>;
  let cacheRepository: jest.Mocked<CardSetCacheRepositoryPort>;
  let trader: jest.Mocked<CardTraderSourcePort>;
  const now = new Date('2026-10-04T12:00:00.000Z');

  beforeEach(() => {
    reader = { findById: jest.fn() };
    cacheRepository = { findByCardId: jest.fn(), save: jest.fn() };
    trader = {
      findBlueprints: jest.fn(),
      findExpansions: jest.fn(),
    };
  });

  function createUseCase() {
    return new GetCardSetsUseCase(
      reader,
      cacheRepository,
      trader,
      24 * 60 * 60 * 1000,
      () => now,
    );
  }

  it('rejects an invalid card id', async () => {
    await expect(createUseCase().execute('abc')).rejects.toBeInstanceOf(
      InvalidCardIdError,
    );
    expect(reader.findById).not.toHaveBeenCalled();
  });

  it('throws when the card does not exist', async () => {
    reader.findById.mockResolvedValue(null);

    await expect(createUseCase().execute('80181649')).rejects.toBeInstanceOf(
      CardNotFoundError,
    );
  });

  it('returns a fresh cache without calling CardTrader', async () => {
    reader.findById.mockResolvedValue({ id: 80181649, name: 'A Case for K9' });
    const cached = CardSetCache.create({
      cardId: 80181649,
      cardName: 'A Case for K9',
      response: [{ blueprint_id: 10 }],
      cachedAt: new Date('2026-10-04T00:00:00.000Z'),
    });
    cacheRepository.findByCardId.mockResolvedValue(cached);

    await expect(createUseCase().execute(80181649)).resolves.toEqual({
      cardId: 80181649,
      cardName: 'A Case for K9',
      cachedAt: cached.snapshot().cachedAt,
      data: [{ blueprint_id: 10 }],
    });
    expect(trader.findBlueprints).not.toHaveBeenCalled();
  });

  it('fetches and stores data when no cache exists', async () => {
    reader.findById.mockResolvedValue({ id: 80181649, name: 'A Case for K9' });
    cacheRepository.findByCardId.mockResolvedValue(null);
    trader.findBlueprints.mockResolvedValue([{ blueprint_id: 10 }]);

    await expect(createUseCase().execute(80181649)).resolves.toMatchObject({
      cardId: 80181649,
      data: [{ blueprint_id: 10 }],
      cachedAt: now,
    });
    expect(trader.findBlueprints).toHaveBeenCalledWith('A Case for K9');
    expect(cacheRepository.save).toHaveBeenCalledTimes(1);
  });

  it('refreshes an expired cache', async () => {
    reader.findById.mockResolvedValue({ id: 80181649, name: 'A Case for K9' });
    cacheRepository.findByCardId.mockResolvedValue(
      CardSetCache.create({
        cardId: 80181649,
        cardName: 'A Case for K9',
        response: [{ blueprint_id: 1 }],
        cachedAt: new Date('2026-10-03T00:00:00.000Z'),
      }),
    );
    trader.findBlueprints.mockResolvedValue([{ blueprint_id: 2 }]);

    await expect(createUseCase().execute(80181649)).resolves.toMatchObject({
      data: [{ blueprint_id: 2 }],
      cachedAt: now,
    });
    expect(cacheRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns the old cache when CardTrader is unavailable', async () => {
    reader.findById.mockResolvedValue({ id: 80181649, name: 'A Case for K9' });
    const cached = CardSetCache.create({
      cardId: 80181649,
      cardName: 'A Case for K9',
      response: [{ blueprint_id: 1 }],
      cachedAt: new Date('2026-10-03T00:00:00.000Z'),
    });
    cacheRepository.findByCardId.mockResolvedValue(cached);
    trader.findBlueprints.mockRejectedValue(
      new CardTraderUnavailableError('timeout'),
    );

    await expect(createUseCase().execute(80181649)).resolves.toMatchObject({
      data: [{ blueprint_id: 1 }],
      cachedAt: cached.snapshot().cachedAt,
    });
    expect(cacheRepository.save).not.toHaveBeenCalled();
  });

  it('propagates CardTrader errors when no old cache exists', async () => {
    reader.findById.mockResolvedValue({ id: 80181649, name: 'A Case for K9' });
    cacheRepository.findByCardId.mockResolvedValue(null);
    const error = new CardTraderUnavailableError('timeout');
    trader.findBlueprints.mockRejectedValue(error);

    await expect(createUseCase().execute(80181649)).rejects.toBe(error);
  });
});
