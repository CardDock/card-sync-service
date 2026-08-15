import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { API_PREFIX } from '../../src/app/api-prefix';

const CARD_ID = '10000';
const NONEXISTENT_CARD_ID = '10000';

describe('GET /api/v1/cards/:id/prints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 or 404 for prints', async () => {
    const response = await request(app.getHttpServer()).get(
      `/api/v1/cards/${CARD_ID}/prints`,
    );

    expect([200, 404]).toContain(response.status);
  });
});
