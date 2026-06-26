import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { SearchCardByNameUseCase } from '../../../../../context/card/application/use-cases/search-card-by-name.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../context/card/domain/ports/card-translation-repository.port';
import { ExternalCardSourcePort } from '../../../../../context/card/domain/ports/external-card-source.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { CardSyncDiscrepancyRepositoryPort } from '../../../../../context/card/domain/ports/card-sync-discrepancy-repository.port';
import { SyncCardWithRelatedData } from '../../../../../context/card/domain/types/sync-card-with-related.types';
import { CardDomainProcessError } from '../../../../../context/card/domain/errors';
import { TransactionManagerPort } from '../../../../../context/card/domain/ports/transaction-manager.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

const buildSourceCard = (
  overrides: Partial<SyncCardWithRelatedData['card']> = {},
): SyncCardWithRelatedData => ({
  card: {
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
    ...overrides,
  },
  cardSets: [{ name: 'Legend of Blue Eyes White Dragon', code: 'LOB' }],
  artworks: [{ imageUrl: 'https://example.com/image.png' }],
  cardPrints: [
    {
      setName: 'Legend of Blue Eyes White Dragon',
      setCode: 'LOB-001',
      rarity: 'Ultra Rare',
      rarityCode: 'UR',
      setPrice: 12.5,
    },
  ],
});

describe('SearchCardByNameUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let externalCardSource: jest.Mocked<ExternalCardSourcePort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;
  let cardSyncDiscrepancyRepository: jest.Mocked<CardSyncDiscrepancyRepositoryPort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    externalCardSource = {
      findById: jest.fn(),
      findByName: jest.fn(),
    };
    cardRepository = {
      save: jest.fn().mockResolvedValue('stored-card-id'),
      delete: jest.fn(),
      markAsManuallyEdited: jest.fn(),
      clearManualEditFlag: jest.fn(),
      isManuallyEdited: jest.fn().mockResolvedValue(false),
      getManuallyEditedCardIds: jest.fn().mockResolvedValue([]),
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
    cardTranslationRepository = {
      findByCardIdAndLanguage: jest.fn(),
      findCardIdsByName: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
    };
    cardSyncDiscrepancyRepository = {
      upsert: jest.fn(),
      findByCardId: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      deleteByCardIdAndFieldName: jest.fn(),
    };
    transactionManager = {
      transaction: jest.fn((fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<TransactionManagerPort>;
  });

  const createUseCase = () =>
    new SearchCardByNameUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      cardTranslationRepository,
      cardSyncDiscrepancyRepository,
      transactionManager,
      buildLoggerMock(),
    );

  it('fetches from external source and saves cards', async () => {
    const sourceCard = buildSourceCard();
    externalCardSource.findByName.mockResolvedValue([sourceCard]);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = createUseCase();
    const result = await useCase.execute({ name: 'Dark Magician' });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(result[0]).not.toHaveProperty('rawData');
    expect(transactionManager.transaction).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
    expect(cardRelatedDataRepository.saveCardSets).toHaveBeenCalledWith(
      sourceCard.cardSets,
    );
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledWith(
      'stored-card-id',
      'https://example.com/image.png',
    );
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledTimes(1);
  });

  it('searches translations first when language=es', async () => {
    cardTranslationRepository.findCardIdsByName.mockResolvedValue(['46986414']);
    cardQueryRepository.findById.mockResolvedValue(
      Card.create({
        id: '46986414',
        name: 'Dark Magician',
        ...buildSourceCard().card,
      }),
    );
    cardTranslationRepository.findByCardIdAndLanguage.mockResolvedValue({
      name: 'Mago Oscuro',
      desc: 'El mago definitivo.',
      type: null,
      humanReadableCardType: null,
      race: null,
    });

    const useCase = createUseCase();
    const result = await useCase.execute({
      name: 'Mago Oscuro',
      language: 'es',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '46986414',
      name: 'Mago Oscuro',
      desc: 'El mago definitivo.',
    });
    expect(externalCardSource.findByName).not.toHaveBeenCalled();
  });

  it('falls back to YGOPRODeck when translations search returns no results', async () => {
    cardTranslationRepository.findCardIdsByName.mockResolvedValue([]);
    const sourceCard = buildSourceCard();
    externalCardSource.findByName.mockResolvedValue([sourceCard]);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = createUseCase();
    const result = await useCase.execute({
      name: 'Mago Oscuro',
      language: 'es',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(externalCardSource.findByName).toHaveBeenCalledWith('Mago Oscuro');
  });

  it('returns empty array when external source has no results', async () => {
    externalCardSource.findByName.mockResolvedValue([]);

    const useCase = createUseCase();
    const result = await useCase.execute({ name: 'NonExistentCard' });

    expect(result).toEqual([]);
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('syncs multiple cards from external source', async () => {
    const card1 = buildSourceCard({ id: '46986414', name: 'Dark Magician' });
    const card2 = buildSourceCard({
      id: '89631139',
      name: 'Blue-Eyes White Dragon',
    });
    externalCardSource.findByName.mockResolvedValue([card1, card2]);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(new Map());
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = createUseCase();
    const result = await useCase.execute({ name: 'Dragon' });

    expect(result).toHaveLength(2);
    expect(transactionManager.transaction).toHaveBeenCalledTimes(2);
    expect(cardRepository.save).toHaveBeenCalledTimes(2);
  });

  it('wraps non-domain errors without causeCode in context', async () => {
    externalCardSource.findByName.mockRejectedValue(
      new Error('Network failure'),
    );

    const useCase = createUseCase();

    let raisedError: unknown;
    try {
      await useCase.execute({ name: 'Dark Magician' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    const processError = raisedError as CardDomainProcessError;
    expect(processError.context).toMatchObject({
      name: 'Dark Magician',
    });
    expect(processError.context).not.toHaveProperty('causeCode');
  });

  it('wraps domain validation errors in CardDomainProcessError', async () => {
    externalCardSource.findByName.mockResolvedValue([
      buildSourceCard({ race: 'UnknownRace' as never }),
    ]);

    const useCase = createUseCase();

    let raisedError: unknown;
    try {
      await useCase.execute({ name: 'Dark Magician' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    const processError = raisedError as CardDomainProcessError;
    expect(processError.code).toBe('CARD_PROCESS_ERROR');
    expect(processError.context).toMatchObject({
      entity: 'Card',
      stage: 'SearchCardByNameUseCase.execute',
      name: 'Dark Magician',
      causeCode: 'CARD_VALIDATION_ERROR',
    });
  });
});
