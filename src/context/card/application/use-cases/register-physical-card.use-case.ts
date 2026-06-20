import { PhysicalCard } from '../../domain/entities/physical-card.entity';
import { PhysicalCardRepositoryPort } from '../../domain/ports/physical-card-repository.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';

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
  ) {}

  async execute(
    command: RegisterPhysicalCardCommand,
  ): Promise<RegisterPhysicalCardResult> {
    const artworkId =
      await this.cardRelatedDataRepository.findFirstArtworkIdByCardExternalId(
        command.externalId,
      );

    if (!artworkId) {
      throw new Error(
        `No artwork found for card with externalId ${command.externalId}. Sync the card first.`,
      );
    }

    const physicalCard = PhysicalCard.create({
      artworkId,
      cardPrintId: command.cardPrintId ?? null,
      condition: command.condition,
      language: command.language,
      isFirstEdition: command.isFirstEdition ?? false,
    });

    const saved = await this.physicalCardRepository.save(physicalCard);

    return saved.toPrimitives();
  }
}
