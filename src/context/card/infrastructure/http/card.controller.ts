import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Query,
  UseFilters,
  DefaultValuePipe,
  ParseIntPipe,
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
import { ListCardsUseCase } from '../../application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from '../../application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from '../../application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from '../../application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from '../../application/use-cases/sync-card.use-case';
import { DomainErrorFilter } from './domain-error.filter';
import { CardResponseDto } from './dto/card-response.dto';
import { PaginatedCardResponseDto } from './dto/paginated-card-response.dto';
import { CardPrintResponseDto } from './dto/card-print-response.dto';
import { ArtworkResponseDto } from './dto/artwork-response.dto';
import { CardSetResponseDto } from './dto/card-set-response.dto';
import { SyncCardDto } from './dto/sync-card.dto';

@ApiTags('Cards')
@Controller()
@UseFilters(new DomainErrorFilter())
export class CardController {
  constructor(
    private readonly findOrSyncCardByExternalIdUseCase: FindOrSyncCardByExternalIdUseCase,
    private readonly searchCardByNameUseCase: SearchCardByNameUseCase,
    private readonly listCardsUseCase: ListCardsUseCase,
    private readonly getCardPrintsUseCase: GetCardPrintsUseCase,
    private readonly getCardArtworksUseCase: GetCardArtworksUseCase,
    private readonly listCardSetsUseCase: ListCardSetsUseCase,
    private readonly syncCardUseCase: SyncCardUseCase,
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
  @ApiOperation({ summary: 'List or search cards with optional filters and pagination' })
  @ApiQuery({ name: 'name', type: String, required: false, description: 'Search cards by name (triggers auto-sync from YGOPRODeck if no local results)', example: 'Dark Magician' })
  @ApiQuery({ name: 'type', type: String, required: false, description: 'Filter by card type', example: 'Normal Monster' })
  @ApiQuery({ name: 'race', type: String, required: false, description: 'Filter by race', example: 'Spellcaster' })
  @ApiQuery({ name: 'attribute', type: String, required: false, description: 'Filter by attribute', example: 'DARK' })
  @ApiQuery({ name: 'frameType', type: String, required: false, description: 'Filter by frame type', example: 'normal' })
  @ApiQuery({ name: 'atkMin', type: Number, required: false, description: 'Minimum ATK', example: 2000 })
  @ApiQuery({ name: 'atkMax', type: Number, required: false, description: 'Maximum ATK', example: 3000 })
  @ApiQuery({ name: 'defMin', type: Number, required: false, description: 'Minimum DEF', example: 1500 })
  @ApiQuery({ name: 'defMax', type: Number, required: false, description: 'Maximum DEF', example: 2500 })
  @ApiQuery({ name: 'level', type: Number, required: false, description: 'Filter by level/rank', example: 7 })
  @ApiQuery({ name: 'linkval', type: Number, required: false, description: 'Filter by link value', example: 3 })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 20, max: 100)', example: 20 })
  @ApiResponse({ status: 200, type: PaginatedCardResponseDto, description: 'Paginated list of cards' })
  async listCards(
    @Query('name') name: string | undefined,
    @Query('type') type: string | undefined,
    @Query('race') race: string | undefined,
    @Query('attribute') attribute: string | undefined,
    @Query('frameType') frameType: string | undefined,
    @Query('atkMin') atkMin: number | undefined,
    @Query('atkMax') atkMax: number | undefined,
    @Query('defMin') defMin: number | undefined,
    @Query('defMax') defMax: number | undefined,
    @Query('level') level: number | undefined,
    @Query('linkval') linkval: number | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedCardResponseDto> {
    if (limit > 100) {
      limit = 100;
    }

    if (name) {
      this.logger.info({ name }, 'Card search by name');
      const cards = await this.searchCardByNameUseCase.execute({ name });
      return {
        items: cards.map((card) => card.toPrimitives()),
        total: cards.length,
        page: 1,
        limit: cards.length,
      };
    }

    this.logger.info({ filters: { type, race, attribute, frameType, atkMin, atkMax, defMin, defMax, level, linkval }, page, limit }, 'List cards with filters');

    const result = await this.listCardsUseCase.execute({
      filters: { name, type, race, attribute, frameType, atkMin, atkMax, defMin, defMax, level, linkval },
      page,
      limit,
    });

    return {
      items: result.items.map((card) => card.toPrimitives()),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('cards/:externalId/prints')
  @ApiOperation({ summary: 'Get all print variants for a card' })
  @ApiParam({ name: 'externalId', type: String, description: 'Card external ID', example: '46986414' })
  @ApiResponse({ status: 200, type: [CardPrintResponseDto], description: 'List of prints for the card' })
  @ApiNotFoundResponse({ description: 'No prints found for the given card' })
  async getCardPrints(
    @Param('externalId') externalId: string,
  ): Promise<CardPrintResponseDto[]> {
    this.logger.info({ externalId }, 'Get card prints');

    const prints = await this.getCardPrintsUseCase.execute({ externalId });

    if (prints.length === 0) {
      throw new NotFoundException(
        `No prints found for card with externalId ${externalId}`,
      );
    }

    return prints;
  }

  @Get('cards/:externalId/artworks')
  @ApiOperation({ summary: 'Get all artworks for a card' })
  @ApiParam({ name: 'externalId', type: String, description: 'Card external ID', example: '46986414' })
  @ApiResponse({ status: 200, type: [ArtworkResponseDto], description: 'List of artworks for the card' })
  @ApiNotFoundResponse({ description: 'No artworks found for the given card' })
  async getCardArtworks(
    @Param('externalId') externalId: string,
  ): Promise<ArtworkResponseDto[]> {
    this.logger.info({ externalId }, 'Get card artworks');

    const artworks = await this.getCardArtworksUseCase.execute({ externalId });

    if (artworks.length === 0) {
      throw new NotFoundException(
        `No artworks found for card with externalId ${externalId}`,
      );
    }

    return artworks;
  }

  @Get('card-sets')
  @ApiOperation({ summary: 'List all card sets' })
  @ApiResponse({ status: 200, type: [CardSetResponseDto], description: 'List of card sets' })
  async listCardSets(): Promise<CardSetResponseDto[]> {
    this.logger.info({}, 'List card sets');

    const sets = await this.listCardSetsUseCase.execute();

    return sets;
  }

  @Post('cards/sync')
  @ApiOperation({ summary: 'Force sync a card from YGOPRODeck API' })
  @ApiBody({ type: SyncCardDto })
  @ApiResponse({ status: 201, type: CardResponseDto, description: 'Card synced successfully' })
  @ApiNotFoundResponse({ description: 'Card not found in YGOPRODeck API' })
  async syncCard(
    @Body() body: SyncCardDto,
  ): Promise<CardPrimitives> {
    this.logger.info({ externalId: body.externalId }, 'Force sync card from YGOPRODeck');

    const card = await this.syncCardUseCase.execute({
      externalId: body.externalId,
    });

    if (!card) {
      this.logger.warn({ externalId: body.externalId }, 'Sync card: not found in YGOPRODeck');
      throw new NotFoundException(
        `Card with externalId ${body.externalId} was not found in YGOPRODeck API`,
      );
    }

    this.logger.info({ externalId: body.externalId, name: card.toPrimitives().name }, 'Sync card: completed');
    return card.toPrimitives();
  }
}
