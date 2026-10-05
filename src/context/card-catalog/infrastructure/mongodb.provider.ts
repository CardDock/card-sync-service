import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const CARD_CATALOG_MONGO_CLIENT = 'CARD_CATALOG_MONGO_CLIENT';
export const CARD_CATALOG_MONGO_DATABASE = 'CARD_CATALOG_MONGO_DATABASE';

export const cardCatalogMongoClientProvider: Provider = {
  provide: CARD_CATALOG_MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const cardCatalogMongoDatabaseProvider: Provider = {
  provide: CARD_CATALOG_MONGO_DATABASE,
  inject: [CARD_CATALOG_MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(process.env.MONGODB_DATABASE ?? 'yugioh-cards'),
};
