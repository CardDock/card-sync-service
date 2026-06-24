import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from '../../domain/ports/logger.port';
import { TransactionManagerPort } from '../../domain/ports/transaction-manager.port';
import { AsyncLocalStorage } from 'async_hooks';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class PostgresPoolProvider
  implements OnModuleDestroy, TransactionManagerPort
{
  private readonly pool: Pool;
  private readonly als = new AsyncLocalStorage<PoolClient>();

  constructor(private readonly logger: Logger) {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DIRECT_URL or DATABASE_URL is required');
    }

    this.pool = new Pool({ connectionString });
  }

  get client(): Pool | PoolClient {
    return this.als.getStore() ?? this.pool;
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await this.als.run(client, fn);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
