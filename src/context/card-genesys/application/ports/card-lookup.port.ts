export type CardLookupDocument = Record<string, unknown> & {
  _id: number;
  misc_info?: Array<Record<string, unknown>>;
  miscInfo?: Array<Record<string, unknown>>;
};

export abstract class CardLookupPort {
  abstract findById(id: number): Promise<CardLookupDocument | null>;
}
