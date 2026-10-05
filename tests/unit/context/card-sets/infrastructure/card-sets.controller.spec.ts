import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  InvalidBlueprintIdError,
  InvalidCardIdError,
} from '../../../../../src/context/card-sets/application/errors/card-sets.errors';
import { GetCardMarketplacePricesUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-marketplace-prices.use-case';
import { GetCardSetsUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-sets.use-case';
import { CardSetsController } from '../../../../../src/context/card-sets/infrastructure/card-sets.controller';

describe('CardSetsController', () => {
  const marketplaceUseCase = {
    execute: jest.fn(),
  } as unknown as GetCardMarketplacePricesUseCase;

  it('returns the use case result', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ cardId: 1, data: [] }),
    } as unknown as GetCardSetsUseCase;

    await expect(
      new CardSetsController(useCase, marketplaceUseCase).get('1'),
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
      new CardSetsController(useCase, marketplaceUseCase).get('1'),
    ).rejects.toBeInstanceOf(exception);
  });

  it('does not hide unexpected application errors', async () => {
    const error = new Error('database unavailable');
    const useCase = {
      execute: jest.fn().mockRejectedValue(error),
    } as unknown as GetCardSetsUseCase;

    await expect(
      new CardSetsController(useCase, marketplaceUseCase).get('1'),
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
      ).getPrices('380475'),
    ).rejects.toBeInstanceOf(exception);
  });
});
