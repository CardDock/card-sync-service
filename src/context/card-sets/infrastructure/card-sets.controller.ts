import {
  BadRequestException,
  BadGatewayException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  InvalidCardIdError,
} from '../application/errors/card-sets.errors';
import { GetCardSetsUseCase } from '../application/use-cases/get-card-sets.use-case';

@Controller('card-sets')
export class CardSetsController {
  constructor(private readonly getCardSets: GetCardSetsUseCase) {}

  @Get(':cardId')
  async get(@Param('cardId') cardId: string) {
    try {
      return await this.getCardSets.execute(cardId);
    } catch (error) {
      if (error instanceof InvalidCardIdError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof CardNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CardTraderUnavailableError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
  }
}
