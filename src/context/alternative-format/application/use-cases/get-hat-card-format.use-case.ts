import { HatCardsRepositoryPort } from '../ports/hat-cards-repository.port';

export type HatCardFormatResponse = {
  card_id: string;
  format: {
    hat: boolean;
  };
};

export class GetHatCardFormatUseCase {
  constructor(private readonly hatCardsRepository: HatCardsRepositoryPort) {}

  async execute(cardId: string): Promise<HatCardFormatResponse> {
    const normalizedCardId = cardId.trim();

    return {
      card_id: normalizedCardId,
      format: {
        hat:
          normalizedCardId.length > 0
            ? await this.hatCardsRepository.exists(normalizedCardId)
            : false,
      },
    };
  }
}
