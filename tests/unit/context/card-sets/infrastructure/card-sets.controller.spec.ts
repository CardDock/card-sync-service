import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  ExpansionNotFoundError,
  InvalidBlueprintIdError,
  InvalidCardIdError,
  InvalidExpansionIdError,
} from '../../../../../src/context/card-sets/application/errors/card-sets.errors';
import { GetCardMarketplacePricesUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-marketplace-prices.use-case';
import { GetCardTraderExpansionUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-trader-expansion.use-case';
import { GetCardSetsUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-sets.use-case';
import { SyncCardTraderExpansionsUseCase } from '../../../../../src/context/card-sets/application/use-cases/sync-card-trader-expansions.use-case';
import { CardSetsController } from '../../../../../src/context/card-sets/infrastructure/card-sets.controller';

describe('CardSetsController', () => {
  const marketplaceUseCase = {
    execute: jest.fn(),
  } as unknown as GetCardMarketplacePricesUseCase;

  const syncUseCase = {
    execute: jest.fn(),
  } as unknown as SyncCardTraderExpansionsUseCase;

  const expansionUseCase = {
    execute: jest.fn(),
  } as unknown as GetCardTraderExpansionUseCase;

  it('returns the use case result', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ cardId: 1, data: [] }),
    } as unknown as GetCardSetsUseCase;

    await expect(
      new CardSetsController(
        useCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).get('1'),
    ).resolves.toEqual({
      cardId: 1,
      data: [],
    });
  });

  it.each([
    [new InvalidCardIdError(), BadRequestException],
    [new CardNotFoundError(1), NotFoundException],
    [new CardTraderUnavailableError('down'), BadGatewayException],
  ])('maps %p to %p', async (error, exception) => {
    const useCase = {
      execute: jest.fn().mockRejectedValue(error),
    } as unknown as GetCardSetsUseCase;

    await expect(
      new CardSetsController(
        useCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).get('1'),
    ).rejects.toBeInstanceOf(exception);
  });

  it('does not hide unexpected application errors', async () => {
    const error = new Error('database unavailable');
    const useCase = {
      execute: jest.fn().mockRejectedValue(error),
    } as unknown as GetCardSetsUseCase;

    await expect(
      new CardSetsController(
        useCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).get('1'),
    ).rejects.toBe(error);
  });

  it('returns marketplace prices', async () => {
    marketplaceUseCase.execute = jest.fn().mockResolvedValue({
      blueprintId: 380475,
      data: [],
    });

    await expect(
      new CardSetsController(
        {} as GetCardSetsUseCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).getPrices('380475'),
    ).resolves.toEqual({ blueprintId: 380475, data: [] });
  });

  it.each([
    [new InvalidBlueprintIdError(), BadRequestException],
    [new CardTraderUnavailableError('down'), BadGatewayException],
  ])('maps marketplace error %p to %p', async (error, exception) => {
    marketplaceUseCase.execute = jest.fn().mockRejectedValue(error);

    await expect(
      new CardSetsController(
        {} as GetCardSetsUseCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).getPrices('380475'),
    ).rejects.toBeInstanceOf(exception);
  });

  it('returns synced expansion data', async () => {
    syncUseCase.execute = jest.fn().mockResolvedValue({
      count: 2,
      syncedAt: new Date('2026-10-06T00:00:00Z'),
      data: [
        { id: 1, game_id: 1, code: 'gnt', name: 'Game Night' },
        { id: 2, game_id: 1, code: 'dane', name: 'Dark Neostorm' },
      ],
    });

    await expect(
      new CardSetsController(
        {} as GetCardSetsUseCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).syncExpansions(),
    ).resolves.toEqual({
      count: 2,
      syncedAt: new Date('2026-10-06T00:00:00Z'),
      data: [
        { id: 1, game_id: 1, code: 'gnt', name: 'Game Night' },
        { id: 2, game_id: 1, code: 'dane', name: 'Dark Neostorm' },
      ],
    });
  });

  it('returns expansion by id', async () => {
    expansionUseCase.execute = jest.fn().mockResolvedValue({
      id: 1,
      game_id: 1,
      code: 'gnt',
      name: 'Game Night',
    });

    await expect(
      new CardSetsController(
        {} as GetCardSetsUseCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).getExpansion('1'),
    ).resolves.toEqual({
      id: 1,
      game_id: 1,
      code: 'gnt',
      name: 'Game Night',
    });
  });

  it.each([
    [new InvalidExpansionIdError(), BadRequestException],
    [new ExpansionNotFoundError(1), NotFoundException],
    [new CardTraderUnavailableError('down'), BadGatewayException],
  ])('maps expansion error %p to %p', async (error, exception) => {
    expansionUseCase.execute = jest.fn().mockRejectedValue(error);

    await expect(
      new CardSetsController(
        {} as GetCardSetsUseCase,
        marketplaceUseCase,
        syncUseCase,
        expansionUseCase,
      ).getExpansion('1'),
    ).rejects.toBeInstanceOf(exception);
  });
});
