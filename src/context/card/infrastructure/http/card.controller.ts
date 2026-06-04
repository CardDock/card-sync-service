import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseFilters,
} from '@nestjs/common';
import { CardPrimitives } from '../../domain/types/card.types';
import { FindOrSyncCardByExternalIdUseCase } from '../../application/use-cases/find-or-sync-card-by-external-id.use-case';
import { DomainErrorFilter } from './domain-error.filter';

@Controller('cards')
@UseFilters(new DomainErrorFilter())
export class CardController {
  constructor(
    private readonly findOrSyncCardByExternalIdUseCase: FindOrSyncCardByExternalIdUseCase,
  ) {}

  @Get(':externalId')
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
}
