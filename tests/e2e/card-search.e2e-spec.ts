import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

const EXISTING_CARD_ID = '46986414';
const EXISTING_CARD_NAME = 'Dark Magician';
const EXISTING_SPANISH_NAME = 'Mago Oscuro';

describe('GET /cards (e2e)', () => {
  let app: INestApplication;

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

  describe('search by name', () => {
    it('returns 200 with English results when searching by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards?name=${encodeURIComponent(EXISTING_CARD_NAME)}`)
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

    it('returns 200 with Spanish translations when language=es (si existen)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards?name=${encodeURIComponent('Mago Oscuro')}&language=es`)
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: expect.any(Number),
      });

      const magoOscuro = response.body.items.find(
        (item) => item.id === EXISTING_CARD_ID,
      );
      if (magoOscuro) {
        expect(magoOscuro).toMatchObject({
          id: EXISTING_CARD_ID,
          name: EXISTING_SPANISH_NAME,
        });
      }
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

  describe('list with filters', () => {
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
          `/cards?type=${encodeURIComponent('Normal Monster')}&attribute=DARK`,
        )
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      response.body.items.forEach((item) => {
        expect(item.type).toBe('Normal Monster');
        expect(item.attribute).toBe('DARK');
      });
    });

    it('returns 200 filtered by race', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards?race=Spellcaster')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      response.body.items.forEach((item) => {
        expect(item.race).toBe('Spellcaster');
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
});
