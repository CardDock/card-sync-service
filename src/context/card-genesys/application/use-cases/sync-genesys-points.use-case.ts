import { GenesysPointsRepositoryPort } from '../ports/genesys-points-repository.port';

const defaultGenesysPointsUrl =
  'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/genesys/current.vector.json';

export type GenesysSyncResponse = {
  date: string;
  total: number;
  source: string;
  syncedAt: Date;
};

export class SyncGenesysPointsUseCase {
  constructor(
    private readonly genesysPointsRepository: GenesysPointsRepositoryPort,
    private readonly sourceUrl: string = process.env.GENESYS_POINTS_URL ??
      defaultGenesysPointsUrl,
  ) {}

  async execute(): Promise<GenesysSyncResponse> {
    const response = await fetch(this.sourceUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Unable to sync Genesys points from ${this.sourceUrl}: ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      date?: string;
      regulation?: Record<string, unknown>;
    };

    if (!payload || typeof payload !== 'object' || !payload.regulation) {
      throw new Error('Genesys points payload is missing the regulation data');
    }

    const regulation = Object.fromEntries(
      Object.entries(payload.regulation).map(([key, value]) => [
        String(key),
        this.normalizePoint(value),
      ]),
    ) as Record<string, number>;

    const document = await this.genesysPointsRepository.upsertCurrent(
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
    return Number.isFinite(numericValue) ? numericValue : 0;
  }
}
