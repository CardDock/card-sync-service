import { SqliteCardSourcePort } from '../../domain/ports/sqlite-card-source.port';
import { SyncJobRepositoryPort } from '../../domain/ports/sync-job-repository.port';
import { PostgresPoolProvider } from '../../infrastructure/persistence/postgres-pool.provider';
import { Logger } from '../../domain/ports/logger.port';

const CHUNK_SIZE = 500;

export class SyncTranslationsUseCase {
  constructor(
    private readonly sqliteSource: SqliteCardSourcePort,
    private readonly syncJobRepository: SyncJobRepositoryPort,
    private readonly pool: PostgresPoolProvider,
    private readonly logger: Logger,
  ) {}

  async execute(jobId: string): Promise<void> {
    let totalProcessed = 0;

    try {
      this.logger.info({ jobId }, 'Sync translations: started');

      await this.syncJobRepository.update(jobId, { status: 'IN_PROGRESS' });

      const total = this.sqliteSource.count();
      this.logger.info(
        { jobId, total },
        'Sync translations: total cards to process',
      );

      let offset = 0;

      while (offset < total) {
        const rows = this.sqliteSource.readChunk(CHUNK_SIZE, offset);

        if (rows.length === 0) break;

        await this.batchInsertStubs(rows);
        await this.batchUpsert(rows);

        totalProcessed += rows.length;
        offset += rows.length;

        await this.syncJobRepository.update(jobId, {
          recordsProcessed: totalProcessed,
        });

        this.logger.info(
          { jobId, processed: totalProcessed, total, chunk: rows.length },
          'Sync translations: chunk processed',
        );
      }

      await this.syncJobRepository.update(jobId, {
        status: 'SUCCESS',
        recordsProcessed: totalProcessed,
      });

      this.logger.info(
        { jobId, totalProcessed },
        'Sync translations: completed',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        { jobId, error: message, err: { message, stack } },
        'Sync translations: failed',
      );

      await this.syncJobRepository.update(jobId, {
        status: 'FAILED',
        recordsProcessed: totalProcessed,
        errorMessage: message,
      });
    }
  }

  private async batchInsertStubs(
    rows: { cardId: string; name: string; desc: string }[],
  ): Promise<void> {
    const values: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const row of rows) {
      values.push(
        `($${idx++}, $${idx++}, $${idx++}::text[], $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb)`,
      );
      params.push(
        row.cardId,
        `__CARD_${row.cardId}__`,
        [],
        'Stub',
        'Stub',
        'normal',
        '',
        'Normal',
        {},
      );
    }

    await this.pool.client.query(
      `INSERT INTO "cards" ("id", "name", "typeline", "type", "human_readable_card_type", "frame_type", "desc", "race", "rawData") VALUES ${values.join(', ')} ON CONFLICT ("id") DO NOTHING`,
      params,
    );
  }

  private async batchUpsert(
    rows: { cardId: string; name: string; desc: string }[],
  ): Promise<void> {
    const values: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const row of rows) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(row.cardId, 'es', row.name, row.desc);
    }

    await this.pool.client.query(
      `INSERT INTO "card_translations" ("card_id", "language", "name", "desc") VALUES ${values.join(', ')} ON CONFLICT ("card_id", "language") DO UPDATE SET "name" = EXCLUDED."name", "desc" = EXCLUDED."desc"`,
      params,
    );
  }
}
