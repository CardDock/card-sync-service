import { Injectable } from '@nestjs/common';
import { ImportWorkerPort } from '../application/ports/import-worker.port';
import { RunCardImportUseCase } from '../application/use-cases/run-card-import.use-case';

@Injectable()
export class InMemoryImportWorkerAdapter implements ImportWorkerPort {
  constructor(private readonly runImport: RunCardImportUseCase) {}

  enqueue(processId: string): void {
    setImmediate(() => void this.runImport.execute(processId));
  }
}
