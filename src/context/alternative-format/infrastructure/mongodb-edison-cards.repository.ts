import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import {
  EdisonCardDocument,
  EdisonCardsRepositoryPort,
} from '../application/ports/edison-cards-repository.port';
import { ALTERNATIVE_FORMAT_MONGO_DATABASE } from './mongodb.provider';

@Injectable()
export class MongoDbEdisonCardsRepository implements EdisonCardsRepositoryPort {
  constructor(
    @Inject(ALTERNATIVE_FORMAT_MONGO_DATABASE)
    private readonly database: Db,
  ) {}

  async replaceAll(cardIds: string[]): Promise<void> {
    const syncedAt = new Date();
    const collection =
      this.database.collection<EdisonCardDocument>('edison_cards');

    await collection.deleteMany({});

    if (cardIds.length > 0) {
      await collection.insertMany(
        cardIds.map((cardId) => ({
          _id: cardId,
          cardId,
          syncedAt,
        })),
      );
    }
  }

  async exists(cardId: string): Promise<boolean> {
    const document = await this.database
      .collection<EdisonCardDocument>('edison_cards')
      .findOne(
        {
          $or: [{ _id: cardId }, { cardId }],
        },
        { projection: { _id: 1 } },
      );

    return document !== null;
  }
}
