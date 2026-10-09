import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const FORBIDDEN_CARDS_MONGO_CLIENT = 'FORBIDDEN_CARDS_MONGO_CLIENT';
export const FORBIDDEN_CARDS_MONGO_DATABASE = 'FORBIDDEN_CARDS_MONGO_DATABASE';

export const forbiddenCardsMongoClientProvider: Provider = {
  provide: FORBIDDEN_CARDS_MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const forbiddenCardsMongoDatabaseProvider: Provider = {
  provide: FORBIDDEN_CARDS_MONGO_DATABASE,
  inject: [FORBIDDEN_CARDS_MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(process.env.MONGODB_DATABASE ?? 'yugioh-cards'),
};
