import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

describe('CardController Integration (real DB)', () => {
  let app: INestApplication;

  const CARD_ID = '10000';
  const NONEXISTENT_CARD_ID = '99999999';
  const CARD_NAME = 'Ten Thousand Dragon';
  const SPANISH_NAME = 'Dragón Diez Mil';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /cards/:id', () => {
    it('returns 200 with card data for existing card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${CARD_ID}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: CARD_NAME,
        type: 'Effect Monster',
        humanReadableCardType: 'Effect Monster',
        race: 'Dragon',
        attribute: 'DARK',
        atk: null,
        def: null,
        level: 10,
      });
      expect(response.body).not.toHaveProperty('rawData');
    });
  });

  describe('GET /cards/:id with language', () => {
    it('returns 200 with Spanish translation when language=es', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${CARD_ID}?language=es`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: SPANISH_NAME,
      });
    });

    it('returns 200 with English data when language=en', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${CARD_ID}?language=en`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: CARD_NAME,
      });
    });
  });

  describe('GET /cards?name= (search by name)', () => {
    it('returns 200 with English results when no language specified', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards?name=${encodeURIComponent(CARD_NAME)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0]).toHaveProperty('id');
      expect(response.body.items[0]).toHaveProperty('name');
      expect(response.body.items[0]).not.toHaveProperty('rawData');
    });

    it('returns 200 with Spanish translations when language=es', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards?name=${encodeURIComponent(SPANISH_NAME)}&language=es`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      const item = response.body.items.find((item) => item.id === CARD_ID);
      expect(item).toMatchObject({
        id: CARD_ID,
        name: SPANISH_NAME,
      });
    });

    it('returns 200 when language=en', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards?name=${encodeURIComponent(CARD_NAME)}&language=en`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
      });
    });

    it('returns empty items for non-matching name', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards?name=NonExistentCardXYZ')
        .expect(200);

      expect(response.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 0,
      });
    });
  });

  describe('GET /cards (list with filters)', () => {
    it('returns 200 with paginated results when no filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards')
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 20,
      });
      expect(response.body.items.length).toBeLessThanOrEqual(20);
      expect(response.body.items[0]).not.toHaveProperty('rawData');
    });

    it('returns 200 filtered by type and attribute', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/cards?type=${encodeURIComponent('Effect Monster')}&attribute=DARK`,
        )
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      response.body.items.forEach((item) => {
        expect(item.type).toBe('Effect Monster');
        expect(item.attribute).toBe('DARK');
      });
    });

    it('returns 200 filtered by race', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards?race=Dragon')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      response.body.items.forEach((item) => {
        expect(item.race).toBe('Dragon');
      });
    });

    it('returns 200 with paginated results respecting page and limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards?page=1&limit=5')
        .expect(200);

      expect(response.body.items.length).toBeLessThanOrEqual(5);
      expect(response.body.limit).toBe(5);
    });

    it('caps limit at 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards?limit=200')
        .expect(200);

      expect(response.body.limit).toBe(100);
    });
  });

  describe('GET /cards/:id/prints', () => {
    it('returns 200 with prints for a card that has prints', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${CARD_ID}/prints`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        cardSetId: expect.any(String),
        cardSetName: expect.any(String),
        setCode: expect.any(String),
        rarity: expect.any(String),
      });
    });

    it('returns 404 for non-existent card prints', async () => {
      await request(app.getHttpServer())
        .get(`/cards/${NONEXISTENT_CARD_ID}/prints`)
        .expect(404);
    });
  });

  describe('GET /cards/:id/artworks', () => {
    it('returns 200 with artworks for a card that has artworks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${CARD_ID}/artworks`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        imageUrl: expect.stringContaining('ygoprodeck.com'),
      });
    });

    it('returns 404 for non-existent card artworks', async () => {
      await request(app.getHttpServer())
        .get(`/cards/${NONEXISTENT_CARD_ID}/artworks`)
        .expect(404);
    });
  });

  describe('GET /card-sets', () => {
    it('returns 200 with an array of card sets', async () => {
      const response = await request(app.getHttpServer())
        .get('/card-sets')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
      });
    });
  });
});
