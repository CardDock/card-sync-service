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

type CardFieldUpdates = Partial<{
  name: string;
  typeline: string[];
  type: string;
  humanReadableCardType: string;
  frameType: string;
  desc: string;
  race: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  scale: number | null;
  linkval: number | null;
  linkmarkers: string[];
  attribute: string | null;
}>;

const FIELD_MAP: Record<string, keyof CardFieldUpdates> = {
  name: 'name',
  typeline: 'typeline',
  type: 'type',
  humanReadableCardType: 'humanReadableCardType',
  frameType: 'frameType',
  desc: 'desc',
  race: 'race',
  atk: 'atk',
  def: 'def',
  level: 'level',
  scale: 'scale',
  linkval: 'linkval',
  linkmarkers: 'linkmarkers',
  attribute: 'attribute',
};

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

      const discrepancy = await this.discrepancyRepository.findById(
        command.discrepancyId,
      );

      if (!discrepancy) {
        throw new Error(`Discrepancy ${command.discrepancyId} not found`);
      }

      if (command.action === 'REVIEWED_API_WINS') {
        const fieldKey = FIELD_MAP[discrepancy.fieldName];
        if (fieldKey) {
          await this.cardRepository.updateCardFields(discrepancy.cardId, {
            [fieldKey]:
              discrepancy.apiValue as CardFieldUpdates[keyof CardFieldUpdates],
          } as CardFieldUpdates);
        }
      }

      const status = command.action as DiscrepancyStatus;

      await this.discrepancyRepository.updateStatus(
        command.discrepancyId,
        status,
      );

      const pendingCount =
        await this.discrepancyRepository.countPendingByCardId(
          discrepancy.cardId,
        );

      if (pendingCount === 0) {
        await this.cardRepository.clearManualEditFlag(discrepancy.cardId);
      }

      this.logger.info(
        {
          discrepancyId: command.discrepancyId,
          status,
          clearedManualEdit: pendingCount === 0,
        },
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
