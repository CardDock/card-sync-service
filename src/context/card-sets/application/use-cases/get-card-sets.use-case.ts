import {
  CardNotFoundError,
  CardTraderUnavailableError,
  InvalidCardIdError,
} from '../errors/card-sets.errors';
import { CardReaderPort } from '../ports/card-reader.port';
import { CardSetCacheRepositoryPort } from '../ports/card-set-cache-repository.port';
import { CardTraderSourcePort } from '../ports/card-trader-source.port';
import { CardSetCache } from '../../domain/card-set-cache';

export type CardSetsResult = {
  cardId: number;
  cardName: string;
  cachedAt: Date;
  data: unknown;
};

export class GetCardSetsUseCase {
  constructor(
    private readonly cardReader: CardReaderPort,
    private readonly cacheRepository: CardSetCacheRepositoryPort,
    private readonly cardTrader: CardTraderSourcePort,
    private readonly cacheTtlMs = 24 * 60 * 60 * 1000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(rawCardId: string | number): Promise<CardSetsResult> {
    const cardId = this.parseCardId(rawCardId);
    const card = await this.cardReader.findById(cardId);
    if (!card) throw new CardNotFoundError(cardId);

    const cached = await this.cacheRepository.findByCardId(cardId);
    const currentTime = this.now();
    if (cached?.isFresh(currentTime, this.cacheTtlMs)) {
      return this.toResult(cached.snapshot());
    }

    let response: unknown;
    try {
      response = await this.cardTrader.findBlueprints(card.name);
    } catch (error) {
      if (cached && error instanceof CardTraderUnavailableError) {
        return this.toResult(cached.snapshot());
      }
      throw error;
    }

    const updated = CardSetCache.create({
      cardId,
      cardName: card.name,
      response,
      cachedAt: currentTime,
    });
    await this.cacheRepository.save(updated);
    return this.toResult(updated.snapshot());
  }

  private parseCardId(rawCardId: string | number): number {
    const cardId =
      typeof rawCardId === 'number'
        ? rawCardId
        : rawCardId.trim() === ''
          ? Number.NaN
          : Number(rawCardId);
    if (!Number.isInteger(cardId) || cardId <= 0) {
      throw new InvalidCardIdError();
    }
    return cardId;
  }

  private toResult(
    snapshot: ReturnType<CardSetCache['snapshot']>,
  ): CardSetsResult {
    return {
      cardId: snapshot.cardId,
      cardName: snapshot.cardName,
      cachedAt: snapshot.cachedAt,
      data: snapshot.response,
    };
  }
}
