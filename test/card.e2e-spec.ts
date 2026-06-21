import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { FindOrSyncCardByExternalIdUseCase } from '../src/context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../src/context/card/application/use-cases/search-card-by-name.use-case';
import { ListCardsUseCase } from '../src/context/card/application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from '../src/context/card/application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from '../src/context/card/application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from '../src/context/card/application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from '../src/context/card/application/use-cases/sync-card.use-case';
import { Card } from '../src/context/card/domain/entities/card.entity';
import { CardDomainValidationError } from '../src/context/card/domain/errors';

describe('CardController (e2e)', () => {
  let app: INestApplication;

  const mockFindOrSync = { execute: jest.fn() };
  const mockSearchByName = { execute: jest.fn() };
  const mockListCards = { execute: jest.fn() };
  const mockGetCardPrints = { execute: jest.fn() };
  const mockGetCardArtworks = { execute: jest.fn() };
  const mockListCardSets = { execute: jest.fn() };
  const mockSyncCard = { execute: jest.fn() };

  const darkMagician = Card.create({
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
    rawData: {},
  });

  const blueEyes = Card.create({
    externalId: '89631139',
    name: 'Blue-Eyes White Dragon',
    typeline: ['Dragon', 'Normal'],
    type: 'Normal Monster',
    humanReadableCardType: 'Normal Monster',
    frameType: 'normal',
    desc: 'This legendary dragon is a powerful engine of destruction.',
    race: 'Dragon',
    atk: 3000,
    def: 2500,
    level: 8,
    scale: null,
    linkval: null,
    linkmarkers: [],
    attribute: 'LIGHT',
    rawData: {},
  });

  beforeAll(async () => {
    process.env.DIRECT_URL = 'postgres://localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FindOrSyncCardByExternalIdUseCase)
      .useValue(mockFindOrSync)
      .overrideProvider(SearchCardByNameUseCase)
      .useValue(mockSearchByName)
      .overrideProvider(ListCardsUseCase)
      .useValue(mockListCards)
      .overrideProvider(GetCardPrintsUseCase)
      .useValue(mockGetCardPrints)
      .overrideProvider(GetCardArtworksUseCase)
      .useValue(mockGetCardArtworks)
      .overrideProvider(ListCardSetsUseCase)
      .useValue(mockListCardSets)
      .overrideProvider(SyncCardUseCase)
      .useValue(mockSyncCard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /cards/:externalId', () => {
    it('returns card when found', async () => {
      mockFindOrSync.execute.mockResolvedValue(darkMagician);

      const response = await request(app.getHttpServer())
        .get('/cards/46986414')
        .expect(200);

      expect(response.body).toMatchObject({
        externalId: '46986414',
        name: 'Dark Magician',
        atk: 2500,
        def: 2100,
        level: 7,
        race: 'Spellcaster',
        attribute: 'DARK',
      });
    });

    it('returns 404 when card not found', async () => {
      mockFindOrSync.execute.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/cards/99999999')
        .expect(404);
    });

    it('returns 422 when use case throws DomainError', async () => {
      mockFindOrSync.execute.mockRejectedValue(
        new CardDomainValidationError({
          field: 'externalId',
          message: 'Invalid external ID',
        }),
      );

      await request(app.getHttpServer())
        .get('/cards/invalid')
        .expect(422);
    });
  });

  describe('GET /cards', () => {
    it('searches by name when name query param is present', async () => {
      mockSearchByName.execute.mockResolvedValue([darkMagician, blueEyes]);

      const response = await request(app.getHttpServer())
        .get('/cards?name=Magician')
        .expect(200);

      expect(response.body).toMatchObject({
        total: 2,
        page: 1,
        limit: 2,
      });
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].name).toBe('Dark Magician');
    });

    it('returns empty results when name search finds nothing', async () => {
      mockSearchByName.execute.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/cards?name=NonExistentCard')
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 0,
      });
    });

    it('uses listCardsUseCase when no name param', async () => {
      mockListCards.execute.mockResolvedValue({
        items: [darkMagician],
        total: 1,
        page: 1,
        limit: 20,
      });

      const response = await request(app.getHttpServer())
        .get('/cards?type=Normal+Monster')
        .expect(200);

      expect(response.body).toMatchObject({
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(response.body.items[0].externalId).toBe('46986414');
      expect(mockSearchByName.execute).not.toHaveBeenCalled();
    });

    it('returns paginated results with filters', async () => {
      mockListCards.execute.mockResolvedValue({
        items: [darkMagician, blueEyes],
        total: 2,
        page: 1,
        limit: 10,
      });

      const response = await request(app.getHttpServer())
        .get('/cards?race=Spellcaster&attribute=DARK&page=1&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(response.body.items).toHaveLength(2);
    });

    it('caps limit at 100', async () => {
      mockListCards.execute.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 100,
      });

      await request(app.getHttpServer())
        .get('/cards?limit=200')
        .expect(200);

      expect(mockListCards.execute).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });

  describe('GET /cards/:externalId/prints', () => {
    const samplePrints = [
      {
        id: 'print-1',
        cardSetId: 'set-1',
        cardSetName: 'Legend of Blue Eyes White Dragon',
        cardSetCode: 'LOB',
        setCode: 'LOB-000',
        rarity: 'Ultra Rare',
        rarityCode: 'ur',
        setPrice: 12.5,
      },
    ];

    it('returns prints when found', async () => {
      mockGetCardPrints.execute.mockResolvedValue(samplePrints);

      const response = await request(app.getHttpServer())
        .get('/cards/46986414/prints')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        cardSetName: 'Legend of Blue Eyes White Dragon',
        setCode: 'LOB-000',
      });
    });

    it('returns 404 when no prints', async () => {
      mockGetCardPrints.execute.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/cards/99999999/prints')
        .expect(404);
    });
  });

  describe('GET /cards/:externalId/artworks', () => {
    const sampleArtworks = [
      {
        id: 'art-1',
        imageUrl:
          'https://images.ygoprodeck.com/images/cards/46986414.jpg',
      },
    ];

    it('returns artworks when found', async () => {
      mockGetCardArtworks.execute.mockResolvedValue(sampleArtworks);

      const response = await request(app.getHttpServer())
        .get('/cards/46986414/artworks')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].imageUrl).toContain('46986414.jpg');
    });

    it('returns 404 when no artworks', async () => {
      mockGetCardArtworks.execute.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/cards/99999999/artworks')
        .expect(404);
    });
  });

  describe('GET /card-sets', () => {
    const sampleSets = [
      { id: 'set-1', name: 'Legend of Blue Eyes White Dragon', code: 'LOB' },
    ];

    it('returns all card sets', async () => {
      mockListCardSets.execute.mockResolvedValue(sampleSets);

      const response = await request(app.getHttpServer())
        .get('/card-sets')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Legend of Blue Eyes White Dragon');
    });
  });

  describe('POST /cards/sync', () => {
    it('syncs a card successfully', async () => {
      mockSyncCard.execute.mockResolvedValue(darkMagician);

      const response = await request(app.getHttpServer())
        .post('/cards/sync')
        .send({ externalId: '46986414' })
        .expect(201);

      expect(response.body).toMatchObject({
        externalId: '46986414',
        name: 'Dark Magician',
      });
    });

    it('returns 404 when card not found in YGOPRODeck', async () => {
      mockSyncCard.execute.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/cards/sync')
        .send({ externalId: '99999999' })
        .expect(404);
    });
  });
});
