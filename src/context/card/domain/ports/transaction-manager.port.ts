export abstract class TransactionManagerPort {
  abstract transaction<T>(fn: () => Promise<T>): Promise<T>;
}
