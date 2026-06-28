import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { SearchCardByNameUseCase } from '../../../../../context/card/application/use-cases/search-card-by-name.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../context/card/domain/ports/card-translation-repository.port';
import { CardDomainProcessError } from '../../../../../context/card/domain/errors';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import type { CreateCardParams } from '../../../../../context/card/domain/types/card.types';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

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
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    cardTranslationRepository = {
      findByCardIdAndLanguage: jest.fn(),
      findCardIdsByName: jest.fn(),
      findByCardIdsAndLanguage: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
      batchUpsert: jest.fn(),
    };
  });

  const createUseCase = () =>
    new SearchCardByNameUseCase(
      cardQueryRepository,
      cardTranslationRepository,
      buildLoggerMock(),
    );

  describe('when language is provided', () => {
    it('searches translations, batch fetches cards, and merges translations', async () => {
      const card = buildCard({ id: '46986414', name: 'Mago Oscuro' });
      const cardsMap = new Map([['46986414', card]]);
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
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);
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
      expect(cardQueryRepository.findByIds).toHaveBeenCalledWith(['46986414']);
    });

    it('returns empty array when no translations match', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([]);

      const useCase = createUseCase();
      const result = await useCase.execute({
        name: 'NonExistent',
        language: 'es',
      });

      expect(result).toEqual([]);
      expect(cardQueryRepository.findByIds).not.toHaveBeenCalled();
    });

    it('skips cards not found in cards table', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
        'missing-id',
      ]);
      const cardsMap = new Map([['46986414', buildCard({ id: '46986414' })]]);
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);
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

    it('limits to 20 results', async () => {
      const ids = Array.from({ length: 25 }, (_, i) => `${i}`);
      cardTranslationRepository.findCardIdsByName.mockResolvedValue(ids);
      const cardsMap = new Map(ids.map((id) => [id, buildCard({ id })]));
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);
      cardTranslationRepository.findByCardIdsAndLanguage.mockResolvedValue(
        new Map(),
      );

      const useCase = createUseCase();
      await useCase.execute({ name: 'test', language: 'es' });

      expect(cardQueryRepository.findByIds).toHaveBeenCalledWith(
        ids.slice(0, 20),
      );
    });

    it('returns English fallback when translation record is missing', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      const cardsMap = new Map([['46986414', buildCard({ id: '46986414' })]]);
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);
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
      const cardsMap = new Map([['46986414', card]]);
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
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);

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
    it('searches cards.name, batch fetches, and returns English results', async () => {
      const card = buildCard({ id: '46986414' });
      const cardsMap = new Map([['46986414', card]]);
      cardQueryRepository.findByName.mockResolvedValue([card]);
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);

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
      expect(cardQueryRepository.findByIds).toHaveBeenCalledWith(['46986414']);
      expect(
        cardTranslationRepository.findByCardIdsAndLanguage,
      ).not.toHaveBeenCalled();
    });

    it('returns empty array when no cards match locally', async () => {
      cardQueryRepository.findByName.mockResolvedValue([]);

      const useCase = createUseCase();
      const result = await useCase.execute({ name: 'NonExistentCard' });

      expect(result).toEqual([]);
      expect(cardQueryRepository.findByIds).not.toHaveBeenCalled();
    });

    it('returns multiple results when multiple cards match', async () => {
      const card1 = buildCard({ id: '46986414', name: 'Dark Magician' });
      const card2 = buildCard({
        id: '89631139',
        name: 'Blue-Eyes White Dragon',
      });
      const cardsMap = new Map([
        ['46986414', card1],
        ['89631139', card2],
      ]);
      cardQueryRepository.findByName.mockResolvedValue([card1, card2]);
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);

      const useCase = createUseCase();
      const result = await useCase.execute({ name: 'Dragon' });

      expect(result).toHaveLength(2);
    });
  });

  describe('when language is English', () => {
    it('searches translations and returns English results without querying translations map', async () => {
      cardTranslationRepository.findCardIdsByName.mockResolvedValue([
        '46986414',
      ]);
      const cardsMap = new Map([['46986414', buildCard({ id: '46986414' })]]);
      cardQueryRepository.findByIds.mockResolvedValue(cardsMap);

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
