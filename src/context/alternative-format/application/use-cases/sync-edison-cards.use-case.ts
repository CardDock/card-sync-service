import { EdisonCardsRepositoryPort } from '../ports/edison-cards-repository.port';

const defaultEdisonCardsUrl =
  'https://db.ygoprodeck.com/api/v7/cardinfo.php?format=Edison';

export type EdisonSyncResponse = {
  total: number;
  source: string;
  syncedAt: Date;
};

export class SyncEdisonCardsUseCase {
  constructor(
    private readonly edisonCardsRepository: EdisonCardsRepositoryPort,
    private readonly sourceUrl: string = process.env.EDISON_CARDS_URL ??
      defaultEdisonCardsUrl,
  ) {}

  async execute(): Promise<EdisonSyncResponse> {
    const response = await fetch(this.sourceUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Unable to sync Edison cards from ${this.sourceUrl}: ${response.status}`,
      );
    }

    const payload = (await response.json()) as { data?: unknown };
    const cardIds = this.extractCardIds(payload);
    await this.edisonCardsRepository.replaceAll(cardIds);

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
      throw new Error('Edison cards payload is missing the data array');
    }

    const cardIds = payload.data.map((card, index) => {
      if (!card || typeof card !== 'object') {
        throw new Error(`Edison card at index ${index} is invalid`);
      }

      const rawId = (card as { id?: unknown }).id;
      if (
        (typeof rawId !== 'string' && typeof rawId !== 'number') ||
        String(rawId).trim() === ''
      ) {
        throw new Error(`Edison card at index ${index} is missing a valid id`);
      }

      return String(rawId).trim();
    });

    return [...new Set(cardIds)];
  }
}
