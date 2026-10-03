import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ImportProcess } from '../../domain/import-process';
import { ImportProcessRepositoryPort } from '../ports/import-process-repository.port';
import { ImportWorkerPort } from '../ports/import-worker.port';

@Injectable()
export class StartCardImportUseCase {
  constructor(
    private readonly processRepository: ImportProcessRepositoryPort,
    private readonly worker: ImportWorkerPort,
  ) {}

  async execute() {
    const process = ImportProcess.pending(randomUUID());
    const acquired = await this.processRepository.acquireActiveLock(process.id);

    if (!acquired) return null;

    await this.processRepository.save(process);
    this.worker.enqueue(process.id);
    return process.snapshot();
  }
}
