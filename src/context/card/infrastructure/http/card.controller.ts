import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Query,
  HttpCode,
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
import { CardResponse } from '../../domain/types/card.types';
import { DiscrepancyStatus } from '../../domain/ports/card-sync-discrepancy-repository.port';
import { FindOrSyncCardByExternalIdUseCase } from '../../application/use-cases/find-or-sync-card-by-external-id.use-case';
import { SearchCardByNameUseCase } from '../../application/use-cases/search-card-by-name.use-case';
import { ListCardsUseCase } from '../../application/use-cases/list-cards.use-case';
import { GetCardPrintsUseCase } from '../../application/use-cases/get-card-prints.use-case';
import { GetCardArtworksUseCase } from '../../application/use-cases/get-card-artworks.use-case';
import { ListCardSetsUseCase } from '../../application/use-cases/list-card-sets.use-case';
import { SyncCardUseCase } from '../../application/use-cases/sync-card.use-case';
import { UpdateCardUseCase } from '../../application/use-cases/update-card.use-case';
import { SetCardTranslationUseCase } from '../../application/use-cases/set-card-translation.use-case';
import { AddCardArtworkUseCase } from '../../application/use-cases/add-card-artwork.use-case';
import { AddCardPrintUseCase } from '../../application/use-cases/add-card-print.use-case';
import { DeleteCardUseCase } from '../../application/use-cases/delete-card.use-case';
import { ListCardDiscrepanciesUseCase } from '../../application/use-cases/list-card-discrepancies.use-case';
import { ResolveCardDiscrepancyUseCase } from '../../application/use-cases/resolve-card-discrepancy.use-case';
import { DomainErrorFilter } from './domain-error.filter';
import { NotFoundExceptionFilter } from './not-found-exception.filter';
import { CardResponseDto } from './dto/card-response.dto';
import { PaginatedCardResponseDto } from './dto/paginated-card-response.dto';
import { CardPrintResponseDto } from './dto/card-print-response.dto';
import { ArtworkResponseDto } from './dto/artwork-response.dto';
import { CardSetResponseDto } from './dto/card-set-response.dto';
import { SyncCardDto } from './dto/sync-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { SetTranslationDto } from './dto/set-translation.dto';
import { AddArtworkDto } from './dto/add-artwork.dto';
import { AddPrintDto } from './dto/add-print.dto';
import { DiscrepancyResponseDto } from './dto/discrepancy-response.dto';
import { PaginatedDiscrepancyResponseDto } from './dto/paginated-discrepancy-response.dto';
import { ResolveDiscrepancyDto } from './dto/resolve-discrepancy.dto';

@ApiTags('Cards')
@Controller()
@UseFilters(DomainErrorFilter)
@UseFilters(NotFoundExceptionFilter)
export class CardController {
  constructor(
    private readonly findOrSyncCardByExternalIdUseCase: FindOrSyncCardByExternalIdUseCase,
    private readonly searchCardByNameUseCase: SearchCardByNameUseCase,
    private readonly listCardsUseCase: ListCardsUseCase,
    private readonly getCardPrintsUseCase: GetCardPrintsUseCase,
    private readonly getCardArtworksUseCase: GetCardArtworksUseCase,
    private readonly listCardSetsUseCase: ListCardSetsUseCase,
    private readonly syncCardUseCase: SyncCardUseCase,
    private readonly updateCardUseCase: UpdateCardUseCase,
    private readonly setCardTranslationUseCase: SetCardTranslationUseCase,
    private readonly addCardArtworkUseCase: AddCardArtworkUseCase,
    private readonly addCardPrintUseCase: AddCardPrintUseCase,
    private readonly deleteCardUseCase: DeleteCardUseCase,
    private readonly listCardDiscrepanciesUseCase: ListCardDiscrepanciesUseCase,
    private readonly resolveCardDiscrepancyUseCase: ResolveCardDiscrepancyUseCase,
    private readonly logger: Logger,
  ) {}

