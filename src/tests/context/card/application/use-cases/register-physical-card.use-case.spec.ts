import { PhysicalCard } from '../../../../../context/card/domain/entities/physical-card.entity';
import { RegisterPhysicalCardUseCase } from '../../../../../context/card/application/use-cases/register-physical-card.use-case';
import { PhysicalCardRepositoryPort } from '../../../../../context/card/domain/ports/physical-card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../../../../context/card/domain/ports/card-related-data-repository.port';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

describe('RegisterPhysicalCardUseCase', () => {
  let physicalCardRepository: jest.Mocked<PhysicalCardRepositoryPort>;
  let cardRelatedDataRepository: jest.Mocked<CardRelatedDataRepositoryPort>;

  beforeEach(() => {
    physicalCardRepository = {
      save: jest.fn(),
    };
    cardRelatedDataRepository = {
      saveCardSets: jest.fn(),
      saveArtwork: jest.fn(),
      saveCardPrints: jest.fn(),
      findFirstArtworkIdByCardExternalId: jest.fn(),
      findArtworksByCardExternalId: jest.fn(),
      findPrintsByCardExternalId: jest.fn(),
      findAllCardSets: jest.fn(),
    };
  });

  it('registers a physical card when artwork exists', async () => {
    cardRelatedDataRepository.findFirstArtworkIdByCardExternalId.mockResolvedValue('artwork-id-1');

    const savedCard = PhysicalCard.create({
      artworkId: 'artwork-id-1',
      condition: 'Near Mint',
      language: 'EN',
      isFirstEdition: true,
    });
    physicalCardRepository.save.mockResolvedValue(savedCard);

    const useCase = new RegisterPhysicalCardUseCase(
      physicalCardRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      externalId: '46986414',
      condition: 'Near Mint',
      language: 'EN',
      isFirstEdition: true,
    });

    expect(result).toMatchObject({
      artworkId: 'artwork-id-1',
      condition: 'NEAR_MINT',
      language: 'EN',
      isFirstEdition: true,
    });
    expect(cardRelatedDataRepository.findFirstArtworkIdByCardExternalId).toHaveBeenCalledWith('46986414');
    expect(physicalCardRepository.save).toHaveBeenCalledWith(expect.any(PhysicalCard));
  });

  it('registers a physical card with default values for optional fields', async () => {
    cardRelatedDataRepository.findFirstArtworkIdByCardExternalId.mockResolvedValue('artwork-id-1');

    const savedCard = PhysicalCard.create({
      artworkId: 'artwork-id-1',
      condition: 'Played',
      language: 'FR',
    });
    physicalCardRepository.save.mockResolvedValue(savedCard);

    const useCase = new RegisterPhysicalCardUseCase(
      physicalCardRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      externalId: '46986414',
      condition: 'Played',
      language: 'FR',
    });

    expect(result).toMatchObject({
      condition: 'PLAYED',
      language: 'FR',
      isFirstEdition: false,
    });
    expect(result.cardPrintId).toBeNull();
  });

  it('registers a physical card with explicit cardPrintId', async () => {
    cardRelatedDataRepository.findFirstArtworkIdByCardExternalId.mockResolvedValue('artwork-id-1');

    const savedCard = PhysicalCard.create({
      artworkId: 'artwork-id-1',
      cardPrintId: 'print-1',
      condition: 'Mint',
      language: 'EN',
    });
    physicalCardRepository.save.mockResolvedValue(savedCard);

    const useCase = new RegisterPhysicalCardUseCase(
      physicalCardRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    const result = await useCase.execute({
      externalId: '46986414',
      cardPrintId: 'print-1',
      condition: 'Mint',
      language: 'EN',
    });

    expect(result.cardPrintId).toBe('print-1');
  });

  it('throws when no artwork found for the card', async () => {
    cardRelatedDataRepository.findFirstArtworkIdByCardExternalId.mockResolvedValue(null);

    const useCase = new RegisterPhysicalCardUseCase(
      physicalCardRepository,
      cardRelatedDataRepository,
      buildLoggerMock(),
    );

    await expect(
      useCase.execute({
        externalId: '99999999',
        condition: 'Near Mint',
        language: 'EN',
      }),
    ).rejects.toThrow(
      new Error('No artwork found for card with externalId 99999999. Sync the card first.'),
    );

    expect(physicalCardRepository.save).not.toHaveBeenCalled();
  });
});
