import { Module } from '@nestjs/common';
import { CardReaderPort } from './application/ports/card-reader.port';
import { CardSetCacheRepositoryPort } from './application/ports/card-set-cache-repository.port';
import { CardTraderSourcePort } from './application/ports/card-trader-source.port';
import { GetCardSetsUseCase } from './application/use-cases/get-card-sets.use-case';
import { CardSetsController } from './infrastructure/card-sets.controller';
import { CardTraderHttpAdapter } from './infrastructure/card-trader-http.adapter';
import { MongoDbCardReaderAdapter } from './infrastructure/mongodb-card-reader.adapter';
import { MongoDbCardSetCacheRepositoryAdapter } from './infrastructure/mongodb-card-set-cache-repository.adapter';
import {
  cardSetsMongoClientProvider,
  cardSetsMongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [CardSetsController],
  providers: [
    cardSetsMongoClientProvider,
    cardSetsMongoDatabaseProvider,
    { provide: CardReaderPort, useClass: MongoDbCardReaderAdapter },
    {
      provide: CardSetCacheRepositoryPort,
      useClass: MongoDbCardSetCacheRepositoryAdapter,
    },
    { provide: CardTraderSourcePort, useClass: CardTraderHttpAdapter },
    {
      provide: GetCardSetsUseCase,
      useFactory: (
        cardReader: CardReaderPort,
        cacheRepository: CardSetCacheRepositoryPort,
        cardTrader: CardTraderSourcePort,
      ) =>
        new GetCardSetsUseCase(
          cardReader,
          cacheRepository,
          cardTrader,
          parseCacheTtl(),
        ),
      inject: [
        CardReaderPort,
        CardSetCacheRepositoryPort,
        CardTraderSourcePort,
      ],
    },
  ],
})
export class CardSetsModule {}

function parseCacheTtl(): number {
  const hours = Number(process.env.CARD_SETS_CACHE_TTL_HOURS ?? 24);
  return Number.isFinite(hours) && hours > 0
    ? hours * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
}
