import { Module } from '@nestjs/common';
import { CardLookupPort } from './application/ports/card-lookup.port';
import { ForbiddenCardsRepositoryPort } from './application/ports/forbidden-cards-repository.port';
import { GetCardForbiddenPointsUseCase } from './application/use-cases/get-card-forbidden-points.use-case';
import { SyncForbiddenCardsUseCase } from './application/use-cases/sync-forbidden-cards.use-case';
import { ForbiddenCardsController } from './infrastructure/http/forbidden-cards.controller';
import { MongoDbCardLookupRepository } from './infrastructure/mongodb-card-lookup.repository';
import { MongoDbForbiddenCardsRepository } from './infrastructure/mongodb-forbidden-cards.repository';
import {
  forbiddenCardsMongoClientProvider,
  forbiddenCardsMongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [ForbiddenCardsController],
  providers: [
    forbiddenCardsMongoClientProvider,
    forbiddenCardsMongoDatabaseProvider,
    {
      provide: CardLookupPort,
      useClass: MongoDbCardLookupRepository,
    },
    {
      provide: ForbiddenCardsRepositoryPort,
      useClass: MongoDbForbiddenCardsRepository,
    },
    {
      provide: SyncForbiddenCardsUseCase,
      useFactory: (forbiddenCardsRepository: ForbiddenCardsRepositoryPort) =>
        new SyncForbiddenCardsUseCase(
          forbiddenCardsRepository,
          process.env.TCG_LIMITS_URL ??
            'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/tcg/current.vector.json',
        ),
      inject: [ForbiddenCardsRepositoryPort],
    },
    {
      provide: GetCardForbiddenPointsUseCase,
      useFactory: (
        cardLookupPort: CardLookupPort,
        forbiddenCardsRepository: ForbiddenCardsRepositoryPort,
      ) =>
        new GetCardForbiddenPointsUseCase(
          cardLookupPort,
          forbiddenCardsRepository,
        ),
      inject: [CardLookupPort, ForbiddenCardsRepositoryPort],
    },
  ],
})
export class CardForbiddenModule {}
