import { Card } from '../../../../../../src/context/card/domain/entities/card.entity';
import { SearchCardByNameUseCase } from '../../../../../../src/context/card/application/use-cases/search-card-by-name.use-case';
import { CardQueryRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-translation-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import { CardRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-repository.port';
import { ExternalCardSourcePort } from '../../../../../../src/context/card/domain/ports/external-card-source.port';
import { CardDomainProcessError } from '../../../../../../src/context/card/domain/errors';
import { TransactionManagerPort } from '../../../../../../src/context/card/domain/ports/transaction-manager.port';
import type { CreateCardParams } from '../../../../../../src/context/card/domain/types/card.types';
import {
  buildLoggerMock,
  buildSourceCard,
  buildTransactionManagerMock,
} from '../../../../../helpers';

const buildCardPrimitives = (
  overrides: Partial<CreateCardParams> = {},
): CreateCardParams => ({
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
});

const buildCard = (overrides: Partial<CreateCardParams> = {}): Card =>
  Card.create(buildCardPrimitives(overrides));

describe('SearchCardByNameUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let externalCardSource: jest.Mocked<ExternalCardSourcePort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;

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
      findPrintsWithArtworkByCardId: jest.fn().mockResolvedValue([]),
      findAllCardSets: jest.fn(),
      deleteByCardId: jest.fn(),
      findFirstArtworkIdByCardId: jest.fn(),
    };
    cardTranslationRepository = {
      findByCardIdAndLanguage: jest.fn(),
      findCardIdsByName: jest.fn(),
      findByCardIdsAndLanguage: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
      batchUpsert: jest.fn(),
    };
    cardRepository = {
      save: jest.fn().mockResolvedValue('stored-card-id'),
      delete: jest.fn(),
      markAsManuallyEdited: jest.fn(),
      updateCardFields: jest.fn(),
      clearManualEditFlag: jest.fn(),
      isManuallyEdited: jest.fn().mockResolvedValue(false),
      getManuallyEditedCardIds: jest.fn().mockResolvedValue([]),
    };
    externalCardSource = {
      findById: jest.fn(),
      findByName: jest.fn(),
    };
    transactionManager = buildTransactionManagerMock();
  });

  const createUseCase = () =>
    new SearchCardByNameUseCase(
      cardQueryRepository,
      cardRelatedDataRepository,
      cardTranslationRepository,
      cardRepository,
      externalCardSource,
      transactionManager,
      buildLoggerMock(),
    );

  describe('when language is provided', () => {
    it('searches translations, batch fetches cards, and merges translations', async () => {
      const card = buildCard({ id: '46986414', name: 'Mago Oscuro' });
      const translationsMap = new Map([
        [
          '46986414',
          {
            name: 'Mago Oscuro',
            desc: 'El mago definitivo.',
            type: null,
            humanReadableCardType: null,
            race: null,
          },
        ],
      ]);

      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      cardQueryRepository.findById.mockResolvedValue(card);
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        translationsMap,
      );

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
      expect(cardTranslationRepository.findCardIdsByName).toHaveBeenCalledWith(
        'Mago Oscuro',
        'es',
      );
      expect(cardQueryRepository.findById).toHaveBeenCalledWith('46986414');
    });

    it('returns empty array when no translations match', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([]);

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'NonExistent',
        language: 'es',
      });

      expect(result).toEqual([]);
      expect(cardQueryRepository.findById).not.toHaveBeenCalled();
      expect(externalCardSource.findById).not.toHaveBeenCalled();
    });

    it('skips cards not found in cards table and not available on external API', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
        'missing-id',
      ]);
      cardQueryRepository.findById
        .mockResolvedValueOnce(buildCard({ id: '46986414' }))
        .mockResolvedValueOnce(null);
      externalCardSource.findById.mockResolvedValue(null);
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map(),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'test',
        language: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('46986414');
    });

    it('syncs from YGOPRODeck API when card is not in local cache', async () => {
      const sourceCard = buildSourceCard({
        id: '24224830',
        name: 'Called by the Grave',
      });

      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '24224830',
      ]);
      cardQueryRepository.findById.mockResolvedValue(null);
      externalCardSource.findById.mockResolvedValue(sourceCard);
      cardRelatedDataRepository.saveCardSets.mockResolvedValue(new Map());
      cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map(),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'Called by the Grave',
        language: 'en',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '24224830',
        name: 'Called by the Grave',
      });
      expect(externalCardSource.findById).toHaveBeenCalledWith('24224830');
      expect(cardRepository.save).toHaveBeenCalledTimes(1);
      expect(transactionManager.transaction).toHaveBeenCalledTimes(1);
    });

    it('syncs from YGOPRODeck API and merges Spanish translation', async () => {
      const sourceCard = buildSourceCard({
        id: '24224830',
        name: 'Called by the Grave',
      });

      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '24224830',
      ]);
      cardQueryRepository.findById.mockResolvedValue(null);
      externalCardSource.findById.mockResolvedValue(sourceCard);
      cardRelatedDataRepository.saveCardSets.mockResolvedValue(new Map());
      cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map([
          [
            '24224830',
            {
              name: 'Llamado por la Tumba',
              desc: 'Carta de trampa.',
              type: 'Carta de Trampa',
              humanReadableCardType: 'Carta de Trampa',
              race: null,
            },
          ],
        ]),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'Llamado por la Tumba',
        language: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '24224830',
        name: 'Llamado por la Tumba',
        desc: 'Carta de trampa.',
        type: 'Carta de Trampa',
      });
      expect(externalCardSource.findById).toHaveBeenCalledWith('24224830');
      expect(cardRepository.save).toHaveBeenCalledTimes(1);
    });

    it('returns empty when external API does not have the card either', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        'unknown-id',
      ]);
      cardQueryRepository.findById.mockResolvedValue(null);
      externalCardSource.findById.mockResolvedValue(null);

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'ghost',
        language: 'es',
      });

      expect(result).toEqual([]);
      expect(cardRepository.save).not.toHaveBeenCalled();
    });

    it('limits to 20 results', async () => {
      const ids = Array.from({ length: 25 }, (_, i) => `${i}`);
      cardTranslationRepository.findCardIdsByName.mockResolvedValue(ids);
      cardQueryRepository.findById.mockImplementation((id) =>
        Promise.resolve(buildCard({ id })),
      );
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map(),
      );

      const useCase = createUseCase();
      await useCase.execute({ name: 'test', language: 'es' });

      expect(cardQueryRepository.findById).toHaveBeenCalledTimes(20);
    });

    it('returns English fallback when translation record is missing', async () => {
      const card = buildCard({ id: '46986414', name: 'Dark Magician' });
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      cardQueryRepository.findById.mockResolvedValue(card);
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map(),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'Dark Magician',
        language: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Dark Magician',
        desc: 'The ultimate wizard in terms of attack and defense.',
      });
    });

    it('applies partial translation fields', async () => {
      const card = buildCard({ id: '46986414' });
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      cardQueryRepository.findById.mockResolvedValue(card);
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map([
          [
            '46986414',
            {
              name: 'Mago Oscuro',
              desc: null,
              type: 'Monstruo Normal',
              humanReadableCardType: 'Monstruo Normal',
              race: 'Lanzador de Conjuros',
            },
          ],
        ]),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'Mago Oscuro',
        language: 'es',
      });

      expect(result[0]).toMatchObject({
        name: 'Mago Oscuro',
        type: 'Monstruo Normal',
        humanReadableCardType: 'Monstruo Normal',
        race: 'Lanzador de Conjuros',
      });
    });
  });

  describe('when no language is provided', () => {
    it('searches cards.name, fetches each by id, and returns English results', async () => {
      const card = buildCard({ id: '46986414' });
      cardQueryRepository.findByName.mockResolvedValue([card]);
      cardQueryRepository.findById.mockResolvedValue(card);

      const useCase = createUseCase();
      const result = await useCase.execute({ name: 'Dark Magician' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '46986414',
        name: 'Dark Magician',
      });
      expect(result[0]).not.toHaveProperty('rawData');
      expect(cardQueryRepository.findByName).toHaveBeenCalledWith(
        'Dark Magician',
      );
      expect(cardQueryRepository.findById).toHaveBeenCalledWith('46986414');
      expect(
        cardTranslationRepository.findByCardIdsAndLanguage,
      ).not.toHaveBeenCalled();
    });

    it('returns empty array when no cards match locally', async () => {
      cardQueryRepository.findByName.mockResolvedValue([]);

      const useCase = createUseCase();
      const result = await useCase.execute({ name: 'NonExistentCard' });

      expect(result).toEqual([]);
      expect(cardQueryRepository.findById).not.toHaveBeenCalled();
    });

    it('returns multiple results when multiple cards match', async () => {
      const card1 = buildCard({ id: '46986414', name: 'Dark Magician' });
      const card2 = buildCard({
        id: '89631139',
        name: 'Blue-Eyes White Dragon',
      });
      cardQueryRepository.findByName.mockResolvedValue([card1, card2]);
      cardQueryRepository.findById.mockImplementation((id) =>
        Promise.resolve(id === '46986414' ? card1 : card2),
      );

      const useCase = createUseCase();
      const result = await useCase.execute({ name: 'Dragon' });

      expect(result).toHaveLength(2);
    });
  });

  describe('when language is English', () => {
    it('searches translations and returns English results without querying translations map', async () => {
      const card = buildCard({ id: '46986414' });
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      cardQueryRepository.findById.mockResolvedValue(card);

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'Dark Magician',
        language: 'en',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: '46986414' });
      expect(
        cardTranslationRepository.findByCardIdsAndLanguage,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('wraps non-domain errors in CardDomainProcessError', async () => {
      cardQueryRepository.findByName.mockRejectedValue(
        new Error('Database failure'),
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
      cardQueryRepository.findByName.mockImplementation(() => {
        try {
          Card.create({} as never);
        } catch {
          throw new CardDomainProcessError({
            stage: 'Card.create',
            message: 'Invalid card data',
            context: { entity: 'Card' },
          });
        }
        return Promise.resolve([]);
      });

      const useCase = createUseCase();

      let raisedError: unknown;
      try {
        await useCase.execute({ name: 'Dark Magician' });
      } catch (error) {
        raisedError = error;
      }

      expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    });
  });
});
