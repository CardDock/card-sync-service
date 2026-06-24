import {
  CardRelatedDataRepositoryPort,
  CardSetResult,
} from '../../domain/ports/card-related-data-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export class ListCardSetsUseCase {
  constructor(
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<CardSetResult[]> {
    this.logger.info({}, 'List card sets: querying database');

    const sets = await this.cardRelatedDataRepository.findAllCardSets();

    this.logger.info({ count: sets.length }, 'List card sets: query completed');

    return sets;
  }
}
