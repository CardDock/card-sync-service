import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  CardNotFoundError,
  CardTraderUnavailableError,
  ExpansionNotFoundError,
  InvalidBlueprintIdError,
  InvalidCardIdError,
  InvalidExpansionIdError,
} from '../application/errors/card-sets.errors';
import { GetCardMarketplacePricesUseCase } from '../application/use-cases/get-card-marketplace-prices.use-case';
import { GetCardTraderExpansionUseCase } from '../application/use-cases/get-card-trader-expansion.use-case';
import { GetCardSetsUseCase } from '../application/use-cases/get-card-sets.use-case';
import { SyncCardTraderExpansionsUseCase } from '../application/use-cases/sync-card-trader-expansions.use-case';

@Controller('card-sets')
export class CardSetsController {
  constructor(
    private readonly getCardSets: GetCardSetsUseCase,
    private readonly getCardMarketplacePrices: GetCardMarketplacePricesUseCase,
    private readonly syncCardTraderExpansions: SyncCardTraderExpansionsUseCase,
    private readonly getCardTraderExpansion: GetCardTraderExpansionUseCase,
  ) {}

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

  @Get('prices/:blueprintId')
  async getPrices(@Param('blueprintId') blueprintId: string) {
    try {
      return await this.getCardMarketplacePrices.execute(blueprintId);
    } catch (error) {
      if (error instanceof InvalidBlueprintIdError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof CardTraderUnavailableError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
  }

  @Post('expansions/sync')
  async syncExpansions() {
    try {
      return await this.syncCardTraderExpansions.execute();
    } catch (error) {
      if (error instanceof CardTraderUnavailableError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
  }

  @Get('expansions/:id')
  async getExpansion(@Param('id') id: string) {
    try {
      return await this.getCardTraderExpansion.execute(id);
    } catch (error) {
      if (error instanceof InvalidExpansionIdError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ExpansionNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CardTraderUnavailableError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
  }
}
