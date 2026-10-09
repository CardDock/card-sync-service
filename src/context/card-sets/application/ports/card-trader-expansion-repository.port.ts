import { CardTraderExpansion } from './card-trader-source.port';

export abstract class CardTraderExpansionRepositoryPort {
  abstract findById(id: number): Promise<CardTraderExpansion | null>;
  abstract saveMany(expansions: CardTraderExpansion[]): Promise<void>;
}
