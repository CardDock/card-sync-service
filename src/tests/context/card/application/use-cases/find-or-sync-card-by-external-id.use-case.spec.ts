import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { ExternalCardSourcePort } from '../../../../../context/card/domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { SyncCardWithRelatedData } from '../../../../../context/card/domain/types/sync-card-with-related.types';
import {
  CardDomainProcessError,
  CardDomainValidationError,
} from '../../../../../context/card/domain/errors';
import { PostgresPoolProvider } from '../../../../../context/card/infrastructure/persistence/postgres-pool.provider';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

describe('FindOrSyncCardByExternalIdUseCase', () => {
  const buildSourceCard = (
    overrides: Partial<SyncCardWithRelatedData['card']> = {},
  ): SyncCardWithRelatedData => ({
    card: {
      externalId: '46986414',
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
      rawData: {
        id: 46986414,
        name: 'Dark Magician',
      },
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

  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let externalCardSource: jest.Mocked<ExternalCardSourcePort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let postgresPoolProvider: jest.Mocked<PostgresPoolProvider>;

  beforeEach(() => {
    cardQueryRepository = {
      findByExternalId: jest.fn(),
      findByName: jest.fn(),
    };
    externalCardSource = {
      findByExternalId: jest.fn(),
      findByName: jest.fn(),
    };
    cardRepository = {
      save: jest.fn(),
    };
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findFirstArtworkIdByCardExternalId: jest.fn(),
    };
    postgresPoolProvider = {
      transaction: jest.fn((fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<PostgresPoolProvider>;
  });

  it('returns the existing card when it is already stored', async () => {
    const existingCard = Card.create({
      id: 'existing-id',
      ...buildSourceCard().card,
    });

    cardQueryRepository.findByExternalId.mockResolvedValue(existingCard);

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      postgresPoolProvider,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toBe(existingCard);
    expect(externalCardSource.findByExternalId).not.toHaveBeenCalled();
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveCardSets).not.toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveArtwork).not.toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveCardPrints).not.toHaveBeenCalled();
  });

  it('loads from the external source and saves it when it is missing locally', async () => {
    const sourceCard = buildSourceCard();

    cardQueryRepository.findByExternalId.mockResolvedValue(null);
    externalCardSource.findByExternalId.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      postgresPoolProvider,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result?.toPrimitives()).toMatchObject({
      externalId: '46986414',
      name: 'Dark Magician',
      type: 'Normal Monster',
    });
    expect(postgresPoolProvider.transaction).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledWith(expect.any(Card));

    expect(cardRelatedDataRepository.saveCardSets).toHaveBeenCalledWith(
      sourceCard.cardSets,
    );
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledTimes(1);
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledTimes(1);
  });

  it('returns null when the card does not exist anywhere', async () => {
    cardQueryRepository.findByExternalId.mockResolvedValue(null);
    externalCardSource.findByExternalId.mockResolvedValue(null);

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      postgresPoolProvider,
      buildLoggerMock(),
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toBeNull();
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveCardSets).not.toHaveBeenCalled();
  });

  it('backpropagates domain validation errors with process context', async () => {
    cardQueryRepository.findByExternalId.mockResolvedValue(null);
    externalCardSource.findByExternalId.mockResolvedValue(
      buildSourceCard({ race: 'UnknownRace' as never }),
    );

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      postgresPoolProvider,
      buildLoggerMock(),
    );

    let raisedError: unknown;

    try {
      await useCase.execute({ externalId: '46986414' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);

    const processError = raisedError as CardDomainProcessError;

    expect(processError.code).toBe('CARD_PROCESS_ERROR');
    expect(processError.context).toMatchObject({
      entity: 'Card',
      stage: 'FindOrSyncCardByExternalIdUseCase.execute',
      externalId: '46986414',
      causeCode: 'CARD_VALIDATION_ERROR',
    });
    expect(processError.cause).toBeInstanceOf(CardDomainValidationError);
  });
});
