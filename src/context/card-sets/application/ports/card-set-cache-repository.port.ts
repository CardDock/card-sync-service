import { CardSetCache } from '../../domain/card-set-cache';

export abstract class CardSetCacheRepositoryPort {
  abstract findByCardId(cardId: number): Promise<CardSetCache | null>;
  abstract save(cache: CardSetCache): Promise<void>;
}
