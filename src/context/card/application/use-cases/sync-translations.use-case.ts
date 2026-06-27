import { SqliteCardSourcePort } from '../../domain/ports/sqlite-card-source.port';
import { SyncJobRepositoryPort } from '../../domain/ports/sync-job-repository.port';
import { CardRepositoryPort } from '../../domain/ports/card-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { Logger } from '../../domain/ports/logger.port';

const CHUNK_SIZE = 500;
const LANGUAGE = 'es';

export class SyncTranslationsUseCase {
  constructor(
    private readonly sqliteSource: SqliteCardSourcePort,
    private readonly syncJobRepository: SyncJobRepositoryPort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly translationRepository: CardTranslationRepositoryPort,
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

        await this.cardRepository.batchInsertStubs(rows);
        await this.translationRepository.batchUpsert(
          rows.map((r) => ({
            cardId: r.cardId,
            language: LANGUAGE,
            name: r.name,
            desc: r.desc,
          })),
        );

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
}
