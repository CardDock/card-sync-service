import { Module } from '@nestjs/common';
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
    {
      provide: FindOrSyncCardByExternalIdUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
        postgresPoolProvider: PostgresPoolProvider,
      ) =>
        new FindOrSyncCardByExternalIdUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          postgresPoolProvider,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        PostgresPoolProvider,
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
      ) =>
        new SearchCardByNameUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
          cardRelatedDataRepository,
          postgresPoolProvider,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
        PostgresCardRelatedDataRepository,
        PostgresPoolProvider,
      ],
    },
    {
      provide: RegisterPhysicalCardUseCase,
      useFactory: (
        physicalCardRepository: PostgresPhysicalCardRepository,
        cardRelatedDataRepository: PostgresCardRelatedDataRepository,
      ) =>
        new RegisterPhysicalCardUseCase(
          physicalCardRepository,
          cardRelatedDataRepository,
        ),
      inject: [
        PostgresPhysicalCardRepository,
        PostgresCardRelatedDataRepository,
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
