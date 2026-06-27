import { SetCardTranslationUseCase } from '../../../../../context/card/application/use-cases/set-card-translation.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../context/card/domain/ports/card-translation-repository.port';
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

describe('SetCardTranslationUseCase', () => {
  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    cardTranslationRepository = {
      findByCardIdAndLanguage: jest.fn(),
      findCardIdsByName: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
      batchUpsert: jest.fn(),
    };
  });

  it('saves a translation when card exists', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());

    const useCase = new SetCardTranslationUseCase(
      cardQueryRepository,
      cardTranslationRepository,
      buildLoggerMock(),
    );

    await useCase.execute({
      cardId: '46986414',
      language: 'es',
      data: {
        name: 'Mago Oscuro',
        desc: 'El mago definitivo en términos de ataque y defensa.',
        type: 'Monstruo Normal',
      },
    });

    expect(cardTranslationRepository.save).toHaveBeenCalledWith(
      '46986414',
      'es',
      expect.objectContaining({
        name: 'Mago Oscuro',
        desc: 'El mago definitivo en términos de ataque y defensa.',
      }),
    );
  });

  it('throws CardDomainProcessError when card does not exist', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);

    const useCase = new SetCardTranslationUseCase(
      cardQueryRepository,
      cardTranslationRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '99999999',
        language: 'es',
        data: { name: 'Test', desc: 'Test' },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardTranslationRepository.save).not.toHaveBeenCalled();
  });

  it('throws CardDomainValidationError for unsupported language', async () => {
    cardQueryRepository.findById.mockResolvedValue(buildCard());

    const useCase = new SetCardTranslationUseCase(
      cardQueryRepository,
      cardTranslationRepository,
      buildLoggerMock(),
    );

    let raisedError: unknown;
    try {
      await useCase.execute({
        cardId: '46986414',
        language: 'fr',
        data: { name: 'Test', desc: 'Test' },
      });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(CardDomainProcessError);
    expect(cardTranslationRepository.save).not.toHaveBeenCalled();
  });
});
