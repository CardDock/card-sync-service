import { DeleteCardUseCase } from '../../../../../context/card/application/use-cases/delete-card.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../context/card/domain/ports/card-translation-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { TransactionManagerPort } from '../../../../../context/card/domain/ports/transaction-manager.port';
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

describe('DeleteCardUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    cardRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      markAsManuallyEdited: jest.fn(),
      clearManualEditFlag: jest.fn(),
      isManuallyEdited: jest.fn().mockResolvedValue(false),
      getManuallyEditedCardIds: jest.fn().mockResolvedValue([]),
    };
    cardTranslationRepository = {
      findByCardIdAndLanguage: jest.fn(),
      findCardIdsByName: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
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
    transactionManager = {
      transaction: jest.fn((fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<TransactionManagerPort>;
  });

  it('deletes card and all related data', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());

    const useCase = new DeleteCardUseCase(
      cardQueryRepository,
      cardRepository,
      cardTranslationRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    await useCase.execute({ id: '46986414' });

    expect(cardRelatedDataRepository.deleteByCardId).toHaveBeenCalledWith(
      '46986414',
    );
    expect(cardTranslationRepository.deleteByCardId).toHaveBeenCalledWith(
      '46986414',
    );
    expect(cardRepository.delete).toHaveBeenCalledWith('46986414');
    expect(transactionManager.transaction).toHaveBeenCalledTimes(1);
  });

  it('throws CardDomainProcessError when card does not exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);

    const useCase = new DeleteCardUseCase(
      cardQueryRepository,
      cardRepository,
      cardTranslationRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({ id: '99999999' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRepository.delete).not.toHaveBeenCalled();
    expect(transactionManager.transaction).not.toHaveBeenCalled();
  });
});
