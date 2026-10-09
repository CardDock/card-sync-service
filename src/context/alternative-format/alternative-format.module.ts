import { Module } from '@nestjs/common';
import { EdisonCardsRepositoryPort } from './application/ports/edison-cards-repository.port';
import { GetEdisonCardFormatUseCase } from './application/use-cases/get-edison-card-format.use-case';
import { SyncEdisonCardsUseCase } from './application/use-cases/sync-edison-cards.use-case';
import { AlternativeFormatController } from './infrastructure/http/alternative-format.controller';
import { MongoDbEdisonCardsRepository } from './infrastructure/mongodb-edison-cards.repository';
import {
  alternativeFormatMongoClientProvider,
  alternativeFormatMongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [AlternativeFormatController],
  providers: [
    alternativeFormatMongoClientProvider,
    alternativeFormatMongoDatabaseProvider,
    {
      provide: EdisonCardsRepositoryPort,
      useClass: MongoDbEdisonCardsRepository,
    },
    {
      provide: SyncEdisonCardsUseCase,
      useFactory: (repository: EdisonCardsRepositoryPort) =>
        new SyncEdisonCardsUseCase(repository),
      inject: [EdisonCardsRepositoryPort],
    },
    {
      provide: GetEdisonCardFormatUseCase,
      useFactory: (repository: EdisonCardsRepositoryPort) =>
        new GetEdisonCardFormatUseCase(repository),
      inject: [EdisonCardsRepositoryPort],
    },
  ],
})
export class AlternativeFormatModule {}
