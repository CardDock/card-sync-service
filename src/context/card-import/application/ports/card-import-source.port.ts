export type ImportableCard = Record<string, unknown> & { id: number };

export type CardSnapshot = {
  id: string;
  migrationDate: string;
  sourceUrl: string;
  sizeBytes: number;
};

export abstract class CardImportSourcePort {
  abstract download(): Promise<CardSnapshot>;
  abstract read(snapshotId: string): AsyncIterable<ImportableCard>;
  abstract list(): Promise<CardSnapshot[]>;
  abstract publish(snapshotId: string): Promise<void>;
}
