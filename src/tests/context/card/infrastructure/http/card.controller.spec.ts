import { NotFoundException } from '@nestjs/common';
import { CardController } from '../../../../../context/card/infrastructure/http/card.controller';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../../../../../context/card/application/use-cases/search-card-by-name.use-case';
import { RegisterPhysicalCardUseCase } from '../../../../../context/card/application/use-cases/register-physical-card.use-case';
import { Card } from '../../../../../context/card/domain/entities/card.entity';

describe('CardController', () => {
  const requestedExternalId = '23771716';

  const buildCard = (): Card =>
    Card.create({
      id: 'f00df00d-4a6b-4f2a-9cb9-ccf33a71f0f1',
      externalId: requestedExternalId,
      name: 'Elemental HERO Neos',
      typeline: ['Warrior', 'Normal'],
      type: 'Normal Monster',
      humanReadableCardType: 'Normal Monster',
      frameType: 'normal',
      desc: 'A hero from another world.',
      race: 'Warrior',
      atk: 2500,
      def: 2000,
      level: 7,
      scale: null,
      linkval: null,
      linkmarkers: [],
      attribute: 'LIGHT',
      rawData: {
        id: 23771716,
        name: 'Elemental HERO Neos',
      },
    });

  const buildUseCaseMock = () => ({
    execute: jest.fn(),
  });

  const buildSearchUseCaseMock = () => ({
    execute: jest.fn(),
  });

  const buildPhysicalCardUseCaseMock = () => ({
    execute: jest.fn(),
  });

  it('returns card primitives when externalId 23771716 exists', async () => {
    const card = buildCard();
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(card);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
      buildSearchUseCaseMock() as unknown as SearchCardByNameUseCase,
      buildPhysicalCardUseCaseMock() as unknown as RegisterPhysicalCardUseCase,
    );

    const result = await controller.findByExternalId(requestedExternalId);

    expect(useCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(useCaseMock.execute).toHaveBeenCalledWith({
      externalId: requestedExternalId,
    });
    expect(result).toMatchObject({
      externalId: requestedExternalId,
      name: 'Elemental HERO Neos',
    });
  });

  it('throws NotFoundException when card does not exist', async () => {
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(null);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
      buildSearchUseCaseMock() as unknown as SearchCardByNameUseCase,
      buildPhysicalCardUseCaseMock() as unknown as RegisterPhysicalCardUseCase,
    );

    let raisedError: unknown;

    try {
      await controller.findByExternalId(requestedExternalId);
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      `Card with externalId ${requestedExternalId} was not found`,
    );
  });

  it('forwards the route param externalId to the use case unchanged', async () => {
    const card = buildCard();
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(card);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
      buildSearchUseCaseMock() as unknown as SearchCardByNameUseCase,
      buildPhysicalCardUseCaseMock() as unknown as RegisterPhysicalCardUseCase,
    );

    await controller.findByExternalId('23771716');

    expect(useCaseMock.execute).toHaveBeenLastCalledWith({
      externalId: '23771716',
    });
  });

  it('returns cards when searching by name', async () => {
    const card = buildCard();
    const searchUseCaseMock = buildSearchUseCaseMock();
    searchUseCaseMock.execute.mockResolvedValue([card]);

    const controller = new CardController(
      buildUseCaseMock() as unknown as FindOrSyncCardByExternalIdUseCase,
      searchUseCaseMock as unknown as SearchCardByNameUseCase,
      buildPhysicalCardUseCaseMock() as unknown as RegisterPhysicalCardUseCase,
    );

    const result = await controller.searchByName('Neos');

    expect(searchUseCaseMock.execute).toHaveBeenCalledWith({
      name: 'Neos',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      externalId: '23771716',
      name: 'Elemental HERO Neos',
    });
  });

  it('returns empty array when search yields no results', async () => {
    const searchUseCaseMock = buildSearchUseCaseMock();
    searchUseCaseMock.execute.mockResolvedValue([]);

    const controller = new CardController(
      buildUseCaseMock() as unknown as FindOrSyncCardByExternalIdUseCase,
      searchUseCaseMock as unknown as SearchCardByNameUseCase,
      buildPhysicalCardUseCaseMock() as unknown as RegisterPhysicalCardUseCase,
    );

    const result = await controller.searchByName('UnknownCardXYZ');

    expect(result).toEqual([]);
  });

  it('registers a physical card', async () => {
    const useCaseMock = buildPhysicalCardUseCaseMock();
    useCaseMock.execute.mockResolvedValue({
      id: 'phys-id-1',
      artworkId: 'artwork-id-1',
      cardPrintId: null,
      condition: 'NEAR_MINT',
      language: 'EN',
      isFirstEdition: true,
    });

    const controller = new CardController(
      buildUseCaseMock() as unknown as FindOrSyncCardByExternalIdUseCase,
      buildSearchUseCaseMock() as unknown as SearchCardByNameUseCase,
      useCaseMock as unknown as RegisterPhysicalCardUseCase,
    );

    const result = await controller.registerPhysicalCard({
      externalId: '46986414',
      condition: 'NEAR_MINT',
      language: 'EN',
      isFirstEdition: true,
    });

    expect(useCaseMock.execute).toHaveBeenCalledWith({
      externalId: '46986414',
      cardPrintId: undefined,
      condition: 'NEAR_MINT',
      language: 'EN',
      isFirstEdition: true,
    });
    expect(result).toMatchObject({
      id: 'phys-id-1',
      condition: 'NEAR_MINT',
    });
  });
});
