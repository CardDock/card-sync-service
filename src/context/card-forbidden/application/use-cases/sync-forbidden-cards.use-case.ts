import { ForbiddenCardsRepositoryPort } from '../ports/forbidden-cards-repository.port';

const defaultForbiddenCardsUrl =
  'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/tcg/current.vector.json';

export type ForbiddenCardsSyncResponse = {
  date: string;
  total: number;
  source: string;
  syncedAt: Date;
};

export class SyncForbiddenCardsUseCase {
  constructor(
    private readonly forbiddenCardsRepository: ForbiddenCardsRepositoryPort,
    private readonly sourceUrl: string = process.env.TCG_LIMITS_URL ??
      defaultForbiddenCardsUrl,
  ) {}

  async execute(): Promise<ForbiddenCardsSyncResponse> {
    const response = await fetch(this.sourceUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Unable to sync forbidden card regulation from ${this.sourceUrl}: ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      date?: string;
      regulation?: Record<string, unknown>;
    };

    if (!payload || typeof payload !== 'object' || !payload.regulation) {
      throw new Error('Forbidden cards payload is missing the regulation data');
    }

    const regulation = Object.fromEntries(
      Object.entries(payload.regulation).map(([key, value]) => [
        String(key),
        this.normalizePoint(value),
      ]),
    ) as Record<string, number>;

    const document = await this.forbiddenCardsRepository.upsertCurrent(
      String(payload.date ?? new Date().toISOString().slice(0, 10)),
      regulation,
    );

    return {
      date: document.date,
      total: Object.keys(document.regulation).length,
      source: this.sourceUrl,
      syncedAt: document.syncedAt,
    };
  }

  private normalizePoint(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 3;
  }
}
