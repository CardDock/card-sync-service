import { Card } from '../../domain/entities/card.entity';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface UpdateCardInput {
  id: string;
  updates: {
    name?: string;
    typeline?: string[];
    type?: string;
    humanReadableCardType?: string;
    frameType?: string;
    desc?: string;
    race?: string;
    atk?: number | null;
    def?: number | null;
    level?: number | null;
    scale?: number | null;
    linkval?: number | null;
    linkmarkers?: string[];
    attribute?: string | null;
  };
}

export type UpdateCardCommand = UpdateCardInput;

export class UpdateCardUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: UpdateCardCommand): Promise<Card> {
    try {
      this.logger.info(
        { id: command.id },
        'Update card: fetching existing card',
      );

      const existing = await this.cardQueryRepository.findById(command.id);

      if (!existing) {
        throw new CardDomainProcessError({
          stage: 'UpdateCardUseCase.execute',
          message: `Card with id ${command.id} not found`,
          context: { id: command.id },
        });
      }

      const primitives = existing.toPrimitives();
      const merged = {
        ...primitives,
        ...command.updates,
      } as Parameters<typeof Card.create>[0];

      const card = Card.create(merged);

      await this.cardRepository.markAsManuallyEdited(
        command.id,
        command.updates,
      );

      this.logger.info(
        { id: command.id, name: card.toPrimitives().name },
        'Update card: completed, manual edit tracked',
      );

      return card;
    } catch (error) {
      this.logger.error({ id: command.id, error }, 'Update card: failed');
      throw this.buildProcessError(command.id, error);
    }
  }

  private buildProcessError(
    id: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'UpdateCardUseCase.execute',
      message: `Failed to update card by id ${id}`,
      context: {
        id,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
