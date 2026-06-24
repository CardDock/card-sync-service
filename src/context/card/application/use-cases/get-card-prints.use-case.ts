import {
  CardRelatedDataRepositoryPort,
  CardPrintResult,
} from '../../domain/ports/card-related-data-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface GetCardPrintsInput {
  id: string;
}

export type GetCardPrintsCommand = GetCardPrintsInput;

export class GetCardPrintsUseCase {
  constructor(
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: GetCardPrintsCommand): Promise<CardPrintResult[]> {
    this.logger.info({ id: command.id }, 'Get card prints: querying database');

    const prints = await this.cardRelatedDataRepository.findPrintsByCardId(
      command.id,
    );

    this.logger.info(
      { id: command.id, count: prints.length },
      'Get card prints: query completed',
    );

    return prints;
  }
}
