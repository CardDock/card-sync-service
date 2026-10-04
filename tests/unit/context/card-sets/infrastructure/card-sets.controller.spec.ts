import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  InvalidCardIdError,
} from '../../../../../src/context/card-sets/application/errors/card-sets.errors';
import { GetCardSetsUseCase } from '../../../../../src/context/card-sets/application/use-cases/get-card-sets.use-case';
import { CardSetsController } from '../../../../../src/context/card-sets/infrastructure/card-sets.controller';

describe('CardSetsController', () => {
  it('returns the use case result', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ cardId: 1, data: [] }),
    } as unknown as GetCardSetsUseCase;

    await expect(new CardSetsController(useCase).get('1')).resolves.toEqual({
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
      new CardSetsController(useCase).get('1'),
    ).rejects.toBeInstanceOf(exception);
  });

  it('does not hide unexpected application errors', async () => {
    const error = new Error('database unavailable');
    const useCase = {
      execute: jest.fn().mockRejectedValue(error),
    } as unknown as GetCardSetsUseCase;

    await expect(new CardSetsController(useCase).get('1')).rejects.toBe(error);
  });
});
