import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Logger } from './domain/ports/logger.port';
import { PinoLoggerAdapter } from './infrastructure/persistence/pino-logger.adapter';
import { LoggingInterceptor } from './infrastructure/http/logging.interceptor';
import { TransactionManagerPort } from './domain/ports/transaction-manager.port';
import { CardTranslationRepositoryPort } from './domain/ports/card-translation-repository.port';
import { CardSyncDiscrepancyRepositoryPort } from './domain/ports/card-sync-discrepancy-repository.port';
import { FindOrSyncCardByExternalIdUseCase } from './application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from './application/use-cases/search-card-by-name.use-case';
import { ListCardsUseCase } from './application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from './application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from './application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from './application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from './application/use-cases/sync-card.use-case';
import { GetCardImageUseCase } from './application/use-cases/get-card-image.use-case';
import { UpdateCardUseCase } from './application/use-cases/update-card.use-case';
import { SetCardTranslationUseCase } from './application/use-cases/set-card-translation.use-case';
import { AddCardArtworkUseCase } from './application/use-cases/add-card-artwork.use-case';
import { AddCardPrintUseCase } from './application/use-cases/add-card-print.use-case';
import { DeleteCardUseCase } from './application/use-cases/delete-card.use-case';
import { ListCardDiscrepanciesUseCase } from './application/use-cases/list-card-discrepancies.use-case';
import { ResolveCardDiscrepancyUseCase } from './application/use-cases/resolve-card-discrepancy.use-case';
import { CardController } from './infrastructure/http/card.controller';
import { MediaController } from './infrastructure/http/media.controller';
import { NotFoundExceptionFilter } from './infrastructure/http/not-found-exception.filter';
import { YgoProDeckExternalCardSource } from './infrastructure/external/ygoprodeck-card-source';
import { YgoProDeckImageSourceAdapter } from './infrastructure/external/ygoprodeck-image-source';
import { PostgresCardRepository } from './infrastructure/persistence/postgres-card.repository';
import { PostgresCardRelatedDataRepository } from './infrastructure/persistence/postgres-card-related-data.repository';
import { PostgresCardTranslationRepository } from './infrastructure/persistence/postgres-card-translation.repository';
import { PostgresCardSyncDiscrepancyRepository } from './infrastructure/persistence/postgres-card-sync-discrepancy.repository';
import { PostgresPoolProvider } from './infrastructure/persistence/postgres-pool.provider';
import { ImageStoragePort } from './domain/ports/image-storage.port';
import { ExternalImageSourcePort } from './domain/ports/external-image-source.port';
import { LocalImageStorageAdapter } from './infrastructure/storage/local-image-storage.adapter';

