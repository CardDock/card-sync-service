import { CardLookupDocument, CardLookupPort } from '../ports/card-lookup.port';
import {
  GenesysPointsDocument,
  GenesysPointsRepositoryPort,
} from '../ports/genesys-points-repository.port';

export type CardGenesysPointsResponse = {
  cardId: string;
  points: number;
};

export class GetCardGenesysPointsUseCase {
  constructor(
    private readonly cardLookupPort: CardLookupPort,
    private readonly genesysPointsRepository: GenesysPointsRepositoryPort,
  ) {}

  async execute(cardId: string): Promise<CardGenesysPointsResponse> {
    const normalizedId = Number(cardId);

    if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
      return { cardId, points: 0 };
    }

    const card = await this.cardLookupPort.findById(normalizedId);

    if (!card) {
      return { cardId: String(normalizedId), points: 0 };
    }

    const konamiId = this.extractKonamiId(card);

    if (konamiId === null) {
      return { cardId: String(normalizedId), points: 0 };
    }

    const genesysPoints = await this.genesysPointsRepository.findCurrent();
    const points = this.resolvePoints(genesysPoints, konamiId);

    return { cardId: String(normalizedId), points };
  }

  private extractKonamiId(card: CardLookupDocument): number | null {
    const miscEntries = Array.isArray(card.misc_info)
      ? card.misc_info
      : Array.isArray(card.miscInfo)
        ? card.miscInfo
        : [];

    const misc = miscEntries[0] as Record<string, unknown> | undefined;

    if (!misc) {
      return null;
    }

    const rawKonamiId =
      misc.konami_id ?? misc.konamiId ?? misc.konami ?? misc['konami_id'];

    const konamiId = Number(rawKonamiId);

    return Number.isFinite(konamiId) && konamiId > 0 ? konamiId : null;
  }

  private resolvePoints(
    genesysPoints: GenesysPointsDocument | null,
    konamiId: number,
  ): number {
    if (!genesysPoints) {
      return 0;
    }

    const value = genesysPoints.regulation[String(konamiId)];

    if (value === undefined || value === null) {
      return 0;
    }

    const points = Number(value);
    return Number.isFinite(points) ? points : 0;
  }
}
