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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Logger } from '../../domain/ports/logger.port';
import { CardPrimitives } from '../../domain/types/card.types';
import { FindOrSyncCardByExternalIdUseCase } from '../../application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../../application/use-cases/search-card-by-name.use-case';
import { RegisterPhysicalCardUseCase } from '../../application/use-cases/register-physical-card.use-case';
import { DomainErrorFilter } from './domain-error.filter';
import { RegisterPhysicalCardDto } from './dto/register-physical-card.dto';
import { CardResponseDto } from './dto/card-response.dto';
import { PhysicalCardResponseDto } from './dto/physical-card-response.dto';

@ApiTags('Cards')
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
  @ApiOperation({ summary: 'Find a card by its external YGOPRODeck ID' })
  @ApiParam({ name: 'externalId', type: String, description: 'Card external ID from YGOPRODeck API', example: '46986414' })
  @ApiResponse({ status: 200, type: CardResponseDto, description: 'Card found successfully' })
  @ApiNotFoundResponse({ description: 'Card with the given externalId was not found' })
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
  @ApiOperation({ summary: 'Search cards by name' })
  @ApiQuery({ name: 'name', type: String, required: true, description: 'Card name to search for', example: 'Dark Magician' })
  @ApiResponse({ status: 200, type: [CardResponseDto], description: 'List of matching cards' })
  async searchByName(
    @Query('name') name: string,
  ): Promise<CardPrimitives[]> {
    this.logger.info({ name }, 'Card search by name');

    const cards = await this.searchCardByNameUseCase.execute({ name });

    this.logger.info({ name, count: cards.length }, 'Card search completed');
    return cards.map((card) => card.toPrimitives());
  }

  @Post('physical-cards')
  @ApiOperation({ summary: 'Register a physical card instance' })
  @ApiBody({ type: RegisterPhysicalCardDto })
  @ApiResponse({ status: 201, type: PhysicalCardResponseDto, description: 'Physical card registered successfully' })
  async registerPhysicalCard(
    @Body() body: RegisterPhysicalCardDto,
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
