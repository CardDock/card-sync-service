export abstract class ImportWorkerPort {
  abstract enqueue(processId: string, snapshotId?: string): void;
}
