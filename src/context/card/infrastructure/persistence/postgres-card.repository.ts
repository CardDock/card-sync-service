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
  manually_edited: boolean;
  manually_edited_at: Date | null;
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
          "rawData" AS "raw_data",
          "manually_edited",
          "manually_edited_at"
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
          "rawData" AS "raw_data",
          "manually_edited",
          "manually_edited_at"
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
          "rawData" AS "raw_data",
          "manually_edited",
          "manually_edited_at"
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

  async updateCardFields(
    id: string,
    updates: Partial<{
      name: string;
      typeline: string[];
      type: string;
      humanReadableCardType: string;
      frameType: string;
      desc: string;
      race: string;
      atk: number | null;
      def: number | null;
      level: number | null;
      scale: number | null;
      linkval: number | null;
      linkmarkers: string[];
      attribute: string | null;
    }>,
  ): Promise<void> {
    const { setClauses, values } = buildFieldUpdateClauses(id, updates, 2);

    await this.postgresPoolProvider.client.query(
      `UPDATE "cards" SET ${setClauses.join(', ')} WHERE "id" = $1`,
      values,
    );
  }

  async markAsManuallyEdited(
    id: string,
    updates: Partial<{
      name: string;
      typeline: string[];
      type: string;
      humanReadableCardType: string;
      frameType: string;
      desc: string;
      race: string;
      atk: number | null;
      def: number | null;
      level: number | null;
      scale: number | null;
      linkval: number | null;
      linkmarkers: string[];
      attribute: string | null;
    }>,
  ): Promise<void> {
    const setClauses: string[] = [
      '"manually_edited" = $2',
      '"manually_edited_at" = NOW()',
    ];
    const values: unknown[] = [id, true];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      setClauses.push(`"name" = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.typeline !== undefined) {
      setClauses.push(`"typeline" = $${paramIndex++}`);
      values.push(updates.typeline);
    }
    if (updates.type !== undefined) {
      setClauses.push(`"type" = $${paramIndex++}`);
      values.push(updates.type);
    }
    if (updates.humanReadableCardType !== undefined) {
      setClauses.push(`"human_readable_card_type" = $${paramIndex++}`);
      values.push(updates.humanReadableCardType);
    }
    if (updates.frameType !== undefined) {
      setClauses.push(`"frame_type" = $${paramIndex++}::"FrameType"`);
      values.push(updates.frameType);
    }
    if (updates.desc !== undefined) {
      setClauses.push(`"desc" = $${paramIndex++}`);
      values.push(updates.desc);
    }
    if (updates.race !== undefined) {
      setClauses.push(`"race" = $${paramIndex++}::"Race"`);
      values.push(updates.race);
    }
    if (updates.atk !== undefined) {
      setClauses.push(`"atk" = $${paramIndex++}`);
      values.push(updates.atk);
    }
    if (updates.def !== undefined) {
      setClauses.push(`"def" = $${paramIndex++}`);
      values.push(updates.def);
    }
    if (updates.level !== undefined) {
      setClauses.push(`"level" = $${paramIndex++}`);
      values.push(updates.level);
    }
    if (updates.scale !== undefined) {
      setClauses.push(`"scale" = $${paramIndex++}`);
      values.push(updates.scale);
    }
    if (updates.linkval !== undefined) {
      setClauses.push(`"linkval" = $${paramIndex++}`);
      values.push(updates.linkval);
    }
    if (updates.linkmarkers !== undefined) {
      setClauses.push(`"linkmarkers" = $${paramIndex++}::"LinkMarker"[]`);
      values.push(updates.linkmarkers);
    }
    if (updates.attribute !== undefined) {
      setClauses.push(`"attribute" = $${paramIndex++}::"Attribute"`);
      values.push(updates.attribute);
    }

    await this.postgresPoolProvider.client.query(
      `UPDATE "cards" SET ${setClauses.join(', ')} WHERE "id" = $1`,
      values,
    );
  }

  async clearManualEditFlag(id: string): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `UPDATE "cards" SET "manually_edited" = false, "manually_edited_at" = NULL WHERE "id" = $1`,
      [id],
    );
  }

  async isManuallyEdited(id: string): Promise<boolean> {
    const result = await this.postgresPoolProvider.client.query<{
      manually_edited: boolean;
    }>(`SELECT "manually_edited" FROM "cards" WHERE "id" = $1 LIMIT 1`, [id]);

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].manually_edited;
  }

  async getManuallyEditedCardIds(): Promise<string[]> {
    const result = await this.postgresPoolProvider.client.query<{ id: string }>(
      `SELECT "id" FROM "cards" WHERE "manually_edited" = true`,
    );

    return result.rows.map((row) => row.id);
  }

  async delete(id: string): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `DELETE FROM "cards" WHERE "id" = $1`,
      [id],
    );
  }
}

function buildFieldUpdateClauses(
  id: string,
  updates: Record<string, unknown>,
  startParamIndex: number,
): { setClauses: string[]; values: unknown[] } {
  const setClauses: string[] = [];
  const values: unknown[] = [id];
  let paramIndex = startParamIndex;

  const fieldMappings: Record<string, string> = {
    name: '"name"',
    typeline: '"typeline"',
    type: '"type"',
    humanReadableCardType: '"human_readable_card_type"',
    frameType: '"frame_type"',
    desc: '"desc"',
    race: '"race"',
    atk: '"atk"',
    def: '"def"',
    level: '"level"',
    scale: '"scale"',
    linkval: '"linkval"',
    linkmarkers: '"linkmarkers"',
    attribute: '"attribute"',
  };

  const typedMappings: Record<string, string> = {
    frameType: '::"FrameType"',
    race: '::"Race"',
    linkmarkers: '::"LinkMarker"[]',
    attribute: '::"Attribute"',
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const column = fieldMappings[key];
    if (!column) continue;

    const typeCast = typedMappings[key] || '';
    setClauses.push(`${column} = $${paramIndex++}${typeCast}`);
    values.push(value);
  }

  return { setClauses, values };
}
