import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Logger } from './domain/ports/logger.port';
import { PinoLoggerAdapter } from './infrastructure/persistence/pino-logger.adapter';
import { LoggingInterceptor } from './infrastructure/http/logging.interceptor';
import { TransactionManagerPort } from './domain/ports/transaction-manager.port';
import { FindOrSyncCardByExternalIdUseCase } from './application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from './application/use-cases/search-card-by-name.use-case';
import { ListCardsUseCase } from './application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from './application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from './application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from './application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from './application/use-cases/sync-card.use-case';
import { CardController } from './infrastructure/http/card.controller';
import { YgoProDeckExternalCardSource } from './infrastructure/external/ygoprodeck-card-source';
import { PostgresCardRepository } from './infrastructure/persistence/postgres-card.repository';
import { PostgresCardRelatedDataRepository } from './infrastructure/persistence/postgres-card-related-data.repository';
import { PostgresPoolProvider } from './infrastructure/persistence/postgres-pool.provider';

@Module({
  controllers: [CardController],
  providers: [
    PostgresPoolProvider,
    { provide: TransactionManagerPort, useClass: PostgresPoolProvider },
    PostgresCardRepository,
    PostgresCardRelatedDataRepository,
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
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new FindOrSyncCardByExternalIdUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          transactionManager,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        TransactionManagerPort,
        Logger,
      ],
    },
    {
      provide: SearchCardByNameUseCase,
      useFactory: (
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new SearchCardByNameUseCase(
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          transactionManager,
          logger,
        ),
      inject: [
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        TransactionManagerPort,
        Logger,
      ],
    },
    {
      provide: ListCardsUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        logger: Logger,
      ) => new ListCardsUseCase(cardQueryRepository, logger),
      inject: [PostgresCardRepository, Logger],
    },
    {
      provide: GetCardPrintsUseCase,
      useFactory: (
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) => new GetCardPrintsUseCase(cardRelatedDataRepository, logger),
      inject: [PostgresCardRelatedDataRepository, Logger],
    },
    {
      provide: GetCardArtworksUseCase,
      useFactory: (
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) => new GetCardArtworksUseCase(cardRelatedDataRepository, logger),
      inject: [PostgresCardRelatedDataRepository, Logger],
    },
    {
      provide: ListCardSetsUseCase,
      useFactory: (
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) => new ListCardSetsUseCase(cardRelatedDataRepository, logger),
      inject: [PostgresCardRelatedDataRepository, Logger],
    },
    {
      provide: SyncCardUseCase,
      useFactory: (
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new SyncCardUseCase(
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          transactionManager,
          logger,
        ),
      inject: [
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        TransactionManagerPort,
        Logger,
      ],
    },
  ],
  exports: [
    FindOrSyncCardByExternalIdUseCase,
    SearchCardByNameUseCase,
    ListCardsUseCase,
    GetCardPrintsUseCase,
    GetCardArtworksUseCase,
    ListCardSetsUseCase,
    SyncCardUseCase,
  ],
})
export class CardModule {}
