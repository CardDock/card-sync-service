import { EdisonCardsRepositoryPort } from '../ports/edison-cards-repository.port';

export type EdisonCardFormatResponse = {
  card_id: string;
  format: {
    edison: boolean;
  };
};

export class GetEdisonCardFormatUseCase {
  constructor(
    private readonly edisonCardsRepository: EdisonCardsRepositoryPort,
  ) {}

  async execute(cardId: string): Promise<EdisonCardFormatResponse> {
    const normalizedCardId = cardId.trim();

    return {
      card_id: normalizedCardId,
      format: {
        edison:
          normalizedCardId.length > 0
            ? await this.edisonCardsRepository.exists(normalizedCardId)
            : false,
      },
    };
  }
}
