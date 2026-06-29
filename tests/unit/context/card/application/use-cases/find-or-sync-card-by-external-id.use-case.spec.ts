import { Card } from '../../../../../../src/context/card/domain/entities/card.entity';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../../src/context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { CardQueryRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-repository.port';
import { CardTranslationRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-translation-repository.port';
import { ExternalCardSourcePort } from '../../../../../../src/context/card/domain/ports/external-card-source.port';
import { CardRelatedDataRepositoryPort } from '../../../../../../src/context/card/domain/ports/card-related-data-repository.port';
import {
  CardDomainProcessError,
  CardDomainValidationError,
} from '../../../../../../src/context/card/domain/errors';
import { TransactionManagerPort } from '../../../../../../src/context/card/domain/ports/transaction-manager.port';
import { buildLoggerMock, buildSourceCard, buildTransactionManagerMock } from '../../../../../helpers';

describe('FindOrSyncCardByExternalIdUseCase', () => {

  let cardQueryRepository: jest.Mocked<CardQueryRepositoryPort>;
  let externalCardSource: jest.Mocked<ExternalCardSourcePort>;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;
  let cardTranslationRepository: jest.Mocked<CardTranslationRepositoryPort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;

  beforeEach(() => {
    cardQueryRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
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
      updateCardFields: jest.fn(),
      clearManualEditFlag: jest.fn(),
      isManuallyEdited: jest.fn().mockResolvedValue(false),
      getManuallyEditedCardIds: jest.fn().mockResolvedValue([]),
      batchInsertStubs: jest.fn(),
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
      findByCardIdsAndLanguage: jest.fn(),
      save: jest.fn(),
      deleteByCardId: jest.fn(),
      batchUpsert: jest.fn(),
    };
    transactionManager = buildTransactionManagerMock();
  });

  const createUseCase = () =>
    new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
      cardRelatedDataRepository,
      cardTranslationRepository,
      transactionManager,
      buildLoggerMock(),
    );

  it('returns the existing card when it is already stored', async () => {
    const existingCard = Card.create({
      id: '46986414',
      name: 'Dark Magician',
      ...buildSourceCard().card,
    });

    cardQueryRepository.findById.mockResolvedValue(existingCard);

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(result).not.toHaveProperty('rawData');
    expect(externalCardSource.findById).not.toHaveBeenCalled();
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(
      cardTranslationRepository.findByCardIdAndLanguage,
    ).not.toHaveBeenCalled();
  });

  it('syncs from API when stored card has invalid data', async () => {
    cardQueryRepository.findById.mockRejectedValue(
      new CardDomainValidationError({
        field: 'description',
        message: 'Card description is required',
        value: '',
        source: 'CardDescription.normalizeRequiredText',
        rule: 'required-trimmed-string',
      }),
    );

    const sourceCard = buildSourceCard();
    externalCardSource.findById.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(new Map());
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns the existing card with language=en without querying translations', async () => {
    const existingCard = Card.create({
      id: '46986414',
      name: 'Dark Magician',
      ...buildSourceCard().card,
    });

    cardQueryRepository.findById.mockResolvedValue(existingCard);

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414', language: 'en' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
    });
    expect(
      cardTranslationRepository.findByCardIdAndLanguage,
    ).not.toHaveBeenCalled();
  });

  it('applies translation when language=es and translation exists', async () => {
    const existingCard = Card.create({
      id: '46986414',
      name: 'Dark Magician',
      ...buildSourceCard().card,
    });

    cardQueryRepository.findById.mockResolvedValue(existingCard);
    cardTranslationRepository.findByCardIdAndLanguage.mockResolvedValue({
      name: 'Mago Oscuro',
      desc: 'El mago definitivo en términos de ataque y defensa.',
      type: 'Monstruo Normal',
      humanReadableCardType: 'Monstruo Normal',
      race: 'Lanzador de Conjuros',
    });

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414', language: 'es' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Mago Oscuro',
      desc: 'El mago definitivo en términos de ataque y defensa.',
      type: 'Monstruo Normal',
      humanReadableCardType: 'Monstruo Normal',
      race: 'Lanzador de Conjuros',
    });
    expect(
      cardTranslationRepository.findByCardIdAndLanguage,
    ).toHaveBeenCalledWith('46986414', 'es');
  });

  it('falls back to English when language=es but no translation exists', async () => {
    const existingCard = Card.create({
      id: '46986414',
      name: 'Dark Magician',
      ...buildSourceCard().card,
    });

    cardQueryRepository.findById.mockResolvedValue(existingCard);
    cardTranslationRepository.findByCardIdAndLanguage.mockResolvedValue(null);

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414', language: 'es' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
      desc: 'The ultimate wizard in terms of attack and defense.',
    });
  });

  it('loads from the external source and saves it when it is missing locally', async () => {
    const sourceCard = buildSourceCard();

    cardQueryRepository.findById.mockResolvedValue(null);
    externalCardSource.findById.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Dark Magician',
      type: 'Normal Monster',
    });
    expect(result).not.toHaveProperty('rawData');
    expect(transactionManager.transaction).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledWith(expect.any(Card));

    expect(cardRelatedDataRepository.saveCardSets).toHaveBeenCalledWith(
      sourceCard.cardSets,
    );
    expect(cardRelatedDataRepository.saveArtwork).toHaveBeenCalledTimes(1);
    expect(cardRelatedDataRepository.saveCardPrints).toHaveBeenCalledTimes(1);
  });

  it('applies translation to a newly synced card with language=es', async () => {
    const sourceCard = buildSourceCard();

    cardQueryRepository.findById.mockResolvedValue(null);
    externalCardSource.findById.mockResolvedValue(sourceCard);
    cardRelatedDataRepository.saveCardSets.mockResolvedValue(
      new Map([['Legend of Blue Eyes White Dragon', 'set-id-1']]),
    );
    cardRelatedDataRepository.saveArtwork.mockResolvedValue('artwork-id-1');
    cardTranslationRepository.findByCardIdAndLanguage.mockResolvedValue({
      name: 'Mago Oscuro',
      desc: 'El mago definitivo en términos de ataque y defensa.',
      type: null,
      humanReadableCardType: null,
      race: null,
    });

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414', language: 'es' });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: '46986414',
      name: 'Mago Oscuro',
      desc: 'El mago definitivo en términos de ataque y defensa.',
      type: 'Normal Monster',
      race: 'Spellcaster',
    });
  });

  it('returns null when the card does not exist anywhere', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);
    externalCardSource.findById.mockResolvedValue(null);

    const useCase = createUseCase();
    const result = await useCase.execute({ id: '46986414' });

    expect(result).toBeNull();
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(cardRelatedDataRepository.saveCardSets).not.toHaveBeenCalled();
  });

  it('backpropagates domain validation errors with process context', async () => {
    cardQueryRepository.findById.mockResolvedValue(null);
    externalCardSource.findById.mockResolvedValue(
      buildSourceCard({ race: 'UnknownRace' as never }),
    );

    const useCase = createUseCase();

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
      stage: 'FindOrSyncCardByExternalIdUseCase.execute',
      id: '46986414',
      causeCode: 'CARD_VALIDATION_ERROR',
    });
    expect(processError.cause).toBeInstanceOf(CardDomainValidationError);
  });
});
