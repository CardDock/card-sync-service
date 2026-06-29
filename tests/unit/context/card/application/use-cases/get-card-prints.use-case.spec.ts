import {
  CardRelatedDataRepositoryPort,
  CardPrintResult,
} from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import { GetCardPrintsUseCase } from '../../../../../../src/context/card/application/use-cases/get-card-prints.use-case';
import { buildLoggerMock } from '../../../../../helpers';

describe('GetCardPrintsUseCase', () => {
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

  it('returns prints from the repository', async () => {
    const prints: CardPrintResult[] = [
      {
        id: 'print-1',
        cardSetId: 'set-1',
        cardSetName: 'Legend of Blue Eyes White Dragon',
        cardSetCode: 'LOB',
        setCode: 'LOB-000',
        rarity: 'Ultra Rare',
        rarityCode: 'ur',
        setPrice: 12.5,
      },
    ];
    cardRelatedDataRepository.findPrintsByCardId.mockResolvedValue(prints);

    const useCase = new GetCardPrintsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result).toEqual(prints);
    expect(cardRelatedDataRepository.findPrintsByCardId).toHaveBeenCalledWith(
      '46986414',
    );
  });

  it('returns empty array when no prints exist', async () => {
    cardRelatedDataRepository.findPrintsByCardId.mockResolvedValue([]);

    const useCase = new GetCardPrintsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '99999999' });

    expect(result).toEqual([]);
  });

  it('returns multiple prints', async () => {
    const prints: CardPrintResult[] = [
      {
        id: 'print-1',
        cardSetId: 'set-1',
        cardSetName: 'Set A',
        cardSetCode: 'SA',
        setCode: 'SA-001',
        rarity: 'Common',
        rarityCode: 'c',
        setPrice: null,
      },
      {
        id: 'print-2',
        cardSetId: 'set-2',
        cardSetName: 'Set B',
        cardSetCode: 'SB',
        setCode: 'SB-001',
        rarity: 'Rare',
        rarityCode: 'r',
        setPrice: 1.5,
      },
    ];
    cardRelatedDataRepository.findPrintsByCardId.mockResolvedValue(prints);

    const useCase = new GetCardPrintsUseCase(
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result).toHaveLength(2);
  });
});
