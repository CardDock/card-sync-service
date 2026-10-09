import { Module } from '@nestjs/common';
import { CardLookupPort } from './application/ports/card-lookup.port';
import { GenesysPointsRepositoryPort } from './application/ports/genesys-points-repository.port';
import { GetCardGenesysPointsUseCase } from './application/use-cases/get-card-genesys-points.use-case';
import { SyncGenesysPointsUseCase } from './application/use-cases/sync-genesys-points.use-case';
import { GenesysPointsController } from './infrastructure/http/genesys-points.controller';
import { MongoDbCardLookupRepository } from './infrastructure/mongodb-card-lookup.repository';
import { MongoDbGenesysPointsRepository } from './infrastructure/mongodb-genesys-points.repository';
import {
  cardGenesysMongoClientProvider,
  cardGenesysMongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [GenesysPointsController],
  providers: [
    cardGenesysMongoClientProvider,
    cardGenesysMongoDatabaseProvider,
    {
      provide: CardLookupPort,
      useClass: MongoDbCardLookupRepository,
    },
    {
      provide: GenesysPointsRepositoryPort,
      useClass: MongoDbGenesysPointsRepository,
    },
    {
      provide: SyncGenesysPointsUseCase,
      useFactory: (genesysPointsRepository: GenesysPointsRepositoryPort) =>
        new SyncGenesysPointsUseCase(
          genesysPointsRepository,
          process.env.GENESYS_POINTS_URL ??
            'https://dawnbrandbots.github.io/yaml-yugi-limit-regulation/genesys/current.vector.json',
        ),
      inject: [GenesysPointsRepositoryPort],
    },
    {
      provide: GetCardGenesysPointsUseCase,
      useFactory: (
        cardLookupPort: CardLookupPort,
        genesysPointsRepository: GenesysPointsRepositoryPort,
      ) =>
        new GetCardGenesysPointsUseCase(
          cardLookupPort,
          genesysPointsRepository,
        ),
      inject: [CardLookupPort, GenesysPointsRepositoryPort],
    },
  ],
})
export class CardGenesysModule {}
