import { Card } from '../../domain/entities/card.entity';
import {
  CardListFilters,
  CardQueryRepositoryPort,
  PaginatedResult,
} from '../../domain/ports/card-query-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface ListCardsInput {
  filters: CardListFilters;
  page: number;
  limit: number;
}

export type ListCardsCommand = ListCardsInput;

export class ListCardsUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: ListCardsCommand,
  ): Promise<PaginatedResult<Card>> {
    this.logger.info(
      { filters: command.filters, page: command.page, limit: command.limit },
      'List cards: querying database',
    );

    const result = await this.cardQueryRepository.findAll(
      command.filters,
      command.page,
      command.limit,
    );

    this.logger.info(
      { total: result.total, returned: result.items.length },
      'List cards: query completed',
    );

    return result;
  }
}
