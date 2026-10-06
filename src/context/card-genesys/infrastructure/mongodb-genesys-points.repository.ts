import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import {
  GenesysPointsDocument,
  GenesysPointsRepositoryPort,
} from '../application/ports/genesys-points-repository.port';
import { GENESYS_POINTS_MONGO_DATABASE } from './mongodb.provider';

@Injectable()
export class MongoDbGenesysPointsRepository
  implements GenesysPointsRepositoryPort
{
  constructor(
    @Inject(GENESYS_POINTS_MONGO_DATABASE)
    private readonly database: Db,
  ) {}

  async upsertCurrent(
    date: string,
    regulation: Record<string, number>,
  ): Promise<GenesysPointsDocument> {
    const document: GenesysPointsDocument = {
      _id: 'current',
      date,
      regulation,
      syncedAt: new Date(),
    };

    await this.database
      .collection<GenesysPointsDocument>('genesys_points')
      .replaceOne({ _id: 'current' }, document, { upsert: true });

    return document;
  }

  findCurrent(): Promise<GenesysPointsDocument | null> {
    return this.database
      .collection<GenesysPointsDocument>('genesys_points')
      .findOne({ _id: 'current' });
  }
}
