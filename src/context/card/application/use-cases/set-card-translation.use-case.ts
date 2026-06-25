import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { Language } from '../../domain/value-objects/language.value-object';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface SetCardTranslationInput {
  cardId: string;
  language: string;
  data: {
    name: string;
    desc: string;
    type?: string | null;
    humanReadableCardType?: string | null;
    race?: string | null;
  };
}

export type SetCardTranslationCommand = SetCardTranslationInput;

export class SetCardTranslationUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardTranslationRepository: CardTranslationRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: SetCardTranslationCommand): Promise<void> {
    try {
      this.logger.info(
        { cardId: command.cardId, language: command.language },
        'Set translation: checking card exists',
      );

      const existing = await this.cardQueryRepository.findById(command.cardId);

      if (!existing) {
        throw new CardDomainProcessError({
          stage: 'SetCardTranslationUseCase.execute',
          message: `Card with id ${command.cardId} not found`,
          context: { cardId: command.cardId },
        });
      }

      const language = Language.create(command.language);

      this.logger.info(
        { cardId: command.cardId, language: language.toPrimitives() },
        'Set translation: saving',
      );

      await this.cardTranslationRepository.save(
        command.cardId,
        language.toPrimitives(),
        {
          name: command.data.name,
          desc: command.data.desc,
          type: command.data.type ?? null,
          humanReadableCardType: command.data.humanReadableCardType ?? null,
          race: command.data.race ?? null,
        },
      );

      this.logger.info(
        { cardId: command.cardId, language: language.toPrimitives() },
        'Set translation: completed',
      );
    } catch (error) {
      this.logger.error(
        { cardId: command.cardId, language: command.language, error },
        'Set translation: failed',
      );
      throw this.buildProcessError(command.cardId, command.language, error);
    }
  }

  private buildProcessError(
    cardId: string,
    language: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'SetCardTranslationUseCase.execute',
      message: `Failed to set translation for card ${cardId} in language ${language}`,
      context: {
        cardId,
        language,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
