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
import { Logger } from '../../domain/ports/logger.port';
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
    private readonly logger: Logger,
  ) {}

  @Get('cards/:externalId')
  async findByExternalId(
    @Param('externalId') externalId: string,
  ): Promise<CardPrimitives> {
    this.logger.info({ externalId }, 'Card lookup: checking cache');

    const card = await this.findOrSyncCardByExternalIdUseCase.execute({
      externalId,
    });

    if (!card) {
      this.logger.warn({ externalId }, 'Card not found');
      throw new NotFoundException(
        `Card with externalId ${externalId} was not found`,
      );
    }

    this.logger.info({ externalId, name: card.toPrimitives().name }, 'Card found in cache');
    return card.toPrimitives();
  }

  @Get('cards')
  async searchByName(
    @Query('name') name: string,
  ): Promise<CardPrimitives[]> {
    this.logger.info({ name }, 'Card search by name');

    const cards = await this.searchCardByNameUseCase.execute({ name });

    this.logger.info({ name, count: cards.length }, 'Card search completed');
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
    this.logger.info({ externalId: body.externalId, condition: body.condition, language: body.language }, 'Register physical card');

    const result = this.registerPhysicalCardUseCase.execute({
      externalId: body.externalId,
      cardPrintId: body.cardPrintId,
      condition: body.condition,
      language: body.language,
      isFirstEdition: body.isFirstEdition,
    });

    this.logger.info({ id: (await result).id, externalId: body.externalId }, 'Physical card registered');
    return result;
  }
}
