import { ImageStoragePort } from '../../../../../context/card/domain/ports/image-storage.port';
import { ExternalImageSourcePort } from '../../../../../context/card/domain/ports/external-image-source.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import { GetCardImageUseCase } from '../../../../../context/card/application/use-cases/get-card-image.use-case';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

describe('GetCardImageUseCase', () => {
  let imageStorage: jest.Mocked<ImageStoragePort>;
  let externalImageSource: jest.Mocked<ExternalImageSourcePort>;

  beforeEach(() => {
    imageStorage = {
      getImagePath: jest.fn(),
      saveImage: jest.fn(),
    };
    externalImageSource = {
      fetchImage: jest.fn(),
    };
  });

  it('returns file path when image exists locally', async () => {
    imageStorage.getImagePath.mockResolvedValue('/uploads/cards/cards/46986414.jpg');

    const useCase = new GetCardImageUseCase(imageStorage, externalImageSource, buildLoggerMock());
    const result = await useCase.execute({ cardId: '46986414' });

    expect(result).toEqual({ filePath: '/uploads/cards/cards/46986414.jpg' });
    expect(imageStorage.getImagePath).toHaveBeenCalled();
    expect(externalImageSource.fetchImage).not.toHaveBeenCalled();
  });

  it('downloads and saves when image is not local', async () => {
    imageStorage.getImagePath.mockResolvedValue(null);
    externalImageSource.fetchImage.mockResolvedValue(Buffer.from('image-data'));
    imageStorage.saveImage.mockResolvedValue('/uploads/cards/cards/46986414.jpg');

    const useCase = new GetCardImageUseCase(imageStorage, externalImageSource, buildLoggerMock());
    const result = await useCase.execute({ cardId: '46986414' });

    expect(result).toEqual({ filePath: '/uploads/cards/cards/46986414.jpg' });
    expect(externalImageSource.fetchImage).toHaveBeenCalled();
    expect(imageStorage.saveImage).toHaveBeenCalledWith(
      '46986414',
      expect.anything(),
      Buffer.from('image-data'),
    );
  });

  it('returns null when image is not local and not found on YGOPRODeck', async () => {
    imageStorage.getImagePath.mockResolvedValue(null);
    externalImageSource.fetchImage.mockResolvedValue(null);

    const useCase = new GetCardImageUseCase(imageStorage, externalImageSource, buildLoggerMock());
    const result = await useCase.execute({ cardId: '99999999' });

    expect(result).toBeNull();
    expect(imageStorage.saveImage).not.toHaveBeenCalled();
  });

  it('passes variant to storage and source', async () => {
    imageStorage.getImagePath.mockResolvedValue(null);
    externalImageSource.fetchImage.mockResolvedValue(Buffer.from('data'));
    imageStorage.saveImage.mockResolvedValue('/uploads/cards/cards_small/46986414.jpg');

    const useCase = new GetCardImageUseCase(imageStorage, externalImageSource, buildLoggerMock());
    await useCase.execute({ cardId: '46986414', variant: 'small' });

    expect(imageStorage.getImagePath).toHaveBeenCalledWith(
      '46986414',
      expect.objectContaining({}),
    );
    expect(externalImageSource.fetchImage).toHaveBeenCalledWith(
      '46986414',
      expect.objectContaining({}),
    );
    expect(imageStorage.saveImage).toHaveBeenCalledWith(
      '46986414',
      expect.objectContaining({}),
      Buffer.from('data'),
    );
  });
});
