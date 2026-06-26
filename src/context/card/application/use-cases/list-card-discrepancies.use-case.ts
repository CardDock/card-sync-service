import {
  CardSyncDiscrepancyRepositoryPort,
  CardSyncDiscrepancyRecord,
  DiscrepancyStatus,
} from '../../domain/ports/card-sync-discrepancy-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface ListCardDiscrepanciesInput {
  cardId?: string;
  status?: DiscrepancyStatus;
  page?: number;
  limit?: number;
}

export type ListCardDiscrepanciesCommand = ListCardDiscrepanciesInput;

export class ListCardDiscrepanciesUseCase {
  constructor(
    private readonly discrepancyRepository: CardSyncDiscrepancyRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: ListCardDiscrepanciesCommand): Promise<{
    items: CardSyncDiscrepancyRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.info(
      { cardId: command.cardId, status: command.status },
      'Listing discrepancies',
    );

    if (command.cardId) {
      const items = await this.discrepancyRepository.findByCardId(
        command.cardId,
      );

      return {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
      };
    }

    return this.discrepancyRepository.findAll(
      command.status,
      command.page,
      command.limit,
    );
  }
}
