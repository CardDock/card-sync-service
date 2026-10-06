import { CardTraderUnavailableError } from '../errors/card-sets.errors';
import { CardTraderExpansionRepositoryPort } from '../ports/card-trader-expansion-repository.port';
import {
  CardTraderExpansion,
  CardTraderSourcePort,
} from '../ports/card-trader-source.port';

export type SyncCardTraderExpansionsResult = {
  data: CardTraderExpansion[];
  count: number;
  syncedAt: Date;
};

export class SyncCardTraderExpansionsUseCase {
  constructor(
    private readonly repository: CardTraderExpansionRepositoryPort,
    private readonly cardTrader: CardTraderSourcePort,
  ) {}

  async execute(): Promise<SyncCardTraderExpansionsResult> {
    let expansions: CardTraderExpansion[];
    try {
      expansions = await this.cardTrader.findExpansions();
    } catch (error) {
      if (error instanceof CardTraderUnavailableError) {
        throw error;
      }
      throw new CardTraderUnavailableError(
        `CardTrader expansion sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const normalized = expansions.map((expansion) => ({
      ...expansion,
      id: Number(expansion.id),
      game_id: Number(expansion.game_id),
      code: String(expansion.code ?? ''),
      name: String(expansion.name ?? ''),
    }));

    await this.repository.saveMany(normalized);

    return {
      data: normalized,
      count: normalized.length,
      syncedAt: new Date(),
    };
  }
}
