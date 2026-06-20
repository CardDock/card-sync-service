import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { CardQueryRepositoryPort } from '../../domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { Card } from '../../domain/entities/card.entity';
import {
  mapCardToPostgresRecord,
  mapPostgresRowToCard,
} from './postgres-card.mapper';
import { PostgresPoolProvider } from './postgres-pool.provider';

interface PostgresCardRow {
  id: string;
  external_id: string;
  name: string;
  typeline: string[];
  type: string;
  human_readable_card_type: string;
  frame_type: string;
  desc: string;
  race: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  scale: number | null;
  linkval: number | null;
  linkmarkers: string[] | null;
  attribute: string | null;
  raw_data:
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | boolean
    | null;
}

@Injectable()
export class PostgresCardRepository
  implements CardQueryRepositoryPort, CardRepositoryPort
{
  constructor(private readonly postgresPoolProvider: PostgresPoolProvider) {}

  async findByExternalId(externalId: string): Promise<Card | null> {
    const result =
      await this.postgresPoolProvider.client.query<PostgresCardRow>(
        `
        SELECT
          "id",
          "external_id",
          "name",
          "typeline",
          "type",
          "human_readable_card_type",
          "frame_type",
          "desc",
          "race",
          "atk",
          "def",
          "level",
          "scale",
          "linkval",
          "linkmarkers",
          "attribute",
          "rawData" AS "raw_data"
        FROM "cards"
        WHERE "external_id" = $1
        LIMIT 1
      `,
        [externalId],
      );

    const [row] = result.rows;

    if (!row) {
      return null;
    }

    return mapPostgresRowToCard(row);
  }

  async findByName(name: string): Promise<Card[]> {
    const result =
      await this.postgresPoolProvider.client.query<PostgresCardRow>(
        `
        SELECT
          "id",
          "external_id",
          "name",
          "typeline",
          "type",
          "human_readable_card_type",
          "frame_type",
          "desc",
          "race",
          "atk",
          "def",
          "level",
          "scale",
          "linkval",
          "linkmarkers",
          "attribute",
          "rawData" AS "raw_data"
        FROM "cards"
        WHERE "name" ILIKE '%' || $1 || '%'
        ORDER BY "name"
        LIMIT 20
      `,
        [name],
      );

    return result.rows.map(mapPostgresRowToCard);
  }

  async save(card: Card): Promise<void> {
    const record = mapCardToPostgresRecord(card);

    await this.postgresPoolProvider.client.query(
      `
        INSERT INTO "cards" (
          "id",
          "external_id",
          "name",
          "typeline",
          "type",
          "human_readable_card_type",
          "frame_type",
          "desc",
          "race",
          "atk",
          "def",
          "level",
          "scale",
          "linkval",
          "linkmarkers",
          "attribute",
          "rawData"
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::"FrameType",
          $8,
          $9::"Race",
          $10,
          $11,
          $12,
          $13,
          $14,
          $15::"LinkMarker"[],
          $16::"Attribute",
          $17::jsonb
        )
        ON CONFLICT ("external_id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "typeline" = EXCLUDED."typeline",
          "type" = EXCLUDED."type",
          "human_readable_card_type" = EXCLUDED."human_readable_card_type",
          "frame_type" = EXCLUDED."frame_type",
          "desc" = EXCLUDED."desc",
          "race" = EXCLUDED."race",
          "atk" = EXCLUDED."atk",
          "def" = EXCLUDED."def",
          "level" = EXCLUDED."level",
          "scale" = EXCLUDED."scale",
          "linkval" = EXCLUDED."linkval",
          "linkmarkers" = EXCLUDED."linkmarkers",
          "attribute" = EXCLUDED."attribute",
          "rawData" = EXCLUDED."rawData"
      `,
      [
        record.id,
        record.externalId,
        record.name,
        record.typeline,
        record.type,
        record.humanReadableCardType,
        record.frameType,
        record.desc,
        record.race,
        record.atk,
        record.def,
        record.level,
        record.scale,
        record.linkval,
        record.linkmarkers,
        record.attribute,
        record.rawData,
      ],
    );
  }
}
