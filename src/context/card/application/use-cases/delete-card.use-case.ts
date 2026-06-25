import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface DeleteCardInput {
  id: string;
}

export type DeleteCardCommand = DeleteCardInput;

export class DeleteCardUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: DeleteCardCommand): Promise<void> {
    try {
      this.logger.info({ id: command.id }, 'Delete card: checking existence');

      const existing = await this.cardQueryRepository.findById(command.id);

      if (!existing) {
        throw new CardDomainProcessError({
          stage: 'DeleteCardUseCase.execute',
          message: `Card with id ${command.id} not found`,
          context: { id: command.id },
        });
      }

      await this.transactionManager.transaction(async () => {
        await this.cardRelatedDataRepository.deleteByCardId(command.id);
        await this.cardTranslationRepository.deleteByCardId(command.id);
        await this.cardRepository.delete(command.id);
      });

      this.logger.info(
        { id: command.id, name: existing.toPrimitives().name },
        'Delete card: completed',
      );
    } catch (error) {
      this.logger.error({ id: command.id, error }, 'Delete card: failed');
      throw this.buildProcessError(command.id, error);
    }
  }

  private buildProcessError(
    id: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'DeleteCardUseCase.execute',
      message: `Failed to delete card by id ${id}`,
      context: {
        id,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
