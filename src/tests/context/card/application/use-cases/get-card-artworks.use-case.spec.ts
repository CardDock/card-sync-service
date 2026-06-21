import { CardRelatedDataRepositoryPort, ArtworkResult } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import { GetCardArtworksUseCase } from '../../../../../context/card/application/use-cases/get-card-artworks.use-case';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

describe('GetCardArtworksUseCase', () => {
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;

  beforeEach(() => {
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findFirstArtworkIdByCardExternalId: jest.fn(),
      findArtworksByCardExternalId: jest.fn(),
      findPrintsByCardExternalId: jest.fn(),
      findAllCardSets: jest.fn(),
    };
  });

  it('returns artworks from the repository', async () => {
    const artworks: ArtworkResult[] = [
      { id: 'art-1', imageUrl: 'https://example.com/card.jpg' },
    ];
    cardRelatedDataRepository.findArtworksByCardExternalId.mockResolvedValue(artworks);

    const useCase = new GetCardArtworksUseCase(cardRelatedDataRepository, buildLoggerMock());

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toEqual(artworks);
    expect(cardRelatedDataRepository.findArtworksByCardExternalId).toHaveBeenCalledWith('46986414');
  });

  it('returns empty array when no artworks exist', async () => {
    cardRelatedDataRepository.findArtworksByCardExternalId.mockResolvedValue([]);

    const useCase = new GetCardArtworksUseCase(cardRelatedDataRepository, buildLoggerMock());

    const result = await useCase.execute({ externalId: '99999999' });

    expect(result).toEqual([]);
  });

  it('returns multiple artworks', async () => {
    const artworks: ArtworkResult[] = [
      { id: 'art-1', imageUrl: 'https://example.com/1.jpg' },
      { id: 'art-2', imageUrl: 'https://example.com/2.jpg' },
    ];
    cardRelatedDataRepository.findArtworksByCardExternalId.mockResolvedValue(artworks);

    const useCase = new GetCardArtworksUseCase(cardRelatedDataRepository, buildLoggerMock());

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toHaveLength(2);
  });
});
