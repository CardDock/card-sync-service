import { SqliteCardSourcePort } from '../../domain/ports/sqlite-card-source.port';
import { SyncJobRepositoryPort } from '../../domain/ports/sync-job-repository.port';
import { CardTranslationRepositoryPort } from '../../domain/ports/card-translation-repository.port';
import { Logger } from '../../domain/ports/logger.port';

const CHUNK_SIZE = 500;

export class SyncTranslationsUseCase {
  constructor(
    private readonly sqliteSource: SqliteCardSourcePort,
    private readonly syncJobRepository: SyncJobRepositoryPort,
    private readonly translationRepository: CardTranslationRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(jobId: string, language: string): Promise<void> {
    let totalProcessed = 0;

    try {
      this.logger.info({ jobId, language }, 'Sync translations: started');

      await this.syncJobRepository.update(jobId, { status: 'IN_PROGRESS' });

      const total = this.sqliteSource.count(language);
      this.logger.info(
        { jobId, language, total },
        'Sync translations: total cards to process',
      );

      let offset = 0;

      while (offset < total) {
        const rows = this.sqliteSource.readChunk(CHUNK_SIZE, offset, language);

        if (rows.length === 0) break;

        await this.translationRepository.batchUpsert(
          rows.map((r) => ({
            cardId: r.cardId,
            language,
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
          {
            jobId,
            language,
            processed: totalProcessed,
            total,
            chunk: rows.length,
          },
          'Sync translations: chunk processed',
        );
      }

      await this.syncJobRepository.update(jobId, {
        status: 'SUCCESS',
        recordsProcessed: totalProcessed,
      });

      this.logger.info(
        { jobId, language, totalProcessed },
        'Sync translations: completed',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        { jobId, language, error: message, err: { message, stack } },
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
