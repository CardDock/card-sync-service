import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  CardCatalogNotFoundError,
  InvalidCardCatalogIdError,
} from '../../application/errors/card-catalog.errors';
import { GetCardByIdUseCase } from '../../application/use-cases/get-card-by-id.use-case';

@Controller('legacy/cards')
export class CardCatalogController {
  constructor(private readonly getCardById: GetCardByIdUseCase) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      return await this.getCardById.execute(id);
    } catch (error) {
      if (error instanceof InvalidCardCatalogIdError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof CardCatalogNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
