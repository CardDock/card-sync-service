import { CardRelatedDataRepositoryPort, ArtworkResult } from '../../domain/ports/card-related-data-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface GetCardArtworksInput {
  externalId: string;
}

export type GetCardArtworksCommand = GetCardArtworksInput;

export class GetCardArtworksUseCase {
  constructor(
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: GetCardArtworksCommand): Promise<ArtworkResult[]> {
    this.logger.info(
      { externalId: command.externalId },
      'Get card artworks: querying database',
    );

    const artworks =
      await this.cardRelatedDataRepository.findArtworksByCardExternalId(
        command.externalId,
      );

    this.logger.info(
      { externalId: command.externalId, count: artworks.length },
      'Get card artworks: query completed',
    );

    return artworks;
  }
}
