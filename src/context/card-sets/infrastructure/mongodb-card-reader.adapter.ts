import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import {
  CardReaderPort,
  ImportedCard,
} from '../application/ports/card-reader.port';
import { CARD_SETS_MONGO_DATABASE } from './mongodb.provider';

type CardDocument = {
  _id: number;
  id?: number;
  name?: string;
};

@Injectable()
export class MongoDbCardReaderAdapter implements CardReaderPort {
  constructor(
    @Inject(CARD_SETS_MONGO_DATABASE) private readonly database: Db,
  ) {}

  async findById(cardId: number): Promise<ImportedCard | null> {
    const document = await this.database
      .collection<CardDocument>('cards')
      .findOne({ _id: cardId }, { projection: { _id: 1, id: 1, name: 1 } });

    if (!document?.name) return null;
    return {
      id: document.id ?? document._id,
      name: document.name,
    };
  }
}
