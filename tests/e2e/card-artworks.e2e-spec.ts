import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

const CARD_ID = '10000';

describe('GET /cards/:id/artworks (e2e)', () => {
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

  it('returns 200 or 404 for artworks', async () => {
    const response = await request(app.getHttpServer()).get(
      `/cards/${CARD_ID}/artworks`,
    );

    expect([200, 404]).toContain(response.status);
  });
});
