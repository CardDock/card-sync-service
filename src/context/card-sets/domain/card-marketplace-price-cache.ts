export type CardMarketplacePriceCacheSnapshot = {
  blueprintId: number;
  response: unknown;
  cachedAt: Date;
};

export class CardMarketplacePriceCache {
  private constructor(
    private readonly state: CardMarketplacePriceCacheSnapshot,
  ) {}

  static create(
    state: CardMarketplacePriceCacheSnapshot,
  ): CardMarketplacePriceCache {
    if (!Number.isInteger(state.blueprintId) || state.blueprintId <= 0) {
      throw new Error(
        'Marketplace price cache requires a positive blueprint id',
      );
    }
    if (
      !(state.cachedAt instanceof Date) ||
      Number.isNaN(state.cachedAt.valueOf())
    ) {
      throw new Error('Marketplace price cache requires a valid cache date');
    }

    return new CardMarketplacePriceCache({ ...state });
  }

  isFresh(now: Date, ttlMs: number): boolean {
    return (
      ttlMs > 0 &&
      now.valueOf() - this.state.cachedAt.valueOf() < ttlMs &&
      now.valueOf() >= this.state.cachedAt.valueOf()
    );
  }

  snapshot(): CardMarketplacePriceCacheSnapshot {
    return { ...this.state };
  }
}
