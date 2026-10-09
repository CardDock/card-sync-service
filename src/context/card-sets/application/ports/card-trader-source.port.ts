export type CardTraderExpansion = {
  id: number;
  game_id: number;
  code: string;
  name: string;
  [key: string]: unknown;
};

export abstract class CardTraderSourcePort {
  abstract findBlueprints(cardName: string): Promise<unknown>;
  abstract findExpansions(): Promise<CardTraderExpansion[]>;
}
