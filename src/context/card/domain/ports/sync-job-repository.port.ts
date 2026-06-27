export interface SyncJobRow {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  recordsProcessed: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class SyncJobRepositoryPort {
  abstract create(): Promise<string>;
  abstract update(
    id: string,
    partial: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
      recordsProcessed?: number;
      errorMessage?: string | null;
    },
  ): Promise<void>;
  abstract findLast(): Promise<SyncJobRow | null>;
  abstract findInProgress(): Promise<SyncJobRow | null>;
}
