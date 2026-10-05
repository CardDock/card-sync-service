export abstract class CardTraderMarketplaceSourcePort {
  abstract findMarketplaceProducts(blueprintId: number): Promise<unknown>;
}
