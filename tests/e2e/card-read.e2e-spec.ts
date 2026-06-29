import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

const CARD_ID = '10000';

describe('GET /cards/:id (e2e)', () => {
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

  const expectCardData = (res: request.Response) => {
    expect(res.body).toMatchObject({
      id: CARD_ID,
      name: expect.any(String),
      type: expect.any(String),
      race: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('rawData');
  };

  const expectDomainError = (res: request.Response) => {
    expect(res.body).toMatchObject({
      statusCode: 422,
      error: 'DomainError',
      code: 'CARD_PROCESS_ERROR',
    });
  };

  it('obtiene 200 si la carta está en caché, o 422 si YGOPRODeck devuelve datos inválidos (atk=-1)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/cards/${CARD_ID}`);

    expect([200, 422]).toContain(response.status);

    if (response.status === 200) {
      expectCardData(response);
    } else {
      expectDomainError(response);
    }
  });

  it('obtiene 200 o 422 con language=es', async () => {
    const response = await request(app.getHttpServer())
      .get(`/cards/${CARD_ID}?language=es`);

    expect([200, 422]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: expect.any(String),
      });
    } else {
      expectDomainError(response);
    }
  });

  it('obtiene 200 o 422 con language=en', async () => {
    const response = await request(app.getHttpServer())
      .get(`/cards/${CARD_ID}?language=en`);

    expect([200, 422]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: expect.any(String),
      });
    } else {
      expectDomainError(response);
    }
  });
});
