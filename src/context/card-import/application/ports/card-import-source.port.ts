export type ImportableCard = Record<string, unknown> & { id: number };

export abstract class CardImportSourcePort {
  abstract read(): Promise<ImportableCard[]>;
}
