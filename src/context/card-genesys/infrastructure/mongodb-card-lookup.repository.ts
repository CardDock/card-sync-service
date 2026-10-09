import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { CardLookupDocument, CardLookupPort } from '../application/ports/card-lookup.port';
import { GENESYS_POINTS_MONGO_DATABASE } from './mongodb.provider';

@Injectable()
export class MongoDbCardLookupRepository implements CardLookupPort {
  constructor(
    @Inject(GENESYS_POINTS_MONGO_DATABASE)
    private readonly database: Db,
  ) {}

  findById(id: number): Promise<CardLookupDocument | null> {
    return this.database.collection<CardLookupDocument>('cards').findOne({ _id: id });
  }
}
