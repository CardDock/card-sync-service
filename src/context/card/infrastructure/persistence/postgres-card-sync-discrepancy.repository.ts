import { Injectable } from '@nestjs/common';
import {
  CardSyncDiscrepancyRepositoryPort,
  CardSyncDiscrepancyRecord,
  DiscrepancyStatus,
} from '../../domain/ports/card-sync-discrepancy-repository.port';
import { PostgresPoolProvider } from './postgres-pool.provider';

interface CardSyncDiscrepancyRow {
  id: string;
  card_id: string;
  field_name: string;
  local_value: unknown;
  api_value: unknown;
  status: DiscrepancyStatus;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresCardSyncDiscrepancyRepository implements CardSyncDiscrepancyRepositoryPort {
  constructor(private readonly postgresPoolProvider: PostgresPoolProvider) {}

  async upsert(
    cardId: string,
    fieldName: string,
    localValue: unknown,
    apiValue: unknown,
  ): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `
      INSERT INTO "card_sync_discrepancies" (
        "id",
        "card_id",
        "field_name",
        "local_value",
        "api_value",
        "status"
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3::jsonb, $4::jsonb, 'PENDING'
      )
      ON CONFLICT ("card_id", "field_name") DO UPDATE SET
        "local_value" = EXCLUDED."local_value",
        "api_value" = EXCLUDED."api_value",
        "status" = 'PENDING',
        "updated_at" = NOW()
    `,
      [cardId, fieldName, JSON.stringify(localValue), JSON.stringify(apiValue)],
    );
  }

  async findByCardId(cardId: string): Promise<CardSyncDiscrepancyRecord[]> {
    const result =
      await this.postgresPoolProvider.client.query<CardSyncDiscrepancyRow>(
        `
        SELECT
          "id",
          "card_id",
          "field_name",
          "local_value",
          "api_value",
          "status",
          "created_at",
          "updated_at"
        FROM "card_sync_discrepancies"
        WHERE "card_id" = $1
        ORDER BY "field_name"
      `,
        [cardId],
      );

    return result.rows.map(mapRowToDiscrepancy);
  }

  async findAll(
    status?: DiscrepancyStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: CardSyncDiscrepancyRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 0;

    if (status) {
      paramIndex++;
      conditions.push(`"status" = $${paramIndex}::"DiscrepancyStatus"`);
      params.push(status);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.postgresPoolProvider.client.query<{
      count: number;
    }>(
      `SELECT COUNT(*) AS "count" FROM "card_sync_discrepancies" ${whereClause}`,
      params,
    );

    const total = Number(countResult.rows[0].count);
    const offset = (page - 1) * limit;

    const dataResult =
      await this.postgresPoolProvider.client.query<CardSyncDiscrepancyRow>(
        `
        SELECT
          "id",
          "card_id",
          "field_name",
          "local_value",
          "api_value",
          "status",
          "created_at",
          "updated_at"
        FROM "card_sync_discrepancies"
        ${whereClause}
        ORDER BY "created_at" DESC
        LIMIT $${paramIndex + 1}
        OFFSET $${paramIndex + 2}
      `,
        [...params, limit, offset],
      );

    return {
      items: dataResult.rows.map(mapRowToDiscrepancy),
      total,
      page,
      limit,
    };
  }

  async updateStatus(id: string, status: DiscrepancyStatus): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `UPDATE "card_sync_discrepancies" SET "status" = $2::"DiscrepancyStatus", "updated_at" = NOW() WHERE "id" = $1`,
      [id, status],
    );
  }

  async deleteByCardIdAndFieldName(
    cardId: string,
    fieldName: string,
  ): Promise<void> {
    await this.postgresPoolProvider.client.query(
      `DELETE FROM "card_sync_discrepancies" WHERE "card_id" = $1 AND "field_name" = $2`,
      [cardId, fieldName],
    );
  }
}

function mapRowToDiscrepancy(
  row: CardSyncDiscrepancyRow,
): CardSyncDiscrepancyRecord {
  return {
    id: row.id,
    cardId: row.card_id,
    fieldName: row.field_name,
    localValue: row.local_value,
    apiValue: row.api_value,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
