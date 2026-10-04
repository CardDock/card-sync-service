import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { CardSetCache, CardSetCacheSnapshot } from '../domain/card-set-cache';
import { CardSetCacheRepositoryPort } from '../application/ports/card-set-cache-repository.port';
import { CARD_SETS_MONGO_DATABASE } from './mongodb.provider';

type CardSetCacheDocument = CardSetCacheSnapshot & { _id: number };

@Injectable()
export class MongoDbCardSetCacheRepositoryAdapter implements CardSetCacheRepositoryPort {
  constructor(
    @Inject(CARD_SETS_MONGO_DATABASE) private readonly database: Db,
  ) {}

  async findByCardId(cardId: number): Promise<CardSetCache | null> {
    const document = await this.database
      .collection<CardSetCacheDocument>('card_sets_cache')
      .findOne({ _id: cardId });
    if (!document) return null;

    return CardSetCache.create({
      cardId: document.cardId,
      cardName: document.cardName,
      response: document.response,
      cachedAt: new Date(document.cachedAt),
    });
  }

  async save(cache: CardSetCache): Promise<void> {
    const snapshot = cache.snapshot();
    await this.database
      .collection<CardSetCacheDocument>('card_sets_cache')
      .updateOne(
        { _id: snapshot.cardId },
        { $set: snapshot },
        { upsert: true },
      );
  }
}
