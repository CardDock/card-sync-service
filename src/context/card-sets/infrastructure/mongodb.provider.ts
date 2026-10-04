import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const CARD_SETS_MONGO_CLIENT = 'CARD_SETS_MONGO_CLIENT';
export const CARD_SETS_MONGO_DATABASE = 'CARD_SETS_MONGO_DATABASE';

export const cardSetsMongoClientProvider: Provider = {
  provide: CARD_SETS_MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.CARD_SETS_MONGODB_URI ??
        process.env.MONGODB_URI ??
        'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const cardSetsMongoDatabaseProvider: Provider = {
  provide: CARD_SETS_MONGO_DATABASE,
  inject: [CARD_SETS_MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(
      process.env.CARD_SETS_MONGODB_DATABASE ??
        process.env.MONGODB_DATABASE ??
        'yugioh-cards',
    ),
};
