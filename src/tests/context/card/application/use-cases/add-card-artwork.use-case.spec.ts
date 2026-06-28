import { AddCardArtworkUseCase } from '../../../../../context/card/application/use-cases/add-card-artwork.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { CardDomainProcessError } from '../../../../../context/card/domain/errors';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

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

describe('AddCardArtworkUseCase', () => {
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

  it('saves an artwork when card exists', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = new AddCardArtworkUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      cardId: '46986414',
      imageUrl: 'https://example.com/alt-artwork.jpg',
    });

    expect(result).toEqual({ id: 'artwork-id-1' });
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledWith(
      '46986414',
      'https://example.com/alt-artwork.jpg',
    );
  });

  it('throws CardDomainProcessError when card does not exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);

    const useCase = new AddCardArtworkUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '99999999',
        imageUrl: 'https://example.com/artwork.jpg',
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRelatedDataRepository.saveArtwork).not.toHaveBeenCalled();
  });

  it('throws CardDomainValidationError for invalid image URL', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());

    const useCase = new AddCardArtworkUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '46986414',
        imageUrl: '',
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRelatedDataRepository.saveArtwork).not.toHaveBeenCalled();
  });
});
