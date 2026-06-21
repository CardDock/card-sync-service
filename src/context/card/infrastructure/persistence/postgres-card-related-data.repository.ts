import { Injectable } from '@nestjs/common';
import { Logger } from '../../domain/ports/logger.port';
import { CardRelatedDataRepositoryPort } from '../../domain/ports/card-related-data-repository.port';
import { CardSetData } from '../../domain/types/card-set.types';
import { ArtworkData } from '../../domain/types/artwork.types';
import { CardPrintData } from '../../domain/types/card-print.types';
import { PostgresPoolProvider } from './postgres-pool.provider';

@Injectable()
export class PostgresCardRelatedDataRepository
  implements CardRelatedDataRepositoryPort
{
  constructor(
    private readonly postgresPoolProvider: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async saveCardSets(sets: CardSetData[]): Promise<Map<string, string>> {
    if (sets.length === 0) {
      return new Map();
    }

    const setIds = new Map<string, string>();

    for (const set of sets) {
      const result = await this.postgresPoolProvider.client.query<{
        id: string;
      }>(
        `
        INSERT INTO "card_sets" ("id", "name", "code")
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT ("name") DO UPDATE SET
          "code" = COALESCE(EXCLUDED."code", "card_sets"."code")
        RETURNING "id"
        `,
        [set.name, set.code],
      );

      setIds.set(set.name, result.rows[0].id);
    }

    return setIds;
  }

  async saveArtwork(cardId: string, imageUrl: string): Promise<string> {
    const result = await this.postgresPoolProvider.client.query<{ id: string }>(
      `
      INSERT INTO "artworks" ("id", "card_id", "image_url")
      VALUES (gen_random_uuid(), $1, $2)
      ON CONFLICT ("card_id", "image_url") DO UPDATE SET
        "image_url" = EXCLUDED."image_url"
      RETURNING "id"
      `,
      [cardId, imageUrl],
    );

    return result.rows[0].id;
  }

  async findFirstArtworkIdByCardExternalId(
    externalId: string,
  ): Promise<string | null> {
    const result = await this.postgresPoolProvider.client.query<{
      id: string;
    }>(
      `
      SELECT a."id"
      FROM "artworks" a
      JOIN "cards" c ON c."id" = a."card_id"
      WHERE c."external_id" = $1
      ORDER BY a."id"
      LIMIT 1
      `,
      [externalId],
    );

    return result.rows[0]?.id ?? null;
  }

  async saveCardPrints(
    artworkId: string,
    prints: CardPrintData[],
    setIds: Map<string, string>,
  ): Promise<void> {
    for (const print of prints) {
      const cardSetId = setIds.get(print.setName);

      if (!cardSetId) {
        continue;
      }

      await this.postgresPoolProvider.client.query(
        `
        INSERT INTO "card_prints" ("id", "artwork_id", "card_set_id", "set_code", "rarity", "rarity_code", "set_price")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        ON CONFLICT ("artwork_id", "card_set_id", "set_code", "rarity") DO NOTHING
        `,
        [
          artworkId,
          cardSetId,
          print.setCode,
          print.rarity,
          print.rarityCode,
          print.setPrice,
        ],
      );
    }
  }
}
