import { Module } from '@nestjs/common';
import { CardCatalogReaderPort } from './application/ports/card-catalog-reader.port';
import { GetCardByIdUseCase } from './application/use-cases/get-card-by-id.use-case';
import { CardCatalogController } from './infrastructure/http/card-catalog.controller';
import { MongoDbCardCatalogRepository } from './infrastructure/mongodb-card-catalog.repository';
import {
  cardCatalogMongoClientProvider,
  cardCatalogMongoDatabaseProvider,
} from './infrastructure/mongodb.provider';

@Module({
  controllers: [CardCatalogController],
  providers: [
    cardCatalogMongoClientProvider,
    cardCatalogMongoDatabaseProvider,
    {
      provide: CardCatalogReaderPort,
      useClass: MongoDbCardCatalogRepository,
    },
    {
      provide: GetCardByIdUseCase,
      useFactory: (reader: CardCatalogReaderPort) =>
        new GetCardByIdUseCase(reader),
      inject: [CardCatalogReaderPort],
    },
  ],
})
export class CardCatalogModule {}
