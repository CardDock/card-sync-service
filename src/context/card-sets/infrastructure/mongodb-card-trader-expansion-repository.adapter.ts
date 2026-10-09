import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { CardTraderExpansionRepositoryPort } from '../application/ports/card-trader-expansion-repository.port';
import { CardTraderExpansion } from '../application/ports/card-trader-source.port';
import { CARD_SETS_MONGO_DATABASE } from './mongodb.provider';

type CardTraderExpansionDocument = CardTraderExpansion & { _id: number };

@Injectable()
export class MongoDbCardTraderExpansionRepositoryAdapter implements CardTraderExpansionRepositoryPort {
  constructor(
    @Inject(CARD_SETS_MONGO_DATABASE) private readonly database: Db,
  ) {}

  async findById(id: number): Promise<CardTraderExpansion | null> {
    const document = await this.database
      .collection<CardTraderExpansionDocument>('card_trader_expansions')
      .findOne({ _id: id });

    if (!document) {
      return null;
    }

    return {
      ...document,
      id: document.id ?? document._id,
      game_id: document.game_id ?? 0,
    };
  }

  async saveMany(expansions: CardTraderExpansion[]): Promise<void> {
    if (expansions.length === 0) {
      return;
    }

    const collection = this.database.collection<CardTraderExpansionDocument>(
      'card_trader_expansions',
    );

    const operations = expansions.map((expansion) => ({
      updateOne: {
        filter: { _id: Number(expansion.id) },
        update: {
          $set: {
            ...expansion,
            _id: Number(expansion.id),
            id: Number(expansion.id),
            game_id: Number(expansion.game_id),
            code: String(expansion.code ?? ''),
            name: String(expansion.name ?? ''),
            syncedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await collection.bulkWrite(operations);
  }
}
