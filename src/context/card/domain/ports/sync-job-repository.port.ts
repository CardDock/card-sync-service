export interface SyncJobRow {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  language: string;
  recordsProcessed: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class SyncJobRepositoryPort {
  abstract create(language: string): Promise<string>;
  abstract update(
    id: string,
    partial: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
      recordsProcessed?: number;
      errorMessage?: string | null;
    },
  ): Promise<void>;
  abstract findLast(language?: string): Promise<SyncJobRow | null>;
  abstract findInProgress(language?: string): Promise<SyncJobRow | null>;
}
