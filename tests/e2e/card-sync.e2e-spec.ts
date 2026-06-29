import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

const CARD_ID = '10000';

describe('POST /cards/sync (e2e)', () => {
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

  it('retorna 201 o 404 según exista la carta en YGOPRODeck', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/sync')
      .send({ id: CARD_ID });

    expect([201, 404, 422]).toContain(response.status);

    if (response.status === 201) {
      expect(response.body).toMatchObject({
        id: CARD_ID,
        name: expect.any(String),
      });
    }
  });
});
