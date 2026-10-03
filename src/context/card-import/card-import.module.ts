import { Module } from '@nestjs/common';
import { CardImportSourcePort } from './application/ports/card-import-source.port';
import { CardRepositoryPort } from './application/ports/card-repository.port';
import { ImportProcessRepositoryPort } from './application/ports/import-process-repository.port';
import { ImportWorkerPort } from './application/ports/import-worker.port';
import { GetCardImportStatusUseCase } from './application/use-cases/get-card-import-status.use-case';
import { RunCardImportUseCase } from './application/use-cases/run-card-import.use-case';
import { StartCardImportUseCase } from './application/use-cases/start-card-import.use-case';
import { CardImportController } from './infrastructure/card-import.controller';
import { FileCardImportSourceAdapter } from './infrastructure/file-card-import-source.adapter';
import { InMemoryImportWorkerAdapter } from './infrastructure/in-memory-import-worker.adapter';
import { MongoDbCardRepositoryAdapter } from './infrastructure/mongodb-card-repository.adapter';
import { MongoDbImportProcessRepositoryAdapter } from './infrastructure/mongodb-import-process-repository.adapter';
import {
  mongoClientProvider,
  mongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [CardImportController],
  providers: [
    mongoClientProvider,
    mongoDatabaseProvider,
    { provide: CardImportSourcePort, useClass: FileCardImportSourceAdapter },
    { provide: CardRepositoryPort, useClass: MongoDbCardRepositoryAdapter },
    {
      provide: ImportProcessRepositoryPort,
      useClass: MongoDbImportProcessRepositoryAdapter,
    },
    { provide: ImportWorkerPort, useClass: InMemoryImportWorkerAdapter },
    RunCardImportUseCase,
    StartCardImportUseCase,
    GetCardImportStatusUseCase,
  ],
})
export class CardImportModule {}
