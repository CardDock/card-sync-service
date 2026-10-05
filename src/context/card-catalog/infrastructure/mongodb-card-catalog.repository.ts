import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { CardCatalogReaderPort } from '../application/ports/card-catalog-reader.port';
import { CardCatalogDocument } from '../domain/card-catalog-document';
import { CARD_CATALOG_MONGO_DATABASE } from './mongodb.provider';

@Injectable()
export class MongoDbCardCatalogRepository implements CardCatalogReaderPort {
  constructor(
    @Inject(CARD_CATALOG_MONGO_DATABASE) private readonly database: Db,
  ) {}

  findById(id: number): Promise<CardCatalogDocument | null> {
    return this.database
      .collection<CardCatalogDocument>('cards')
      .findOne({ _id: id });
  }
}
