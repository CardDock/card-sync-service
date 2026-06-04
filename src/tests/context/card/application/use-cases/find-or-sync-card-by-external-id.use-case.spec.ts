import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { CardQueryRepositoryPort } from '../../../../../context/card/domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../../../../context/card/domain/ports/card-repository.port';
import { ExternalCardSourcePort } from '../../../../../context/card/domain/ports/external-card-source.port';
import { SyncCardParams } from '../../../../../context/card/domain/types/card.types';
import {
  CardDomainProcessError,
  CardDomainValidationError,
} from '../../../../../context/card/domain/errors';

describe('FindOrSyncCardByExternalIdUseCase', () => {
  const buildSourceCard = (
    overrides: Partial<SyncCardParams> = {},
  ): SyncCardParams => ({
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
      card_images: [
        { id: 46986414, image_url: 'https://example.com/image.png' },
      ],
    },
    ...overrides,
  });

  it('returns the existing card when it is already stored', async () => {
    const existingCard = Card.create({
      id: 'existing-id',
      ...buildSourceCard(),
    });

    const cardQueryRepository: CardQueryRepositoryPort = {
      findByExternalId: jest.fn().mockResolvedValue(existingCard),
    };
    const externalCardSource: ExternalCardSourcePort = {
      findByExternalId: jest.fn(),
    };
    const cardRepository: CardRepositoryPort = {
      save: jest.fn(),
    };

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toBe(existingCard);
    expect(externalCardSource.findByExternalId).not.toHaveBeenCalled();
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('loads from the external source and saves it when it is missing locally', async () => {
    const sourceCard = buildSourceCard();

    const cardQueryRepository: CardQueryRepositoryPort = {
      findByExternalId: jest.fn().mockResolvedValue(null),
    };
    const externalCardSource: ExternalCardSourcePort = {
      findByExternalId: jest.fn().mockResolvedValue(sourceCard),
    };
    const cardRepository: CardRepositoryPort = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result?.toPrimitives()).toMatchObject({
      externalId: '46986414',
      name: 'Dark Magician',
      type: 'Normal Monster',
    });
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
    expect(cardRepository.save).toHaveBeenCalledWith(expect.any(Card));
  });

  it('returns null when the card does not exist anywhere', async () => {
    const cardQueryRepository: CardQueryRepositoryPort = {
      findByExternalId: jest.fn().mockResolvedValue(null),
    };
    const externalCardSource: ExternalCardSourcePort = {
      findByExternalId: jest.fn().mockResolvedValue(null),
    };
    const cardRepository: CardRepositoryPort = {
      save: jest.fn(),
    };

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
    );

    const result = await useCase.execute({ externalId: '46986414' });

    expect(result).toBeNull();
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('backpropagates domain validation errors with process context', async () => {
    const cardQueryRepository: CardQueryRepositoryPort = {
      findByExternalId: jest.fn().mockResolvedValue(null),
    };
    const externalCardSource: ExternalCardSourcePort = {
      findByExternalId: jest
        .fn()
        .mockResolvedValue(buildSourceCard({ race: 'UnknownRace' as never })),
    };
    const cardRepository: CardRepositoryPort = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new FindOrSyncCardByExternalIdUseCase(
      cardQueryRepository,
      externalCardSource,
      cardRepository,
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
