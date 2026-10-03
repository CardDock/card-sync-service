import { ImportProcess } from '../../domain/import-process';

export abstract class ImportProcessRepositoryPort {
  abstract acquireActiveLock(processId: string): Promise<boolean>;
  abstract releaseActiveLock(): Promise<void>;
  abstract save(process: ImportProcess): Promise<void>;
  abstract findById(
    processId: string,
  ): Promise<ReturnType<ImportProcess['snapshot']> | null>;
}
