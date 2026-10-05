import {
  CardTraderUnavailableError,
  InvalidBlueprintIdError,
} from '../errors/card-sets.errors';
import { CardMarketplacePriceCacheRepositoryPort } from '../ports/card-marketplace-price-cache-repository.port';
import { CardTraderMarketplaceSourcePort } from '../ports/card-trader-marketplace-source.port';
import { CardMarketplacePriceCache } from '../../domain/card-marketplace-price-cache';

export type CardMarketplacePricesResult = {
  blueprintId: number;
  cachedAt: Date;
  data: unknown;
};

export class GetCardMarketplacePricesUseCase {
  constructor(
    private readonly cacheRepository: CardMarketplacePriceCacheRepositoryPort,
    private readonly cardTrader: CardTraderMarketplaceSourcePort,
    private readonly cacheTtlMs = 24 * 60 * 60 * 1000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    rawBlueprintId: string | number,
  ): Promise<CardMarketplacePricesResult> {
    const blueprintId = this.parseBlueprintId(rawBlueprintId);
    const cached = await this.cacheRepository.findByBlueprintId(blueprintId);
    const currentTime = this.now();

    if (cached?.isFresh(currentTime, this.cacheTtlMs)) {
      return this.toResult(cached.snapshot());
    }

    let response: unknown;
    try {
      response = await this.cardTrader.findMarketplaceProducts(blueprintId);
    } catch (error) {
      if (cached && error instanceof CardTraderUnavailableError) {
        return this.toResult(cached.snapshot());
      }
      throw error;
    }

    const updated = CardMarketplacePriceCache.create({
      blueprintId,
      response,
      cachedAt: currentTime,
    });
    await this.cacheRepository.save(updated);
    return this.toResult(updated.snapshot());
  }

  private parseBlueprintId(rawBlueprintId: string | number): number {
    const blueprintId =
      typeof rawBlueprintId === 'number'
        ? rawBlueprintId
        : rawBlueprintId.trim() === ''
          ? Number.NaN
          : Number(rawBlueprintId);
    if (!Number.isInteger(blueprintId) || blueprintId <= 0) {
      throw new InvalidBlueprintIdError();
    }
    return blueprintId;
  }

  private toResult(
    snapshot: ReturnType<CardMarketplacePriceCache['snapshot']>,
  ): CardMarketplacePricesResult {
    return {
      blueprintId: snapshot.blueprintId,
      cachedAt: snapshot.cachedAt,
      data: snapshot.response,
    };
  }
}
