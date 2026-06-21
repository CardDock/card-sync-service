import { NotFoundException } from '@nestjs/common';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import { CardController } from '../../../../../context/card/infrastructure/http/card.controller';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../../../../../context/card/application/use-cases/search-card-by-name.use-case';
import { ListCardsUseCase } from '../../../../../context/card/application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from '../../../../../context/card/application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from '../../../../../context/card/application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from '../../../../../context/card/application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from '../../../../../context/card/application/use-cases/sync-card.use-case';
import { Card } from '../../../../../context/card/domain/entities/card.entity';
import { PaginatedResult } from '../../../../../context/card/domain/ports/card-query-repository.port';
import type { CardPrimitives } from '../../../../../context/card/domain/types/card.types';

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

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

  const buildUseCaseMocks = () => ({
    findOrSync: buildUseCaseMock(),
    search: buildSearchUseCaseMock(),
    listCards: { execute: jest.fn() },
    getPrints: { execute: jest.fn() },
    getArtworks: { execute: jest.fn() },
    listSets: { execute: jest.fn() },
    syncCard: { execute: jest.fn() },
  });

  const createController = (
    mocks: ReturnType<typeof buildUseCaseMocks>,
  ) =>
    new CardController(
      mocks.findOrSync as unknown as FindOrSyncCardByExternalIdUseCase,
      mocks.search as unknown as SearchCardByNameUseCase,
      mocks.listCards as unknown as ListCardsUseCase,
      mocks.getPrints as unknown as GetCardPrintsUseCase,
      mocks.getArtworks as unknown as GetCardArtworksUseCase,
      mocks.listSets as unknown as ListCardSetsUseCase,
      mocks.syncCard as unknown as SyncCardUseCase,
      buildLoggerMock(),
    );

  it('returns card primitives when externalId 23771716 exists', async () => {
    const card = buildCard();
    const mocks = buildUseCaseMocks();
    mocks.findOrSync.execute.mockResolvedValue(card);

    const controller = createController(mocks);

    const result = await controller.findByExternalId(requestedExternalId);

    expect(mocks.findOrSync.execute).toHaveBeenCalledTimes(1);
    expect(mocks.findOrSync.execute).toHaveBeenCalledWith({
      externalId: requestedExternalId,
    });
    expect(result).toMatchObject({
      externalId: requestedExternalId,
      name: 'Elemental HERO Neos',
    });
  });

  it('throws NotFoundException when card does not exist', async () => {
    const mocks = buildUseCaseMocks();
    mocks.findOrSync.execute.mockResolvedValue(null);

    const controller = createController(mocks);

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
    const mocks = buildUseCaseMocks();
    mocks.findOrSync.execute.mockResolvedValue(card);

    const controller = createController(mocks);

    await controller.findByExternalId('23771716');

    expect(mocks.findOrSync.execute).toHaveBeenLastCalledWith({
      externalId: '23771716',
    });
  });

  it('returns cards when searching by name via listCards', async () => {
    const card = buildCard();
    const mocks = buildUseCaseMocks();
    mocks.search.execute.mockResolvedValue([card]);

    const controller = createController(mocks);

    const result = await controller.listCards(
      'Neos', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      1, 20,
    );

    expect(mocks.search.execute).toHaveBeenCalledWith({
      name: 'Neos',
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      externalId: '23771716',
      name: 'Elemental HERO Neos',
    });
  });

  it('returns empty array when search yields no results', async () => {
    const mocks = buildUseCaseMocks();
    mocks.search.execute.mockResolvedValue([]);

    const controller = createController(mocks);

    const result = await controller.listCards(
      'UnknownCardXYZ', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      1, 20,
    );

    expect(result.items).toEqual([]);
  });

  it('returns paginated list when no name filter is provided', async () => {
    const card = buildCard();
    const mocks = buildUseCaseMocks();
    const paginatedResult: PaginatedResult<Card> = {
      items: [card],
      total: 1,
      page: 1,
      limit: 20,
    };
    mocks.listCards.execute.mockResolvedValue(paginatedResult);

    const controller = createController(mocks);

    const result = await controller.listCards(
      undefined, 'Normal Monster', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      1, 20,
    );

    expect(mocks.listCards.execute).toHaveBeenCalledWith({
      filters: {
        name: undefined,
        type: 'Normal Monster',
        race: undefined,
        attribute: undefined,
        frameType: undefined,
        atkMin: undefined,
        atkMax: undefined,
        defMin: undefined,
        defMax: undefined,
        level: undefined,
        linkval: undefined,
      },
      page: 1,
      limit: 20,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('returns prints for a card', async () => {
    const mocks = buildUseCaseMocks();
    const prints = [{ externalId: '23771716', setId: 'set-1', rarity: 'Ultra Rare', rarityCode: 'UR', setCode: 'CT1-EN001', setPrice: '2.50' }];
    mocks.getPrints.execute.mockResolvedValue(prints);

    const controller = createController(mocks);

    const result = await controller.getCardPrints('23771716');

    expect(mocks.getPrints.execute).toHaveBeenCalledWith({ externalId: '23771716' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ externalId: '23771716' });
  });

  it('throws NotFoundException when card has no prints', async () => {
    const mocks = buildUseCaseMocks();
    mocks.getPrints.execute.mockResolvedValue([]);

    const controller = createController(mocks);

    let raisedError: unknown;

    try {
      await controller.getCardPrints('23771716');
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      'No prints found for card with externalId 23771716',
    );
  });

  it('returns artworks for a card', async () => {
    const mocks = buildUseCaseMocks();
    const artworks = [{ externalId: '23771716', imageUrl: 'https://example.com/artwork.png' }];
    mocks.getArtworks.execute.mockResolvedValue(artworks);

    const controller = createController(mocks);

    const result = await controller.getCardArtworks('23771716');

    expect(mocks.getArtworks.execute).toHaveBeenCalledWith({ externalId: '23771716' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ externalId: '23771716' });
  });

  it('throws NotFoundException when card has no artworks', async () => {
    const mocks = buildUseCaseMocks();
    mocks.getArtworks.execute.mockResolvedValue([]);

    const controller = createController(mocks);

    let raisedError: unknown;

    try {
      await controller.getCardArtworks('23771716');
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      'No artworks found for card with externalId 23771716',
    );
  });

  it('returns card sets', async () => {
    const mocks = buildUseCaseMocks();
    const sets = [{ setName: 'Starter Deck', setCode: 'YSD-001' }];
    mocks.listSets.execute.mockResolvedValue(sets);

    const controller = createController(mocks);

    const result = await controller.listCardSets();

    expect(mocks.listSets.execute).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ setName: 'Starter Deck' });
  });

  it('syncs a card from YGOPRODeck', async () => {
    const card = buildCard();
    const mocks = buildUseCaseMocks();
    mocks.syncCard.execute.mockResolvedValue(card);

    const controller = createController(mocks);

    const result = await controller.syncCard({ externalId: '23771716' });

    expect(mocks.syncCard.execute).toHaveBeenCalledWith({ externalId: '23771716' });
    expect(result).toMatchObject({
      externalId: '23771716',
      name: 'Elemental HERO Neos',
    });
  });

  it('throws NotFoundException when synced card not found in YGOPRODeck', async () => {
    const mocks = buildUseCaseMocks();
    mocks.syncCard.execute.mockResolvedValue(null);

    const controller = createController(mocks);

    let raisedError: unknown;

    try {
      await controller.syncCard({ externalId: '99999999' });
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      'Card with externalId 99999999 was not found in YGOPRODeck API',
    );
  });

  it('caps limit at 100 when no name filter', async () => {
    const mocks = buildUseCaseMocks();
    mocks.listCards.execute.mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });

    const controller = createController(mocks);

    await controller.listCards(
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      1, 200,
    );

    expect(mocks.listCards.execute).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('returns empty cards list when no name filter and listCards returns empty', async () => {
    const mocks = buildUseCaseMocks();
    mocks.listCards.execute.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

    const controller = createController(mocks);

    const result = await controller.listCards(
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      1, 20,
    );

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
