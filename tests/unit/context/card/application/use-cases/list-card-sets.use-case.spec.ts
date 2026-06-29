import {
  CardRelatedDataRepositoryPort,
  CardSetResult,
} from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import { ListCardSetsUseCase } from '../../../../../../src/context/card/application/use-cases/list-card-sets.use-case';
import { buildLoggerMock } from '../../../../../helpers';

describe('ListCardSetsUseCase', () => {
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;

  beforeEach(() => {
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findArtworksByCardId: jest.fn(),
      findPrintsByCardId: jest.fn(),
      findAllCardSets: jest.fn(),
      deleteByCardId: jest.fn(),
      findFirstArtworkIdByCardId: jest.fn(),
    };
  });

  it('returns all card sets from the repository', async () => {
    const sets: CardSetResult[] = [
      { id: 'set-1', name: 'Legend of Blue Eyes White Dragon', code: 'LOB' },
      { id: 'set-2', name: 'Metal Raiders', code: 'MRD' },
    ];
    cardRelatedDataRepository.findAllCardSets.mockResolvedValue(sets);

    const useCase = new ListCardSetsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute();

    expect(result).toEqual(sets);
    expect(cardRelatedDataRepository.findAllCardSets).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no card sets exist', async () => {
    cardRelatedDataRepository.findAllCardSets.mockResolvedValue([]);

    const useCase = new ListCardSetsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('returns sets with null code when applicable', async () => {
    const sets: CardSetResult[] = [
      { id: 'set-1', name: 'Legend of Blue Eyes White Dragon', code: null },
    ];
    cardRelatedDataRepository.findAllCardSets.mockResolvedValue(sets);

    const useCase = new ListCardSetsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute();

    expect(result[0].code).toBeNull();
  });
});
