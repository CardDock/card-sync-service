import { Injectable } from '@nestjs/common';
import { Logger } from '../../domain/ports/logger.port';
import {
  CardListFilters,
  CardQueryRepositoryPort,
  PaginatedResult,
} from '../../domain/ports/card-query-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { Card } from '../../domain/entities/card.entity';
import {
  mapCardToPostgresRecord,
  mapPostgresRowToCard,
} from './postgres-card.mapper';
import { PostgresPoolProvider } from './postgres-pool.provider';

interface PostgresCardRow {
  id: string;
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
  constructor(
    private readonly postgresPoolProvider: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async findById(id: string): Promise<Card | null> {
    const result =
      await this.postgresPoolProvider.client.query<PostgresCardRow>(
        `
        SELECT
          "id",
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
        WHERE "id" = $1
        LIMIT 1
      `,
        [id],
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

  async findAll(
    filters: CardListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Card>> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 0;

    if (filters.name) {
      paramIndex++;
      conditions.push(`"name" ILIKE '%' || $${paramIndex} || '%'`);
      params.push(filters.name);
    }

    if (filters.type) {
      paramIndex++;
      conditions.push(`"type" ILIKE '%' || $${paramIndex} || '%'`);
      params.push(filters.type);
    }

    if (filters.race) {
      paramIndex++;
      conditions.push(`"race" = $${paramIndex}::"Race"`);
      params.push(filters.race);
    }

    if (filters.attribute) {
      paramIndex++;
      conditions.push(`"attribute" = $${paramIndex}::"Attribute"`);
      params.push(filters.attribute);
    }

    if (filters.frameType) {
      paramIndex++;
      conditions.push(`"frame_type" = $${paramIndex}::"FrameType"`);
      params.push(filters.frameType);
    }

    if (filters.atkMin != null) {
      paramIndex++;
      conditions.push(`"atk" >= $${paramIndex}`);
      params.push(filters.atkMin);
    }

    if (filters.atkMax != null) {
      paramIndex++;
      conditions.push(`"atk" <= $${paramIndex}`);
      params.push(filters.atkMax);
    }

    if (filters.defMin != null) {
      paramIndex++;
      conditions.push(`"def" >= $${paramIndex}`);
      params.push(filters.defMin);
    }

    if (filters.defMax != null) {
      paramIndex++;
      conditions.push(`"def" <= $${paramIndex}`);
      params.push(filters.defMax);
    }

    if (filters.level != null) {
      paramIndex++;
      conditions.push(`"level" = $${paramIndex}`);
      params.push(filters.level);
    }

    if (filters.linkval != null) {
      paramIndex++;
      conditions.push(`"linkval" = $${paramIndex}`);
      params.push(filters.linkval);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const offset = (page - 1) * limit;

    const countResult = await this.postgresPoolProvider.client.query<{
      count: number;
    }>(`SELECT COUNT(*) AS "count" FROM "cards" ${whereClause}`, params);

    const total = Number(countResult.rows[0].count);

    const dataResult =
      await this.postgresPoolProvider.client.query<PostgresCardRow>(
        `
        SELECT
          "id",
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
        ${whereClause}
        ORDER BY "name"
        LIMIT $${paramIndex + 1}
        OFFSET $${paramIndex + 2}
      `,
        [...params, limit, offset],
      );

    return {
      items: dataResult.rows.map(mapPostgresRowToCard),
      total,
      page,
      limit,
    };
  }

  async save(card: Card): Promise<string> {
    const record = mapCardToPostgresRecord(card);

    const result = await this.postgresPoolProvider.client.query<{ id: string }>(
      `
        INSERT INTO "cards" (
          "id",
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
          $6::"FrameType",
          $7,
          $8::"Race",
          $9,
          $10,
          $11,
          $12,
          $13,
          $14::"LinkMarker"[],
          $15::"Attribute",
          $16::jsonb
        )
        ON CONFLICT ("id") DO UPDATE SET
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
        RETURNING "id"
      `,
      [
        record.id,
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

    return result.rows[0].id;
  }
}
