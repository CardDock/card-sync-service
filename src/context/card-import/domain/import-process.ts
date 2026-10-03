export enum ImportProcessStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ImportProcessCounters = {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
};

export class ImportProcess {
  private constructor(
    readonly id: string,
    private status: ImportProcessStatus,
    private counters: ImportProcessCounters,
    readonly createdAt: Date,
    private startedAt?: Date,
    private finishedAt?: Date,
    private error?: string,
  ) {}

  static pending(id: string, createdAt = new Date()): ImportProcess {
    return new ImportProcess(
      id,
      ImportProcessStatus.PENDING,
      { total: 0, processed: 0, succeeded: 0, failed: 0 },
      createdAt,
    );
  }

  start(startedAt = new Date()): void {
    if (this.status !== ImportProcessStatus.PENDING) {
      throw new Error('Only pending import processes can start');
    }
    this.status = ImportProcessStatus.RUNNING;
    this.startedAt = startedAt;
  }

  setTotal(total: number): void {
    this.counters = { ...this.counters, total };
  }

  recordBatch(succeeded: number, failed: number): void {
    this.counters = {
      ...this.counters,
      processed: this.counters.processed + succeeded + failed,
      succeeded: this.counters.succeeded + succeeded,
      failed: this.counters.failed + failed,
    };
  }

  complete(finishedAt = new Date()): void {
    this.status = ImportProcessStatus.COMPLETED;
    this.finishedAt = finishedAt;
  }

  fail(error: string, finishedAt = new Date()): void {
    this.status = ImportProcessStatus.FAILED;
    this.error = error;
    this.finishedAt = finishedAt;
  }

  snapshot() {
    return {
      id: this.id,
      status: this.status,
      counters: { ...this.counters },
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      error: this.error,
    };
  }
}
