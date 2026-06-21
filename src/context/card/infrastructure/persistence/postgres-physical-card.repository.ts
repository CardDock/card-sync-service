import { Injectable } from '@nestjs/common';
import { Logger } from '../../domain/ports/logger.port';
import { PhysicalCardRepositoryPort } from '../../domain/ports/physical-card-repository.port';
import { PhysicalCard } from '../../domain/entities/physical-card.entity';
import { PostgresPoolProvider } from './postgres-pool.provider';

@Injectable()
export class PostgresPhysicalCardRepository
  implements PhysicalCardRepositoryPort
{
  constructor(
    private readonly postgresPoolProvider: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async save(physicalCard: PhysicalCard): Promise<PhysicalCard> {
    const record = physicalCard.toPrimitives();

    const result = await this.postgresPoolProvider.client.query(
      `
      INSERT INTO "physical_cards" ("id", "artwork_id", "card_print_id", "condition", "language", "is_first_edition")
      VALUES ($1, $2, $3, $4::"CardCondition", $5::"CardLanguage", $6)
      ON CONFLICT ("id") DO UPDATE SET
        "condition" = EXCLUDED."condition",
        "language" = EXCLUDED."language",
        "is_first_edition" = EXCLUDED."is_first_edition"
      RETURNING "id"
      `,
      [
        record.id,
        record.artworkId,
        record.cardPrintId,
        record.condition,
        record.language,
        record.isFirstEdition,
      ],
    );

    return PhysicalCard.create({
      ...record,
      id: result.rows[0].id as string,
    });
  }
}
