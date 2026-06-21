import { PhysicalCard } from '../../domain/entities/physical-card.entity';
import { PhysicalCardRepositoryPort } from '../../domain/ports/physical-card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { Logger } from '../../domain/ports/logger.port';

export interface RegisterPhysicalCardInput {
  externalId: string;
  cardPrintId?: string | null;
  condition: string;
  language: string;
  isFirstEdition?: boolean;
}

export type RegisterPhysicalCardCommand = RegisterPhysicalCardInput;

export interface RegisterPhysicalCardResult {
  id: string;
  artworkId: string;
  cardPrintId: string | null;
  condition: string;
  language: string;
  isFirstEdition: boolean;
}

export class RegisterPhysicalCardUseCase {
  constructor(
    private readonly physicalCardRepository: PhysicalCardRepositoryPort,
    private readonly cardRelatedDataRepository: CardRelatedDataRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: RegisterPhysicalCardCommand,
  ): Promise<RegisterPhysicalCardResult> {
    this.logger.info({ externalId: command.externalId }, 'Register physical card: checking artwork');

    const artworkId =
      await this.cardRelatedDataRepository.findFirstArtworkIdByCardExternalId(
        command.externalId,
      );

    if (!artworkId) {
      this.logger.error({ externalId: command.externalId }, 'Register physical card: failed — card not synced yet, no artwork found');
      throw new Error(
        `No artwork found for card with externalId ${command.externalId}. Sync the card first.`,
      );
    }

    this.logger.info({ externalId: command.externalId, artworkId }, 'Register physical card: artwork exists, saving to database');
    const physicalCard = PhysicalCard.create({
      artworkId,
      cardPrintId: command.cardPrintId ?? null,
      condition: command.condition,
      language: command.language,
      isFirstEdition: command.isFirstEdition ?? false,
    });

    const saved = await this.physicalCardRepository.save(physicalCard);
    const primitives = saved.toPrimitives();

    this.logger.info({ id: primitives.id, externalId: command.externalId, condition: primitives.condition, language: primitives.language }, 'Register physical card: saved successfully');
    return primitives;
  }
}
