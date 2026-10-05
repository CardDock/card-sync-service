import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import {
  CardMarketplacePriceCache,
  CardMarketplacePriceCacheSnapshot,
} from '../domain/card-marketplace-price-cache';
import { CardMarketplacePriceCacheRepositoryPort } from '../application/ports/card-marketplace-price-cache-repository.port';
import { CARD_SETS_MONGO_DATABASE } from './mongodb.provider';

type CardMarketplacePriceCacheDocument = CardMarketplacePriceCacheSnapshot & {
  _id: number;
};

@Injectable()
export class MongoDbCardMarketplacePriceCacheRepositoryAdapter implements CardMarketplacePriceCacheRepositoryPort {
  constructor(
    @Inject(CARD_SETS_MONGO_DATABASE) private readonly database: Db,
  ) {}

  async findByBlueprintId(
    blueprintId: number,
  ): Promise<CardMarketplacePriceCache | null> {
    const document = await this.database
      .collection<CardMarketplacePriceCacheDocument>(
        'card_marketplace_prices_cache',
      )
      .findOne({ _id: blueprintId });
    if (!document) return null;

    return CardMarketplacePriceCache.create({
      blueprintId: document.blueprintId,
      response: document.response,
      cachedAt: new Date(document.cachedAt),
    });
  }

  async save(cache: CardMarketplacePriceCache): Promise<void> {
    const snapshot = cache.snapshot();
    await this.database
      .collection<CardMarketplacePriceCacheDocument>(
        'card_marketplace_prices_cache',
      )
      .updateOne(
        { _id: snapshot.blueprintId },
        { $set: snapshot },
        { upsert: true },
      );
  }
}