@Module({
  controllers: [CardController, MediaController],
  providers: [
    PostgresPoolProvider,
    { provide: TransactionManagerPort, useClass: PostgresPoolProvider },
    PostgresCardRepository,
    PostgresCardRelatedDataRepository,
    PostgresCardTranslationRepository,
    PostgresCardSyncDiscrepancyRepository,
    {
      provide: CardTranslationRepositoryPort,
      useClass: PostgresCardTranslationRepository,
    },
    {
      provide: CardSyncDiscrepancyRepositoryPort,
      useClass: PostgresCardSyncDiscrepancyRepository,
    },
    YgoProDeckExternalCardSource,
    YgoProDeckImageSourceAdapter,
    { provide: ImageStoragePort, useClass: LocalImageStorageAdapter },
    {
      provide: ExternalImageSourcePort,
      useClass: YgoProDeckImageSourceAdapter,
    },
    { provide: Logger, useClass: PinoLoggerAdapter },
    NotFoundExceptionFilter,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    {
      provide: FindOrSyncCardByExternalIdUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        cardTranslationRepository: CardTranslationRepositoryPort,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new FindOrSyncCardByExternalIdUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          cardTranslationRepository,
          transactionManager,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        CardTranslationRepositoryPort,
        TransactionManagerPort,
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
        cardTranslationRepository: CardTranslationRepositoryPort,
        cardSyncDiscrepancyRepository: CardSyncDiscrepancyRepositoryPort,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new SearchCardByNameUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          cardTranslationRepository,
          cardSyncDiscrepancyRepository,
          transactionManager,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        CardTranslationRepositoryPort,
        CardSyncDiscrepancyRepositoryPort,
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
        cardQueryRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        cardSyncDiscrepancyRepository: CardSyncDiscrepancyRepositoryPort,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new SyncCardUseCase(
          externalCardSource,
          cardRepository,
          cardQueryRepository,
          cardRelatedDataRepository,
          cardSyncDiscrepancyRepository,
          transactionManager,
          logger,
        ),
      inject: [
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        CardSyncDiscrepancyRepositoryPort,
        TransactionManagerPort,
        Logger,
      ],
    },
    {
      provide: GetCardImageUseCase,
      useFactory: (
        imageStorage: ImageStoragePort,
        externalImageSource: ExternalImageSourcePort,
        logger: Logger,
      ) => new GetCardImageUseCase(imageStorage, externalImageSource, logger),
      inject: [ImageStoragePort, ExternalImageSourcePort, Logger],
    },
    {
      provide: UpdateCardUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        cardRepository: PostgresCardRepository,
        logger: Logger,
      ) => new UpdateCardUseCase(cardQueryRepository, cardRepository, logger),
      inject: [PostgresCardRepository, PostgresCardRepository, Logger],
    },
    {
      provide: SetCardTranslationUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        cardTranslationRepository: CardTranslationRepositoryPort,
        logger: Logger,
      ) =>
        new SetCardTranslationUseCase(
          cardQueryRepository,
          cardTranslationRepository,
          logger,
        ),
      inject: [PostgresCardRepository, CardTranslationRepositoryPort, Logger],
    },
    {
      provide: AddCardArtworkUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) =>
        new AddCardArtworkUseCase(
          cardQueryRepository,
          cardRelatedDataRepository,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        Logger,
      ],
    },
    {
      provide: AddCardPrintUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        logger: Logger,
      ) =>
        new AddCardPrintUseCase(
          cardQueryRepository,
          cardRelatedDataRepository,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        Logger,
      ],
    },
    {
      provide: DeleteCardUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        cardRepository: PostgresCardRepository,
        cardTranslationRepository: CardTranslationRepositoryPort,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        transactionManager: TransactionManagerPort,
        logger: Logger,
      ) =>
        new DeleteCardUseCase(
          cardQueryRepository,
          cardRepository,
          cardTranslationRepository,
          cardRelatedDataRepository,
          transactionManager,
          logger,
        ),
      inject: [
        PostgresCardRepository,
        PostgresCardRepository,
        CardTranslationRepositoryPort,
        PostgresCardRelatedDataRepository,
        TransactionManagerPort,
        Logger,
      ],
    },
    {
      provide: ListCardDiscrepanciesUseCase,
      useFactory: (
        discrepancyRepository: CardSyncDiscrepancyRepositoryPort,
        logger: Logger,
      ) => new ListCardDiscrepanciesUseCase(discrepancyRepository, logger),
      inject: [CardSyncDiscrepancyRepositoryPort, Logger],
    },
    {
      provide: ResolveCardDiscrepancyUseCase,
      useFactory: (
        discrepancyRepository: CardSyncDiscrepancyRepositoryPort,
        cardRepository: PostgresCardRepository,
        logger: Logger,
      ) =>
        new ResolveCardDiscrepancyUseCase(
          discrepancyRepository,
          cardRepository,
          logger,
        ),
      inject: [
        CardSyncDiscrepancyRepositoryPort,
        PostgresCardRepository,
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
    GetCardImageUseCase,
    UpdateCardUseCase,
    SetCardTranslationUseCase,
    AddCardArtworkUseCase,
    AddCardPrintUseCase,
    DeleteCardUseCase,
    ListCardDiscrepanciesUseCase,
    ResolveCardDiscrepancyUseCase,
  ],
})
export class CardModule {}