  @Get('cards/discrepancies')
  @ApiOperation({ summary: 'List all sync discrepancies across cards' })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    description:
      'Filter by status (PENDING, REVIEWED_LOCAL_WINS, REVIEWED_API_WINS, RESOLVED)',
    example: 'PENDING',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    type: PaginatedDiscrepancyResponseDto,
    description: 'Paginated list of discrepancies',
  })
  async listDiscrepancies(
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedDiscrepancyResponseDto> {
    if (limit > 100) {
      limit = 100;
    }

    this.logger.info({ status, page, limit }, 'List discrepancies');

    return this.listCardDiscrepanciesUseCase.execute({
      status: status as DiscrepancyStatus | undefined,
      page,
      limit,
    });
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Find a card by its YGOPRODeck ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID from YGOPRODeck API',
    example: '46986414',
  })
  @ApiQuery({
    name: 'language',
    type: String,
    required: false,
    description: 'Language code (en, es)',
    example: 'es',
  })
  @ApiResponse({
    status: 200,
    type: CardResponseDto,
    description: 'Card found successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  async findById(
    @Param('id') id: string,
    @Query('language') language?: string,
  ): Promise<CardResponse> {
    this.logger.info({ id, language }, 'Card lookup: checking cache');

    const response = await this.findOrSyncCardByExternalIdUseCase.execute({
      id,
      language,
    });

    if (!response) {
      this.logger.warn({ id }, 'Card not found');
      throw new NotFoundException(`Card with id ${id} was not found`);
    }

    this.logger.info({ id, name: response.name }, 'Card found');
    return response;
  }

  @Get('cards')
  @ApiOperation({
    summary: 'List or search cards with optional filters and pagination',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    description:
      'Search cards by name (triggers auto-sync from YGOPRODeck if no local results)',
    example: 'Dark Magician',
  })
  @ApiQuery({
    name: 'language',
    type: String,
    required: false,
    description: 'Language code (en, es)',
    example: 'es',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: false,
    description: 'Filter by card type',
    example: 'Normal Monster',
  })
  @ApiQuery({
    name: 'race',
    type: String,
    required: false,
    description: 'Filter by race',
    example: 'Spellcaster',
  })
  @ApiQuery({
    name: 'attribute',
    type: String,
    required: false,
    description: 'Filter by attribute',
    example: 'DARK',
  })
  @ApiQuery({
    name: 'frameType',
    type: String,
    required: false,
    description: 'Filter by frame type',
    example: 'normal',
  })
  @ApiQuery({
    name: 'atkMin',
    type: Number,
    required: false,
    description: 'Minimum ATK',
    example: 2000,
  })
  @ApiQuery({
    name: 'atkMax',
    type: Number,
    required: false,
    description: 'Maximum ATK',
    example: 3000,
  })
  @ApiQuery({
    name: 'defMin',
    type: Number,
    required: false,
    description: 'Minimum DEF',
    example: 1500,
  })
  @ApiQuery({
    name: 'defMax',
    type: Number,
    required: false,
    description: 'Maximum DEF',
    example: 2500,
  })
  @ApiQuery({
    name: 'level',
    type: Number,
    required: false,
    description: 'Filter by level/rank',
    example: 7,
  })
  @ApiQuery({
    name: 'linkval',
    type: Number,
    required: false,
    description: 'Filter by link value',
    example: 3,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    type: PaginatedCardResponseDto,
    description: 'Paginated list of cards',
  })
  async listCards(
    @Query('name') name: string | undefined,
    @Query('language') language: string | undefined,
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
      this.logger.info({ name, language }, 'Card search by name');
      const items = await this.searchCardByNameUseCase.execute({
        name,
        language,
      });
      return {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
      };
    }

    this.logger.info(
      {
        filters: {
          type,
          race,
          attribute,
          frameType,
          atkMin,
          atkMax,
          defMin,
          defMax,
          level,
          linkval,
        },
        page,
        limit,
      },
      'List cards with filters',
    );

    const result = await this.listCardsUseCase.execute({
      filters: {
        name,
        type,
        race,
        attribute,
        frameType,
        atkMin,
        atkMax,
        defMin,
        defMax,
        level,
        linkval,
      },
      page,
      limit,
    });

    return {
      items: result.items.map((card) => {
        const { rawData: _, ...rest } = card.toPrimitives();
        return rest;
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('cards/:id/prints')
  @ApiOperation({ summary: 'Get all print variants for a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiResponse({
    status: 200,
    type: [CardPrintResponseDto],
    description: 'List of prints for the card',
  })
  @ApiNotFoundResponse({ description: 'No prints found for the given card' })
  async getCardPrints(
    @Param('id') id: string,
  ): Promise<CardPrintResponseDto[]> {
    this.logger.info({ id }, 'Get card prints');

    const prints = await this.getCardPrintsUseCase.execute({ id });

    if (prints.length === 0) {
      throw new NotFoundException(`No prints found for card with id ${id}`);
    }

    return prints;
  }

  @Get('cards/:id/artworks')
  @ApiOperation({ summary: 'Get all artworks for a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiResponse({
    status: 200,
    type: [ArtworkResponseDto],
    description: 'List of artworks for the card',
  })
  @ApiNotFoundResponse({ description: 'No artworks found for the given card' })
  async getCardArtworks(
    @Param('id') id: string,
  ): Promise<ArtworkResponseDto[]> {
    this.logger.info({ id }, 'Get card artworks');

    const artworks = await this.getCardArtworksUseCase.execute({ id });

    if (artworks.length === 0) {
      throw new NotFoundException(`No artworks found for card with id ${id}`);
    }

    return artworks;
  }

  @Get('card-sets')
  @ApiOperation({ summary: 'List all card sets' })
  @ApiResponse({
    status: 200,
    type: [CardSetResponseDto],
    description: 'List of card sets',
  })
  async listCardSets(): Promise<CardSetResponseDto[]> {
    this.logger.info({}, 'List card sets');

    const sets = await this.listCardSetsUseCase.execute();

    return sets;
  }

  @Post('cards/sync')
  @ApiOperation({ summary: 'Force sync a card from YGOPRODeck API' })
  @ApiBody({ type: SyncCardDto })
  @ApiResponse({
    status: 201,
    type: CardResponseDto,
    description: 'Card synced successfully',
  })
  @ApiNotFoundResponse({ description: 'Card not found in YGOPRODeck API' })
  async syncCard(@Body() body: SyncCardDto): Promise<CardResponse> {
    this.logger.info({ id: body.id }, 'Force sync card from YGOPRODeck');

    const card = await this.syncCardUseCase.execute({
      id: body.id,
    });

    if (!card) {
      this.logger.warn({ id: body.id }, 'Sync card: not found in YGOPRODeck');
      throw new NotFoundException(
        `Card with id ${body.id} was not found in YGOPRODeck API`,
      );
    }

    this.logger.info(
      { id: body.id, name: card.toPrimitives().name },
      'Sync card: completed',
    );
    const { rawData: _, ...response } = card.toPrimitives();
    return response;
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: 'Partially update a card (manual edit)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiResponse({
    status: 200,
    type: CardResponseDto,
    description: 'Card updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  async updateCard(
    @Param('id') id: string,
    @Body() body: UpdateCardDto,
  ): Promise<CardResponse> {
    this.logger.info({ id }, 'Update card: manual edit');

    const card = await this.updateCardUseCase.execute({
      id,
      updates: body,
    });

    const { rawData: _, ...response } = card.toPrimitives();
    return response;
  }

  @Put('cards/:id/translations/:language')
  @ApiOperation({ summary: 'Set or update a translation for a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiParam({
    name: 'language',
    type: String,
    description: 'Language code (en, es)',
    example: 'es',
  })
  @ApiResponse({
    status: 204,
    description: 'Translation set successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  @HttpCode(204)
  async setTranslation(
    @Param('id') id: string,
    @Param('language') language: string,
    @Body() body: SetTranslationDto,
  ): Promise<void> {
    this.logger.info({ id, language }, 'Set translation: manual');

    await this.setCardTranslationUseCase.execute({
      cardId: id,
      language,
      data: body,
    });
  }

  @Post('cards/:id/artworks')
  @ApiOperation({ summary: 'Add an alternative artwork to a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiBody({ type: AddArtworkDto })
  @ApiResponse({
    status: 201,
    description: 'Artwork added successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  async addArtwork(
    @Param('id') id: string,
    @Body() body: AddArtworkDto,
  ): Promise<{ id: string }> {
    this.logger.info({ id, imageUrl: body.imageUrl }, 'Add artwork: manual');

    const result = await this.addCardArtworkUseCase.execute({
      cardId: id,
      imageUrl: body.imageUrl,
    });

    return result;
  }

  @Post('cards/:id/prints')
  @ApiOperation({ summary: 'Add a missing print variant to a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiBody({ type: AddPrintDto })
  @ApiResponse({
    status: 201,
    description: 'Print added successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  async addPrint(
    @Param('id') id: string,
    @Body() body: AddPrintDto,
  ): Promise<void> {
    this.logger.info({ id, setCode: body.setCode }, 'Add print: manual');

    await this.addCardPrintUseCase.execute({
      cardId: id,
      print: body,
    });
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: 'Delete a card and all its related data' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiResponse({
    status: 204,
    description: 'Card deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Card with the given id was not found' })
  @HttpCode(204)
  async deleteCard(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Delete card: manual');

    await this.deleteCardUseCase.execute({ id });
  }

  @Get('cards/:id/discrepancies')
  @ApiOperation({ summary: 'Get all sync discrepancies for a card' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiResponse({
    status: 200,
    type: [DiscrepancyResponseDto],
    description: 'List of discrepancies for the card',
  })
  async getCardDiscrepancies(
    @Param('id') id: string,
  ): Promise<DiscrepancyResponseDto[]> {
    this.logger.info({ id }, 'Get card discrepancies');

    const result = await this.listCardDiscrepanciesUseCase.execute({
      cardId: id,
    });

    return result.items;
  }

  @Patch('cards/:id/discrepancies/:discrepancyId')
  @ApiOperation({ summary: 'Resolve a sync discrepancy' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Card ID',
    example: '46986414',
  })
  @ApiParam({
    name: 'discrepancyId',
    type: String,
    description: 'Discrepancy ID',
  })
  @ApiBody({ type: ResolveDiscrepancyDto })
  @ApiResponse({
    status: 204,
    description: 'Discrepancy resolved successfully',
  })
  @HttpCode(204)
  async resolveDiscrepancy(
    @Param('id') _id: string,
    @Param('discrepancyId') discrepancyId: string,
    @Body() body: ResolveDiscrepancyDto,
  ): Promise<void> {
    this.logger.info(
      { discrepancyId, action: body.action },
      'Resolve discrepancy',
    );

    await this.resolveCardDiscrepancyUseCase.execute({
      discrepancyId,
      action: body.action,
    });
  }
}
