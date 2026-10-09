import { GoatCardsRepositoryPort } from '../ports/goat-cards-repository.port';

export type GoatCardFormatResponse = {
  card_id: string;
  format: {
    goat: boolean;
  };
};

export class GetGoatCardFormatUseCase {
  constructor(private readonly goatCardsRepository: GoatCardsRepositoryPort) {}

  async execute(cardId: string): Promise<GoatCardFormatResponse> {
    const normalizedCardId = cardId.trim();

    return {
      card_id: normalizedCardId,
      format: {
        goat:
          normalizedCardId.length > 0
            ? await this.goatCardsRepository.exists(normalizedCardId)
            : false,
      },
    };
  }
}
