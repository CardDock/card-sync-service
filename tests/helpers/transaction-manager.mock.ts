import { TransactionManagerPort } from '../../src/context/card/domain/ports/transaction-manager.port';

export const buildTransactionManagerMock =
  (): jest.Mocked<TransactionManagerPort> =>
    ({
      transaction: jest.fn((fn: () => Promise<unknown>) => fn()),
    }) as unknown as jest.Mocked<TransactionManagerPort>;
