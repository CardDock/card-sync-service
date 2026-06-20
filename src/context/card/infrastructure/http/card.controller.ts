import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CardPrimitives } from '../../domain/types/card.types';
import { FindOrSyncCardByExternalIdUseCase } from '../../application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../../application/use-cases/search-card-by-name.use-case';
import { RegisterPhysicalCardUseCase } from '../../application/use-cases/register-physical-card.use-case';
import { DomainErrorFilter } from './domain-error.filter';

@Controller()
@UseFilters(new DomainErrorFilter())
export class CardController {
  constructor(
    private readonly findOrSyncCardByExternalIdUseCase: FindOrSyncCardByExternalIdUseCase,
    private readonly searchCardByNameUseCase: SearchCardByNameUseCase,
    private readonly registerPhysicalCardUseCase: RegisterPhysicalCardUseCase,
  ) {}

  @Get('cards/:externalId')
  async findByExternalId(
    @Param('externalId') externalId: string,
  ): Promise<CardPrimitives> {
    const card = await this.findOrSyncCardByExternalIdUseCase.execute({
      externalId,
    });

    if (!card) {
      throw new NotFoundException(
        `Card with externalId ${externalId} was not found`,
      );
    }

    return card.toPrimitives();
  }

  @Get('cards')
  async searchByName(
    @Query('name') name: string,
  ): Promise<CardPrimitives[]> {
    const cards = await this.searchCardByNameUseCase.execute({ name });

    return cards.map((card) => card.toPrimitives());
  }

  @Post('physical-cards')
  async registerPhysicalCard(
    @Body()
    body: {
      externalId: string;
      cardPrintId?: string | null;
      condition: string;
      language: string;
      isFirstEdition?: boolean;
    },
  ) {
    return this.registerPhysicalCardUseCase.execute({
      externalId: body.externalId,
      cardPrintId: body.cardPrintId,
      condition: body.condition,
      language: body.language,
      isFirstEdition: body.isFirstEdition,
    });
  }
}
