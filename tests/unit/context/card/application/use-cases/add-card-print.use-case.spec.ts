import { AddCardPrintUseCase } from '../../../../../../src/context/card/application/use-cases/add-card-print.use-case';
import { CardQueryRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-query-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import { Card } from '../../../../../../src/context/card/domain/entities/card.entity';
import { CardDomainProcessError } from '../../../../../../src/context/card/domain/errors';
import { buildLoggerMock } from '../../../../../helpers';

const buildCard = (): Card =>
  Card.create({
    id: '46986414',
    name: 'Dark Magician',
    typeline: ['Spellcaster', 'Normal'],
    type: 'Normal Monster',
    humanReadableCardType: 'Normal Monster',
    frameType: 'normal',
    desc: 'The ultimate wizard in terms of attack and defense.',
    race: 'Spellcaster',
    atk: 2500,
    def: 2100,
    level: 7,
    scale: null,
    linkval: null,
    linkmarkers: [],
    attribute: 'DARK',
    rawData: { id: 46986414, name: 'Dark Magician' },
  });

describe('AddCardPrintUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
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

  it('saves a print when card and artwork exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());
    cardRelatedDataRepository.findFirstArtworkIdByCardId.mockResolvedValue(
      'artwork-id-1',
    );
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Starter Deck', 'set-id-1']]),
    );

    const useCase = new AddCardPrintUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    await useCase.execute({
      cardId: '46986414',
      print: {
        setName: 'Starter Deck',
        setCode: 'YSD-001',
        rarity: 'Common',
        rarityCode: 'C',
        setPrice: null,
      },
    });

    expect(cardRelatedDataRepository.saveCardSets).toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledWith(
      'artwork-id-1',
      expect.any(Array),
      expect.any(Map),
    );
  });

  it('throws CardDomainProcessError when card does not exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);

    const useCase = new AddCardPrintUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '99999999',
        print: { setName: 'Test', setCode: 'TST-001', rarity: 'Common' },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRelatedDataRepository.saveCardSets).not.toHaveBeenCalled();
  });

  it('throws CardDomainProcessError when card has no artworks', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());
    cardRelatedDataRepository.findFirstArtworkIdByCardId.mockResolvedValue(
      null,
    );

    const useCase = new AddCardPrintUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '46986414',
        print: { setName: 'Test', setCode: 'TST-001', rarity: 'Common' },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRelatedDataRepository.saveCardSets).not.toHaveBeenCalled();
  });
});
