import { Module } from '@nestjs/common';
import { FindOrSyncCardByExternalIdUseCase } from './application/use-cases/find-or-sync-card-by-external-id.use-case';
import { CardController } from './infrastructure/http/card.controller';
import { YgoProDeckExternalCardSource } from './infrastructure/external/ygoprodeck-card-source';
import { PostgresCardRepository } from './infrastructure/persistence/postgres-card.repository';
import { PostgresPoolProvider } from './infrastructure/persistence/postgres-pool.provider';

@Module({
  controllers: [CardController],
  providers: [
    PostgresPoolProvider,
    PostgresCardRepository,
    YgoProDeckExternalCardSource,
    {
      provide: FindOrSyncCardByExternalIdUseCase,
      useFactory: (
        cardQueryRepository: PostgresCardRepository,
        externalCardSource: YgoProDeckExternalCardSource,
        cardRepository: PostgresCardRepository,
      ) =>
        new FindOrSyncCardByExternalIdUseCase(
          cardQueryRepository,
          externalCardSource,
          cardRepository,
        ),
      inject: [
        PostgresCardRepository,
        YgoProDeckExternalCardSource,
        PostgresCardRepository,
      ],
    },
  ],
  exports: [FindOrSyncCardByExternalIdUseCase],
})
export class CardModule {}
