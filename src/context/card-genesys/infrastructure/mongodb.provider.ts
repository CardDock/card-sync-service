import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const GENESYS_POINTS_MONGO_CLIENT = 'GENESYS_POINTS_MONGO_CLIENT';
export const GENESYS_POINTS_MONGO_DATABASE =
  'GENESYS_POINTS_MONGO_DATABASE';

export const cardGenesysMongoClientProvider: Provider = {
  provide: GENESYS_POINTS_MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const cardGenesysMongoDatabaseProvider: Provider = {
  provide: GENESYS_POINTS_MONGO_DATABASE,
  inject: [GENESYS_POINTS_MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(process.env.MONGODB_DATABASE ?? 'yugioh-cards'),
};
