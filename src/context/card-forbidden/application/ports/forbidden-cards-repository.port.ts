export type ForbiddenCardsDocument = Record<string, unknown> & {
  _id: string;
  date: string;
  regulation: Record<string, number>;
  syncedAt: Date;
};

export abstract class ForbiddenCardsRepositoryPort {
  abstract upsertCurrent(
    date: string,
    regulation: Record<string, number>,
  ): Promise<ForbiddenCardsDocument>;

  abstract findCurrent(): Promise<ForbiddenCardsDocument | null>;
}
