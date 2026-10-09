export type GenesysPointsDocument = Record<string, unknown> & {
  _id: string;
  date: string;
  regulation: Record<string, number>;
  syncedAt: Date;
};

export abstract class GenesysPointsRepositoryPort {
  abstract upsertCurrent(
    date: string,
    regulation: Record<string, number>,
  ): Promise<GenesysPointsDocument>;

  abstract findCurrent(): Promise<GenesysPointsDocument | null>;
}
