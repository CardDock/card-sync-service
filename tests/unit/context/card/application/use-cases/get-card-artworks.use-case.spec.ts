import {
  CardRelatedDataRepositoryPort,
  ArtworkResult,
} from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import { GetCardArtworksUseCase } from '../../../../../../src/context/card/application/use-cases/get-card-artworks.use-case';
import { buildLoggerMock } from '../../../../../helpers';

describe('GetCardArtworksUseCase', () => {
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;

  beforeEach(() => {
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findArtworksByCardId: jest.fn(),
      findPrintsByCardId: jest.fn(),
      findPrintsWithArtworkByCardId: jest.fn(),
      findAllCardSets: jest.fn(),
      deleteByCardId: jest.fn(),
      findFirstArtworkIdByCardId: jest.fn(),
    };
  });

  it('returns artworks from the repository', async () => {
    const artworks: ArtworkResult[] = [
      {
        id: 'art-1',
        imageUrl: 'https://example.com/card.jpg',
        imageUrlSmall: 'https://example.com/card_small.jpg',
        imageUrlCropped: 'https://example.com/card_cropped.jpg',
      },
    ];
    cardRelatedDataRepository.findArtworksByCardId.mockResolvedValue(artworks);

    const useCase = new GetCardArtworksUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result).toEqual(artworks);
    expect(cardRelatedDataRepository.findArtworksByCardId).toHaveBeenCalledWith(
      '46986414',
    );
  });

  it('returns empty array when no artworks exist', async () => {
    cardRelatedDataRepository.findArtworksByCardId.mockResolvedValue([]);

    const useCase = new GetCardArtworksUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '99999999' });

    expect(result).toEqual([]);
  });

  it('returns multiple artworks', async () => {
    const artworks: ArtworkResult[] = [
      {
        id: 'art-1',
        imageUrl: 'https://example.com/1.jpg',
        imageUrlSmall: 'https://example.com/1_small.jpg',
        imageUrlCropped: 'https://example.com/1_cropped.jpg',
      },
      {
        id: 'art-2',
        imageUrl: 'https://example.com/2.jpg',
        imageUrlSmall: 'https://example.com/2_small.jpg',
        imageUrlCropped: 'https://example.com/2_cropped.jpg',
      },
    ];
    cardRelatedDataRepository.findArtworksByCardId.mockResolvedValue(artworks);

    const useCase = new GetCardArtworksUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result).toHaveLength(2);
  });
});
