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

  async execute(processId: string, snapshotId?: string): Promise<void> {
    const snapshot = await this.processRepository.findById(processId);
    if (!snapshot) return;

    const process = ImportProcess.pending(
      snapshot.id,
      new Date(snapshot.createdAt),
    );
    process.start();

    try {
      const selectedSnapshot = snapshotId ?? (await this.source.download()).id;
      const batchSize = 100;
      let batch = [];
      let total = 0;
      for await (const card of this.source.read(selectedSnapshot)) {
        batch.push(card);
        total += 1;
        if (batch.length < batchSize) continue;
        const result = await this.cardRepository.upsertMany(batch);
        process.setTotal(total);
        process.recordBatch(result.succeeded, result.failed);
        await this.processRepository.save(process);
        batch = [];
      }
      if (batch.length > 0) {
        const result = await this.cardRepository.upsertMany(batch);
        process.setTotal(total);
        process.recordBatch(result.succeeded, result.failed);
        await this.processRepository.save(process);
      }

      process.complete();
      if (snapshotId) await this.source.publish(snapshotId);
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
