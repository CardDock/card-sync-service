export abstract class ImportWorkerPort {
  abstract enqueue(processId: string): void;
}
