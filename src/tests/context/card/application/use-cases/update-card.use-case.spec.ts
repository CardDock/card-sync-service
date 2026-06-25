import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { UpdateCardUseCase } from '../../../../../context/card/application/use-cases/update-card.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { CardDomainProcessError } from '../../../../../context/card/domain/errors';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

const buildCard = (overrides: Partial<Card['toPrimitives']> = {}): Card =>
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
    ...overrides,
  });

describe('UpdateCardUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    cardRepository = {
      save: jest.fn().mockResolvedValue('46986414'),
      delete: jest.fn(),
    };
  });

  it('updates card fields and saves', async () => {
    const existing = buildCard();
    cardQueryRepository.findById.mockResolvedValue(existing);

    const useCase = new UpdateCardUseCase(
      cardQueryRepository,
      cardRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      id: '46986414',
      updates: { name: 'Dark Magician (Fixed)' },
    });

    expect(result.toPrimitives().name).toBe('Dark Magician (Fixed)');
    expect(result.toPrimitives().atk).toBe(2500);
    expect(cardRepository.save).toHaveBeenCalledWith(expect.any(Card));
  });

  it('throws CardDomainProcessError when card does not exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);

    const useCase = new UpdateCardUseCase(
      cardQueryRepository,
      cardRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        id: '99999999',
        updates: { name: 'Test' },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('wraps validation errors in CardDomainProcessError', async () => {
    const existing = buildCard();
    cardQueryRepository.findById.mockResolvedValue(existing);

    const useCase = new UpdateCardUseCase(
      cardQueryRepository,
      cardRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        id: '46986414',
        updates: { race: 'InvalidRace' as never },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('can update multiple fields at once', async () => {
    const existing = buildCard();
    cardQueryRepository.findById.mockResolvedValue(existing);

    const useCase = new UpdateCardUseCase(
      cardQueryRepository,
      cardRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      id: '46986414',
      updates: {
        name: 'Dark Magician Updated',
        desc: 'New description',
        atk: 3000,
        def: 2500,
      },
    });

    expect(result.toPrimitives()).toMatchObject({
      name: 'Dark Magician Updated',
      desc: 'New description',
      atk: 3000,
      def: 2500,
      level: 7,
    });
  });
});
