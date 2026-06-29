import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

describe('GET /card-sets (e2e)', () => {
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
