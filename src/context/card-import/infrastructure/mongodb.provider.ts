import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const MONGO_CLIENT = 'CARD_IMPORT_MONGO_CLIENT';
export const MONGO_DATABASE = 'CARD_IMPORT_MONGO_DATABASE';

export const mongoClientProvider: Provider = {
  provide: MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const mongoDatabaseProvider: Provider = {
  provide: MONGO_DATABASE,
  inject: [MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(process.env.MONGODB_DATABASE ?? 'yugioh-cards'),
};
