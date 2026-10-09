import { CardLookupDocument, CardLookupPort } from '../ports/card-lookup.port';
import {
  ForbiddenCardsDocument,
  ForbiddenCardsRepositoryPort,
} from '../ports/forbidden-cards-repository.port';

export type CardForbiddenPointsResponse = {
  cardId: string;
  points: number;
};

export class GetCardForbiddenPointsUseCase {
  constructor(
    private readonly cardLookupPort: CardLookupPort,
    private readonly forbiddenCardsRepository: ForbiddenCardsRepositoryPort,
  ) {}

  async execute(cardId: string): Promise<CardForbiddenPointsResponse> {
    const normalizedId = Number(cardId);

    if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
      return { cardId, points: 3 };
    }

    const card = await this.cardLookupPort.findById(normalizedId);

    if (!card) {
      return { cardId: String(normalizedId), points: 3 };
    }

    const konamiId = this.extractKonamiId(card);

    if (konamiId === null) {
      return { cardId: String(normalizedId), points: 3 };
    }

    const forbiddenCards = await this.forbiddenCardsRepository.findCurrent();
    const points = this.resolvePoints(forbiddenCards, konamiId);

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
    forbiddenCards: ForbiddenCardsDocument | null,
    konamiId: number,
  ): number {
    if (!forbiddenCards) {
      return 3;
    }

    const value = forbiddenCards.regulation[String(konamiId)];

    if (value === undefined || value === null) {
      return 3;
    }

    const points = Number(value);
    return Number.isFinite(points) ? points : 3;
  }
}
