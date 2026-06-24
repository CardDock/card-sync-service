import {
  CardRelatedDataRepositoryPort,
  ArtworkResult,
} from '../../domain/ports/card-related-data-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface GetCardArtworksInput {
  id: string;
}

export type GetCardArtworksCommand = GetCardArtworksInput;

export class GetCardArtworksUseCase {
  constructor(
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: GetCardArtworksCommand): Promise<ArtworkResult[]> {
    this.logger.info(
      { id: command.id },
      'Get card artworks: querying database',
    );

    const artworks = await this.cardRelatedDataRepository.findArtworksByCardId(
      command.id,
    );

    this.logger.info(
      { id: command.id, count: artworks.length },
      'Get card artworks: query completed',
    );

    return artworks;
  }
}
