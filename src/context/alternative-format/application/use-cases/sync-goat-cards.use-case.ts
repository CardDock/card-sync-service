import { GoatCardsRepositoryPort } from '../ports/goat-cards-repository.port';

const defaultGoatCardsUrl =
  'https://db.ygoprodeck.com/api/v7/cardinfo.php?format=goat';

export type GoatSyncResponse = {
  total: number;
  source: string;
  syncedAt: Date;
};

export class SyncGoatCardsUseCase {
  constructor(
    private readonly goatCardsRepository: GoatCardsRepositoryPort,
    private readonly sourceUrl: string = process.env.GOAT_CARDS_URL ??
      defaultGoatCardsUrl,
  ) {}

  async execute(): Promise<GoatSyncResponse> {
    const response = await fetch(this.sourceUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Unable to sync GOAT cards from ${this.sourceUrl}: ${response.status}`,
      );
    }

    const payload = (await response.json()) as { data?: unknown };
    const cardIds = this.extractCardIds(payload);
    await this.goatCardsRepository.replaceAll(cardIds);

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
      throw new Error('GOAT cards payload is missing the data array');
    }

    const cardIds = payload.data.map((card, index) => {
      if (!card || typeof card !== 'object') {
        throw new Error(`GOAT card at index ${index} is invalid`);
      }

      const rawId = (card as { id?: unknown }).id;
      if (
        (typeof rawId !== 'string' && typeof rawId !== 'number') ||
        String(rawId).trim() === ''
      ) {
        throw new Error(`GOAT card at index ${index} is missing a valid id`);
      }

      return String(rawId).trim();
    });

    return [...new Set(cardIds)];
  }
}
