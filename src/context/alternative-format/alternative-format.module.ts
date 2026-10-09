import { Module } from '@nestjs/common';
import { EdisonCardsRepositoryPort } from './application/ports/edison-cards-repository.port';
import { GoatCardsRepositoryPort } from './application/ports/goat-cards-repository.port';
import { HatCardsRepositoryPort } from './application/ports/hat-cards-repository.port';
import { GetEdisonCardFormatUseCase } from './application/use-cases/get-edison-card-format.use-case';
import { GetGoatCardFormatUseCase } from './application/use-cases/get-goat-card-format.use-case';
import { GetHatCardFormatUseCase } from './application/use-cases/get-hat-card-format.use-case';
import { SyncEdisonCardsUseCase } from './application/use-cases/sync-edison-cards.use-case';
import { SyncGoatCardsUseCase } from './application/use-cases/sync-goat-cards.use-case';
import { SyncHatCardsUseCase } from './application/use-cases/sync-hat-cards.use-case';
import { AlternativeFormatController } from './infrastructure/http/alternative-format.controller';
import { MongoDbEdisonCardsRepository } from './infrastructure/mongodb-edison-cards.repository';
import { MongoDbGoatCardsRepository } from './infrastructure/mongodb-goat-cards.repository';
import { MongoDbHatCardsRepository } from './infrastructure/mongodb-hat-cards.repository';
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
    {
      provide: GoatCardsRepositoryPort,
      useClass: MongoDbGoatCardsRepository,
    },
    {
      provide: SyncGoatCardsUseCase,
      useFactory: (repository: GoatCardsRepositoryPort) =>
        new SyncGoatCardsUseCase(repository),
      inject: [GoatCardsRepositoryPort],
    },
    {
      provide: GetGoatCardFormatUseCase,
      useFactory: (repository: GoatCardsRepositoryPort) =>
        new GetGoatCardFormatUseCase(repository),
      inject: [GoatCardsRepositoryPort],
    },
    {
      provide: HatCardsRepositoryPort,
      useClass: MongoDbHatCardsRepository,
    },
    {
      provide: SyncHatCardsUseCase,
      useFactory: (repository: HatCardsRepositoryPort) =>
        new SyncHatCardsUseCase(repository),
      inject: [HatCardsRepositoryPort],
    },
    {
      provide: GetHatCardFormatUseCase,
      useFactory: (repository: HatCardsRepositoryPort) =>
        new GetHatCardFormatUseCase(repository),
      inject: [HatCardsRepositoryPort],
    },
  ],
})
export class AlternativeFormatModule {}
