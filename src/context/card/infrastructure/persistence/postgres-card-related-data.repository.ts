import { Injectable } from '@nestjs/common';
import { Logger } from '../../domain/ports/logger.port';
import {
  ArtworkResult,
  CardPrintResult,
  CardRelatedDataRepositoryPort,
  CardSetResult,
} from '../../domain/ports/card-related-data-repository.port';
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

  async findArtworksByCardExternalId(
    externalId: string,
  ): Promise<ArtworkResult[]> {
    const result = await this.postgresPoolProvider.client.query<{
      id: string;
      image_url: string;
    }>(
      `
      SELECT a."id", a."image_url"
      FROM "artworks" a
      JOIN "cards" c ON c."id" = a."card_id"
      WHERE c."external_id" = $1
      ORDER BY a."id"
    `,
      [externalId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
    }));
  }

  async findPrintsByCardExternalId(
    externalId: string,
  ): Promise<CardPrintResult[]> {
    const result = await this.postgresPoolProvider.client.query<{
      id: string;
      card_set_id: string;
      card_set_name: string;
      card_set_code: string | null;
      set_code: string;
      rarity: string;
      rarity_code: string | null;
      set_price: number | null;
    }>(
      `
      SELECT
        cp."id",
        cp."card_set_id",
        cs."name" AS "card_set_name",
        cs."code" AS "card_set_code",
        cp."set_code",
        cp."rarity",
        cp."rarity_code",
        cp."set_price"
      FROM "card_prints" cp
      JOIN "card_sets" cs ON cs."id" = cp."card_set_id"
      JOIN "artworks" a ON a."id" = cp."artwork_id"
      JOIN "cards" c ON c."id" = a."card_id"
      WHERE c."external_id" = $1
      ORDER BY cs."name", cp."rarity"
    `,
      [externalId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      cardSetId: row.card_set_id,
      cardSetName: row.card_set_name,
      cardSetCode: row.card_set_code,
      setCode: row.set_code,
      rarity: row.rarity,
      rarityCode: row.rarity_code,
      setPrice: row.set_price,
    }));
  }

  async findAllCardSets(): Promise<CardSetResult[]> {
    const result = await this.postgresPoolProvider.client.query<{
      id: string;
      name: string;
      code: string | null;
    }>(
      `
      SELECT "id", "name", "code"
      FROM "card_sets"
      ORDER BY "name"
    `,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
    }));
  }
}
