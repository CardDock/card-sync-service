import { Injectable } from '@nestjs/common';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { CardTranslationData } from '../../domain/types/card-translation.types';
import { PostgresPoolProvider } from './postgres-pool.provider';

interface CardTranslationRow {
  name: string;
  desc: string;
  type: string | null;
  human_readable_card_type: string | null;
  race: string | null;
}

@Injectable()
export class PostgresCardTranslationRepository
  implements CardTranslationRepositoryPort
{
  constructor(
    private readonly postgresPoolProvider: PostgresPoolProvider,
  ) {}

  async findByCardIdAndLanguage(
    cardId: string,
    language: string,
  ): Promise<CardTranslationData | null> {
    const result =
      await this.postgresPoolProvider.client.query<CardTranslationRow>(
        `
        SELECT
          "name",
          "desc",
          "type",
          "human_readable_card_type",
          "race"
        FROM "card_translations"
        WHERE "card_id" = $1 AND "language" = $2
        LIMIT 1
      `,
        [cardId, language],
      );

    const [row] = result.rows;

    if (!row) {
      return null;
    }

    return {
      name: row.name,
      desc: row.desc,
      type: row.type,
      humanReadableCardType: row.human_readable_card_type,
      race: row.race,
    };
  }

  async findCardIdsByName(
    name: string,
    language: string,
  ): Promise<string[]> {
    const result = await this.postgresPoolProvider.client.query<{
      card_id: string;
    }>(
      `
        SELECT "card_id"
        FROM "card_translations"
        WHERE "language" = $1 AND "name" ILIKE '%' || $2 || '%'
        ORDER BY "name"
        LIMIT 20
      `,
      [language, name],
    );

    return result.rows.map((row) => row.card_id);
  }

  async save(
    cardId: string,
    language: string,
    data: CardTranslationData,
  ): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `
        INSERT INTO "card_translations" (
          "card_id",
          "language",
          "name",
          "desc",
          "type",
          "human_readable_card_type",
          "race"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("card_id", "language") DO UPDATE SET
          "name" = EXCLUDED."name",
          "desc" = EXCLUDED."desc",
          "type" = EXCLUDED."type",
          "human_readable_card_type" = EXCLUDED."human_readable_card_type",
          "race" = EXCLUDED."race"
      `,
      [
        cardId,
        language,
        data.name,
        data.desc,
        data.type ?? null,
        data.humanReadableCardType ?? null,
        data.race ?? null,
      ],
    );
  }
}
