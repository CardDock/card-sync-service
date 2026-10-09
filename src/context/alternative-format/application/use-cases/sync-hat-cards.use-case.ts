import { HatCardsRepositoryPort } from '../ports/hat-cards-repository.port';

const defaultHatCardsUrl =
  'https://db.ygoprodeck.com/api/v7/cardinfo.php?startdate=2002-02-28&enddate=2014-07-08&dateregion=tcg';

export type HatSyncResponse = {
  total: number;
  source: string;
  syncedAt: Date;
};

export class SyncHatCardsUseCase {
  constructor(
    private readonly hatCardsRepository: HatCardsRepositoryPort,
    private readonly sourceUrl: string = process.env.HAT_CARDS_URL ??
      defaultHatCardsUrl,
  ) {}

  async execute(): Promise<HatSyncResponse> {
    const response = await fetch(this.sourceUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Unable to sync HAT cards from ${this.sourceUrl}: ${response.status}`,
      );
    }

    const payload = (await response.json()) as { data?: unknown };
    const cardIds = this.extractCardIds(payload);
    await this.hatCardsRepository.replaceAll(cardIds);

    return {
      total: cardIds.length,
      source: this.sourceUrl,
      syncedAt: new Date(),
    };
  }

  private extractCardIds(payload: { data?: unknown }): string[] {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !Array.isArray(payload.data)
    ) {
      throw new Error('HAT cards payload is missing the data array');
    }

    const cardIds = payload.data.map((card, index) => {
      if (!card || typeof card !== 'object') {
        throw new Error(`HAT card at index ${index} is invalid`);
      }

      const rawId = (card as { id?: unknown }).id;
      if (
        (typeof rawId !== 'string' && typeof rawId !== 'number') ||
        String(rawId).trim() === ''
      ) {
        throw new Error(`HAT card at index ${index} is missing a valid id`);
      }

      return String(rawId).trim();
    });

    return [...new Set(cardIds)];
  }
}
