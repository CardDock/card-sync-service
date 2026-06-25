import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import {
  CardSetData,
  createCardSetData,
} from '../../domain/types/card-set.types';
import {
  CardPrintData,
  createCardPrintData,
} from '../../domain/types/card-print.types';
import { CardDomainProcessError, DomainError } from '../../domain/errors';
import { Logger } from '../../domain/ports/logger.port';

export interface AddCardPrintInput {
  cardId: string;
  print: {
    setName: string;
    setCode: string;
    rarity: string;
    rarityCode?: string | null;
    setPrice?: number | null;
  };
}

export type AddCardPrintCommand = AddCardPrintInput;

export class AddCardPrintUseCase {
  constructor(
    private readonly cardQueryRepository: CardQueryRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: AddCardPrintCommand): Promise<void> {
    try {
      this.logger.info(
        { cardId: command.cardId },
        'Add print: checking card exists',
      );

      const existing = await this.cardQueryRepository.findById(command.cardId);

      if (!existing) {
        throw new CardDomainProcessError({
          stage: 'AddCardPrintUseCase.execute',
          message: `Card with id ${command.cardId} not found`,
          context: { cardId: command.cardId },
        });
      }

      const artworkId =
        await this.cardRelatedDataRepository.findFirstArtworkIdByCardId(
          command.cardId,
        );

      if (!artworkId) {
        throw new CardDomainProcessError({
          stage: 'AddCardPrintUseCase.execute',
          message: `Card ${command.cardId} has no artworks to associate a print with`,
          context: { cardId: command.cardId },
        });
      }

      const cardSetData: CardSetData = createCardSetData(
        command.print.setName,
        command.print.setCode,
      );

      const setIds = await this.cardRelatedDataRepository.saveCardSets([
        cardSetData,
      ]);

      const printData: CardPrintData = createCardPrintData(
        command.print.setName,
        command.print.setCode,
        command.print.rarity,
        command.print.rarityCode ?? null,
        command.print.setPrice ?? null,
      );

      await this.cardRelatedDataRepository.saveCardPrints(
        artworkId,
        [printData],
        setIds,
      );

      this.logger.info(
        { cardId: command.cardId, setCode: command.print.setCode },
        'Add print: completed',
      );
    } catch (error) {
      this.logger.error({ cardId: command.cardId, error }, 'Add print: failed');
      throw this.buildProcessError(command.cardId, error);
    }
  }

  private buildProcessError(
    cardId: string,
    cause: unknown,
  ): CardDomainProcessError {
    const causeCode = cause instanceof DomainError ? cause.code : undefined;

    return new CardDomainProcessError({
      stage: 'AddCardPrintUseCase.execute',
      message: `Failed to add print for card ${cardId}`,
      context: {
        cardId,
        ...(causeCode ? { causeCode } : {}),
      },
      cause,
    });
  }
}
