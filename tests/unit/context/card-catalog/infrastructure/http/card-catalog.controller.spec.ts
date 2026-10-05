import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CardCatalogNotFoundError,
  InvalidCardCatalogIdError,
} from '../../../../../../src/context/card-catalog/application/errors/card-catalog.errors';
import { GetCardByIdUseCase } from '../../../../../../src/context/card-catalog/application/use-cases/get-card-by-id.use-case';
import { CardCatalogController } from '../../../../../../src/context/card-catalog/infrastructure/http/card-catalog.controller';

describe('CardCatalogController', () => {
  it('returns the use case result', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ _id: 42 }),
    } as unknown as GetCardByIdUseCase;
    const controller = new CardCatalogController(useCase);

    await expect(controller.get('42')).resolves.toEqual({ _id: 42 });
  });

  it('maps invalid ids to bad request', async () => {
    const useCase = {
      execute: jest.fn().mockRejectedValue(new InvalidCardCatalogIdError()),
    } as unknown as GetCardByIdUseCase;
    const controller = new CardCatalogController(useCase);

    await expect(controller.get('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps missing cards to not found', async () => {
    const useCase = {
      execute: jest.fn().mockRejectedValue(new CardCatalogNotFoundError(42)),
    } as unknown as GetCardByIdUseCase;
    const controller = new CardCatalogController(useCase);

    await expect(controller.get('42')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
