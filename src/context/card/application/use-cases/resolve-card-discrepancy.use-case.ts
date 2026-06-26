import {
  CardSyncDiscrepancyRepositoryPort,
  DiscrepancyStatus,
} from '../../domain/ports/card-sync-discrepancy-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export type ResolveDiscrepancyAction =
  | 'REVIEWED_LOCAL_WINS'
  | 'REVIEWED_API_WINS'
  | 'RESOLVED';

export interface ResolveCardDiscrepancyInput {
  discrepancyId: string;
  action: ResolveDiscrepancyAction;
}

export type ResolveCardDiscrepancyCommand = ResolveCardDiscrepancyInput;

export class ResolveCardDiscrepancyUseCase {
  constructor(
    private readonly discrepancyRepository: CardSyncDiscrepancyRepositoryPort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: ResolveCardDiscrepancyCommand): Promise<void> {
    try {
      this.logger.info(
        { discrepancyId: command.discrepancyId, action: command.action },
        'Resolve discrepancy: starting',
      );

      const status = command.action as DiscrepancyStatus;

      await this.discrepancyRepository.updateStatus(
        command.discrepancyId,
        status,
      );

      this.logger.info(
        { discrepancyId: command.discrepancyId, status },
        'Resolve discrepancy: completed',
      );
    } catch (error) {
      this.logger.error(
        { discrepancyId: command.discrepancyId, error },
        'Resolve discrepancy: failed',
      );
      throw this.buildProcessError(command.discrepancyId, error);
    }
  }

  private buildProcessError(
    discrepancyId: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'ResolveCardDiscrepancyUseCase.execute',
      message: `Failed to resolve discrepancy ${discrepancyId}`,
      context: {
        discrepancyId,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
