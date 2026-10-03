import { Injectable } from '@nestjs/common';
import { CardImportSourcePort } from '../ports/card-import-source.port';
import { CardRepositoryPort } from '../ports/card-repository.port';
import { ImportProcessRepositoryPort } from '../ports/import-process-repository.port';
import { ImportProcess } from '../../domain/import-process';

@Injectable()
export class RunCardImportUseCase {
  constructor(
    private readonly source: CardImportSourcePort,
    private readonly cardRepository: CardRepositoryPort,
    private readonly processRepository: ImportProcessRepositoryPort,
  ) {}

  async execute(processId: string): Promise<void> {
    const snapshot = await this.processRepository.findById(processId);
    if (!snapshot) return;

    const process = ImportProcess.pending(
      snapshot.id,
      new Date(snapshot.createdAt),
    );
    process.start();

    try {
      const cards = await this.source.read();
      process.setTotal(cards.length);
      await this.processRepository.save(process);

      const batchSize = 100;
      for (let index = 0; index < cards.length; index += batchSize) {
        const result = await this.cardRepository.upsertMany(
          cards.slice(index, index + batchSize),
        );
        process.recordBatch(result.succeeded, result.failed);
        await this.processRepository.save(process);
      }

      process.complete();
      await this.processRepository.save(process);
    } catch (error) {
      process.fail(
        error instanceof Error ? error.message : 'Card import failed',
      );
      await this.processRepository.save(process);
    } finally {
      await this.processRepository.releaseActiveLock();
    }
  }
}
