import { Provider } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export const ALTERNATIVE_FORMAT_MONGO_CLIENT =
  'ALTERNATIVE_FORMAT_MONGO_CLIENT';
export const ALTERNATIVE_FORMAT_MONGO_DATABASE =
  'ALTERNATIVE_FORMAT_MONGO_DATABASE';

export const alternativeFormatMongoClientProvider: Provider = {
  provide: ALTERNATIVE_FORMAT_MONGO_CLIENT,
  useFactory: async () => {
    const client = new MongoClient(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    );
    await client.connect();
    return client;
  },
};

export const alternativeFormatMongoDatabaseProvider: Provider = {
  provide: ALTERNATIVE_FORMAT_MONGO_DATABASE,
  inject: [ALTERNATIVE_FORMAT_MONGO_CLIENT],
  useFactory: (client: MongoClient) =>
    client.db(process.env.MONGODB_DATABASE ?? 'yugioh-cards'),
};
