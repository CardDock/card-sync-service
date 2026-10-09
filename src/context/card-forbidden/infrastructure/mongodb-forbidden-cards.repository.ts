import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import {
  ForbiddenCardsDocument,
  ForbiddenCardsRepositoryPort,
} from '../application/ports/forbidden-cards-repository.port';
import { FORBIDDEN_CARDS_MONGO_DATABASE } from './mongodb.provider';

@Injectable()
export class MongoDbForbiddenCardsRepository implements ForbiddenCardsRepositoryPort {
  constructor(
    @Inject(FORBIDDEN_CARDS_MONGO_DATABASE)
    private readonly database: Db,
  ) {}

  async upsertCurrent(
    date: string,
    regulation: Record<string, number>,
  ): Promise<ForbiddenCardsDocument> {
    const document: ForbiddenCardsDocument = {
      _id: 'current',
      date,
      regulation,
      syncedAt: new Date(),
    };

    await this.database
      .collection<ForbiddenCardsDocument>('forbidden_cards')
      .replaceOne({ _id: 'current' }, document, { upsert: true });

    return document;
  }

  findCurrent(): Promise<ForbiddenCardsDocument | null> {
    return this.database
      .collection<ForbiddenCardsDocument>('forbidden_cards')
      .findOne({ _id: 'current' });
  }
}
