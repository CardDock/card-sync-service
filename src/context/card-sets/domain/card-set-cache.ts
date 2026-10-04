export type CardSetCacheSnapshot = {
  cardId: number;
  cardName: string;
  response: unknown;
  cachedAt: Date;
};

export class CardSetCache {
  private constructor(private readonly state: CardSetCacheSnapshot) {}

  static create(state: CardSetCacheSnapshot): CardSetCache {
    if (!Number.isInteger(state.cardId) || state.cardId <= 0) {
      throw new Error('Card set cache requires a positive card id');
    }
    if (!state.cardName.trim()) {
      throw new Error('Card set cache requires a card name');
    }
    if (
      !(state.cachedAt instanceof Date) ||
      Number.isNaN(state.cachedAt.valueOf())
    ) {
      throw new Error('Card set cache requires a valid cache date');
    }

    return new CardSetCache({
      ...state,
      cardName: state.cardName.trim(),
    });
  }

  isFresh(now: Date, ttlMs: number): boolean {
    return (
      ttlMs > 0 &&
      now.valueOf() - this.state.cachedAt.valueOf() < ttlMs &&
      now.valueOf() >= this.state.cachedAt.valueOf()
    );
  }

  snapshot(): CardSetCacheSnapshot {
    return {
      ...this.state,
    };
  }
}
