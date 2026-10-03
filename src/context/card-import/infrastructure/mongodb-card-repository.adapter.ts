import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { CardRepositoryPort } from '../application/ports/card-repository.port';
import { ImportableCard } from '../application/ports/card-import-source.port';
import { MONGO_DATABASE } from './mongodb.provider';

type CardDocument = ImportableCard & { _id: number };

@Injectable()
export class MongoDbCardRepositoryAdapter implements CardRepositoryPort {
  constructor(@Inject(MONGO_DATABASE) private readonly database: Db) {}

  async upsertMany(cards: ImportableCard[]) {
    const result = await this.database
      .collection<CardDocument>('cards')
      .bulkWrite(
        cards.map((card) => ({
          updateOne: {
            filter: { _id: card.id },
            update: { $set: card },
            upsert: true,
          },
        })),
        { ordered: false },
      );

    return {
      succeeded:
        result.upsertedCount + result.modifiedCount + result.matchedCount,
      failed: 0,
    };
  }
}
