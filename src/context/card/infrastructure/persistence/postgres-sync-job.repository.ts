import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SyncJobRepositoryPort,
  SyncJobRow,
} from '../../domain/ports/sync-job-repository.port';
import { PostgresPoolProvider } from './postgres-pool.provider';

@Injectable()
export class PostgresSyncJobRepository implements SyncJobRepositoryPort {
  constructor(private readonly pool: PostgresPoolProvider) {}

  async create(): Promise<string> {
    const id = uuidv4();
    await this.pool.client.query(
      `INSERT INTO "sync_job_logs" ("id", "status") VALUES ($1, 'PENDING')`,
      [id],
    );
    return id;
  }

  async update(
    id: string,
    partial: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
      recordsProcessed?: number;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (partial.status !== undefined) {
      sets.push(`"status" = $${idx++}`);
      params.push(partial.status);
    }
    if (partial.recordsProcessed !== undefined) {
      sets.push(`"records_processed" = $${idx++}`);
      params.push(partial.recordsProcessed);
    }
    if (partial.errorMessage !== undefined) {
      sets.push(`"error_message" = $${idx++}`);
      params.push(partial.errorMessage);
    }

    if (sets.length === 0) return;

    params.push(id);
    await this.pool.client.query(
      `UPDATE "sync_job_logs" SET ${sets.join(', ')} WHERE "id" = $${idx}`,
      params,
    );
  }

  async findLast(): Promise<SyncJobRow | null> {
    const result = await this.pool.client.query<SyncJobRow>(
      `SELECT "id", "status", "records_processed" AS "recordsProcessed", "error_message" AS "errorMessage", "created_at" AS "createdAt", "updated_at" AS "updatedAt" FROM "sync_job_logs" ORDER BY "created_at" DESC LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }

  async findInProgress(): Promise<SyncJobRow | null> {
    const result = await this.pool.client.query<SyncJobRow>(
      `SELECT "id", "status", "records_processed" AS "recordsProcessed", "error_message" AS "errorMessage", "created_at" AS "createdAt", "updated_at" AS "updatedAt" FROM "sync_job_logs" WHERE "status" = 'IN_PROGRESS' ORDER BY "created_at" DESC LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }
}
