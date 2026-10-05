import { CardMarketplacePriceCache } from '../../domain/card-marketplace-price-cache';

export abstract class CardMarketplacePriceCacheRepositoryPort {
  abstract findByBlueprintId(
    blueprintId: number,
  ): Promise<CardMarketplacePriceCache | null>;
  abstract save(cache: CardMarketplacePriceCache): Promise<void>;
}
