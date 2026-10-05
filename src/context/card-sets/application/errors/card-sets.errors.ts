export class InvalidCardIdError extends Error {
  constructor() {
    super('Card id must be a positive integer');
    this.name = InvalidCardIdError.name;
  }
}

export class CardNotFoundError extends Error {
  constructor(cardId: number) {
    super(`Card ${cardId} was not found`);
    this.name = CardNotFoundError.name;
  }
}

export class CardTraderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = CardTraderUnavailableError.name;
  }
}

export class InvalidBlueprintIdError extends Error {
  constructor() {
    super('Blueprint id must be a positive integer');
    this.name = InvalidBlueprintIdError.name;
  }
}
