import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Logger } from './domain/ports/logger.port';
import { PinoLoggerAdapter } from './infrastructure/persistence/pino-logger.adapter';
import { LoggingInterceptor } from './infrastructure/http/logging.interceptor';
import { FindOrSyncCardByExternalIdUseCase } from './application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from './application/use-cases/search-card-by-name.use-case';
import { RegisterPhysicalCardUseCase } from './application/use-cases/register-physical-card.use-case';
import { CardController } from './infrastructure/http/card.controller';
import { YgoProDeckExternalCardSource } from './infrastructure/external/ygoprodeck-card-source';
import { PostgresCardRepository } from './infrastructure/persistence/postgres-card.repository';
import { PostgresCardRelatedDataRepository } from './infrastructure/persistence/postgres-card-related-data.repository';
import { PostgresPhysicalCardRepository } from './infrastructure/persistence/postgres-physical-card.repository';
import { PostgresPoolProvider } from './infrastructure/persistence/postgres-pool.provider';

@Module({
  controllers: [CardController],
  providers: [
    PostgresPoolProvider,
    PostgresCardRepository,
    PostgresCardRelatedDataRepository,
    PostgresPhysicalCardRepository,
    YgoProDeckExternalCardSource,
    { provide: Logger, useClass: PinoLoggerAdapter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    {
      provide: FindOrSyncCardByExternalIdUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        postgresPoolProvider: PostgresPoolProvider,
        logger: Logger,
      ) =>
        new FindOrSyncCardByExternalIdUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          postgresPoolProvider,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        PostgresPoolProvider,
        Logger,
      ],
    },
    {
      provide: SearchCardByNameUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        postgresPoolProvider: PostgresPoolProvider,
        logger: Logger,
      ) =>
        new SearchCardByNameUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          postgresPoolProvider,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        PostgresPoolProvider,
        Logger,
      ],
    },
    {
      provide: RegisterPhysicalCardUseCase,
      useFactory: (
        physicalCardRepository: PostgresPhysicalCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) =>
        new RegisterPhysicalCardUseCase(
          physicalCardRepository,
          cardRelatedDataRepository,
          logger,
        ),
      inject: [
        PostgresPhysicalCardRepository,
        PostgresCardRelatedDataRepository,
        Logger,
      ],
    },
  ],
  exports: [
    FindOrSyncCardByExternalIdUseCase,
    SearchCardByNameUseCase,
    RegisterPhysicalCardUseCase,
  ],
})
export class CardModule {}
