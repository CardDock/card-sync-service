import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { CardQueryRepositoryPort, PaginatedResult } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import { ListCardsUseCase } from '../../../../../context/card/application/use-cases/list-cards.use-case';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

const buildCard = (overrides: Partial<Card> = {}): Card =>
  Object.assign(
    Card.create({
      externalId: '46986414',
      name: 'Dark Magician',
      typeline: ['Spellcaster', 'Normal'],
      type: 'Normal Monster',
      humanReadableCardType: 'Normal Monster',
      frameType: 'normal',
      desc: 'The ultimate wizard.',
      race: 'Spellcaster',
      atk: 2500,
      def: 2100,
      level: 7,
      scale: null,
      linkval: null,
      linkmarkers: [],
      attribute: 'DARK',
      rawData: {},
    }),
    overrides,
  );

describe('ListCardsUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findByExternalId: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
  });

  it('returns paginated results from the repository', async () => {
    const cards = [buildCard()];
    const expected: PaginatedResult<Card> = {
      items: cards,
      total: 1,
      page: 1,
      limit: 20,
    };
    cardQueryRepository.findAll.mockResolvedValue(expected);

    const useCase = new ListCardsUseCase(cardQueryRepository, buildLoggerMock());

    const result = await useCase.execute({
      filters: { type: 'Normal Monster' },
      page: 1,
      limit: 20,
    });

    expect(result).toEqual(expected);
    expect(cardQueryRepository.findAll).toHaveBeenCalledWith(
      { type: 'Normal Monster' },
      1,
      20,
    );
  });

  it('passes filters, page, and limit to the repository', async () => {
    cardQueryRepository.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      limit: 10,
    });

    const useCase = new ListCardsUseCase(cardQueryRepository, buildLoggerMock());

    await useCase.execute({
      filters: { race: 'Dragon', attribute: 'LIGHT', level: 8 },
      page: 2,
      limit: 10,
    });

    expect(cardQueryRepository.findAll).toHaveBeenCalledWith(
      { race: 'Dragon', attribute: 'LIGHT', level: 8 },
      2,
      10,
    );
  });

  it('returns empty items when no cards match', async () => {
    cardQueryRepository.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const useCase = new ListCardsUseCase(cardQueryRepository, buildLoggerMock());

    const result = await useCase.execute({
      filters: {},
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
