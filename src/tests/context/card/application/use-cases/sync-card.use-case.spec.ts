import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { SyncCardUseCase } from '../../../../../context/card/application/use-cases/sync-card.use-case';
import { ExternalCardSourcePort } from '../../../../../context/card/domain/ports/external-card-source.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { SyncCardWithRelatedData } from '../../../../../context/card/domain/types/sync-card-with-related.types';
import {
  CardDomainProcessError,
  CardDomainValidationError,
} from '../../../../../context/card/domain/errors';
import { TransactionManagerPort } from '../../../../../context/card/domain/ports/transaction-manager.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

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
  cardSets: [
    { name: 'Legend of Blue Eyes White Dragon', code: 'LOB' },
  ],
  artworks: [
    { imageUrl: 'https://example.com/image.png' },
  ],
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

describe('SyncCardUseCase', () => {
  let externalCardSource: jest.Mocked<ExternalCardSourcePort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;

  beforeEach(() => {
    externalCardSource = {
      findById: jest.fn(),
      findByName: jest.fn(),
    };
    cardRepository = {
      save: jest.fn().mockResolvedValue('stored-card-id'),
    };
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findArtworksByCardId: jest.fn(),
      findPrintsByCardId: jest.fn(),
      findAllCardSets: jest.fn(),
    };
    transactionManager = {
      transaction: jest.fn((fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<TransactionManagerPort>;
  });

  it('fetches from external source and saves the card', async () => {
    const sourceCard = buildSourceCard();
    externalCardSource.findById.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = new SyncCardUseCase(
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result.toPrimitives()).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(externalCardSource.findById).toHaveBeenCalledWith('46986414');
    expect(transactionManager.transaction).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledWith(expect.any(Card));
    expect(cardRelatedDataRepository.saveCardSets).toHaveBeenCalledWith(
      sourceCard.cardSets,
    );
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledWith(
      'stored-card-id',
      'https://example.com/image.png',
    );
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledTimes(1);
  });

  it('returns null when external source has no data', async () => {
    externalCardSource.findById.mockResolvedValue(null);

    const useCase = new SyncCardUseCase(
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '99999999' });

    expect(result).toBeNull();
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(transactionManager.transaction).not.toHaveBeenCalled();
  });

  it('saves prints only for the first artwork', async () => {
    const sourceCard = buildSourceCard();
    sourceCard.artworks = [
      { imageUrl: 'https://example.com/1.jpg' },
      { imageUrl: 'https://example.com/2.jpg' },
    ];
    externalCardSource.findById.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(new Map());
    cardRelatedDataRepository.saveArtwork
      .mockResolvedValueOnce('artwork-id-1')
      .mockResolvedValueOnce('artwork-id-2');

    const useCase = new SyncCardUseCase(
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ id: '46986414' });

    expect(result).not.toBeNull();
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledTimes(2);
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledTimes(1);
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledWith(
      'artwork-id-1',
      sourceCard.cardPrints,
      expect.any(Map),
    );
  });

  it('wraps non-domain errors without causeCode in context', async () => {
    externalCardSource.findById.mockRejectedValue(
      new Error('Network failure'),
    );

    const useCase = new SyncCardUseCase(
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({ id: '46986414' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    const processError = raisedError as CardDomainProcessError;
    expect(processError.context).toMatchObject({
      id: '46986414',
    });
    expect(processError.context).not.toHaveProperty('causeCode');
  });

  it('wraps domain validation errors in CardDomainProcessError', async () => {
    externalCardSource.findById.mockResolvedValue(
      buildSourceCard({ race: 'UnknownRace' as never }),
    );

    const useCase = new SyncCardUseCase(
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      transactionManager,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({ id: '46986414' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    const processError = raisedError as CardDomainProcessError;
    expect(processError.code).toBe('CARD_PROCESS_ERROR');
    expect(processError.context).toMatchObject({
      entity: 'Card',
      stage: 'SyncCardUseCase.execute',
      id: '46986414',
      causeCode: 'CARD_VALIDATION_ERROR',
    });
  });
});
