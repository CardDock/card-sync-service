import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { ImportProcessRepositoryPort } from '../application/ports/import-process-repository.port';
import { ImportProcess } from '../domain/import-process';
import { MONGO_DATABASE } from './mongodb.provider';

type ProcessDocument = ReturnType<ImportProcess['snapshot']> & { _id: string };
type LockDocument = { _id: string; processId: string; createdAt: Date };

@Injectable()
export class MongoDbImportProcessRepositoryAdapter implements ImportProcessRepositoryPort {
  private readonly processCollection = 'card_import_processes';
  private readonly lockCollection = 'card_import_locks';

  constructor(@Inject(MONGO_DATABASE) private readonly database: Db) {}

  async acquireActiveLock(processId: string): Promise<boolean> {
    try {
      await this.database
        .collection<LockDocument>(this.lockCollection)
        .insertOne({
          _id: 'active',
          processId,
          createdAt: new Date(),
        });
      return true;
    } catch (error) {
      if (error?.code === 11000) return false;
      throw error;
    }
  }

  async releaseActiveLock(): Promise<void> {
    await this.database
      .collection<LockDocument>(this.lockCollection)
      .deleteOne({ _id: 'active' });
  }

  async save(process: ImportProcess): Promise<void> {
    const snapshot = process.snapshot();
    await this.database
      .collection<ProcessDocument>(this.processCollection)
      .updateOne(
        { _id: snapshot.id },
        { $set: snapshot, $setOnInsert: { _id: snapshot.id } },
        { upsert: true },
      );
  }

  async findById(processId: string) {
    const document = await this.database
      .collection<ProcessDocument>(this.processCollection)
      .findOne({ _id: processId });
    if (!document) return null;
    const { _id, ...snapshot } = document;
    return snapshot as ReturnType<ImportProcess['snapshot']>;
  }
}
