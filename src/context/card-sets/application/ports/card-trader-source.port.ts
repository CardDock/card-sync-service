export abstract class CardTraderSourcePort {
  abstract findBlueprints(cardName: string): Promise<unknown>;
}
