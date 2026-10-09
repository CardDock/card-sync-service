import {
  ExpansionNotFoundError,
  InvalidExpansionIdError,
} from '../errors/card-sets.errors';
import { CardTraderExpansionRepositoryPort } from '../ports/card-trader-expansion-repository.port';
import { CardTraderExpansion } from '../ports/card-trader-source.port';

export class GetCardTraderExpansionUseCase {
  constructor(
    private readonly repository: CardTraderExpansionRepositoryPort,
  ) {}

  async execute(rawId: string | number): Promise<CardTraderExpansion> {
    const expansionId = this.parseExpansionId(rawId);
    const expansion = await this.repository.findById(expansionId);
    if (!expansion) {
      throw new ExpansionNotFoundError(expansionId);
    }
    return expansion;
  }

  private parseExpansionId(rawId: string | number): number {
    const expansionId =
      typeof rawId === 'number'
        ? rawId
        : rawId.trim() === ''
          ? Number.NaN
          : Number(rawId);

    if (!Number.isInteger(expansionId) || expansionId <= 0) {
      throw new InvalidExpansionIdError();
    }

    return expansionId;
  }
}
