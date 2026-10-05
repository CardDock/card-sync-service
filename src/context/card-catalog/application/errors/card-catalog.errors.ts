export class InvalidCardCatalogIdError extends Error {
  constructor() {
    super('Card id must be a positive integer');
    this.name = InvalidCardCatalogIdError.name;
  }
}

export class CardCatalogNotFoundError extends Error {
  constructor(id: number) {
    super(`Card with id ${id} was not found`);
    this.name = CardCatalogNotFoundError.name;
  }
}
