import { CardCatalogReaderPort } from '../../../../../../src/context/card-catalog/application/ports/card-catalog-reader.port';
import {
  CardCatalogNotFoundError,
  InvalidCardCatalogIdError,
} from '../../../../../../src/context/card-catalog/application/errors/card-catalog.errors';
import { GetCardByIdUseCase } from '../../../../../../src/context/card-catalog/application/use-cases/get-card-by-id.use-case';

describe('GetCardByIdUseCase', () => {
  it('returns the card found by id', async () => {
    const reader = {
      findById: jest.fn().mockResolvedValue({ _id: 42, name: 'Dark Magician' }),
    } as unknown as CardCatalogReaderPort;
    const useCase = new GetCardByIdUseCase(reader);

    await expect(useCase.execute('42')).resolves.toEqual({
      _id: 42,
      name: 'Dark Magician',
    });
    expect(reader.findById).toHaveBeenCalledWith(42);
  });

  it('rejects invalid ids without querying the repository', async () => {
    const reader = {
      findById: jest.fn(),
    } as unknown as CardCatalogReaderPort;
    const useCase = new GetCardByIdUseCase(reader);

    await expect(useCase.execute('abc')).rejects.toBeInstanceOf(
      InvalidCardCatalogIdError,
    );
    expect(reader.findById).not.toHaveBeenCalled();
  });

  it('rejects non-positive and unsafe ids', async () => {
    const reader = {
      findById: jest.fn(),
    } as unknown as CardCatalogReaderPort;
    const useCase = new GetCardByIdUseCase(reader);

    await expect(useCase.execute('0')).rejects.toBeInstanceOf(
      InvalidCardCatalogIdError,
    );
    await expect(useCase.execute('9007199254740992')).rejects.toBeInstanceOf(
      InvalidCardCatalogIdError,
    );
  });

  it('throws when the card does not exist', async () => {
    const reader = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as CardCatalogReaderPort;
    const useCase = new GetCardByIdUseCase(reader);

    await expect(useCase.execute('42')).rejects.toEqual(
      new CardCatalogNotFoundError(42),
    );
  });
});
