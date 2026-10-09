import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetEdisonCardFormatUseCase } from '../../application/use-cases/get-edison-card-format.use-case';
import { GetGoatCardFormatUseCase } from '../../application/use-cases/get-goat-card-format.use-case';
import { GetHatCardFormatUseCase } from '../../application/use-cases/get-hat-card-format.use-case';
import { SyncEdisonCardsUseCase } from '../../application/use-cases/sync-edison-cards.use-case';
import { SyncGoatCardsUseCase } from '../../application/use-cases/sync-goat-cards.use-case';
import { SyncHatCardsUseCase } from '../../application/use-cases/sync-hat-cards.use-case';

@ApiTags('Alternative Formats')
@Controller('alternative-formats')
export class AlternativeFormatController {
  constructor(
    private readonly syncEdisonCardsUseCase: SyncEdisonCardsUseCase,
    private readonly getEdisonCardFormatUseCase: GetEdisonCardFormatUseCase,
    private readonly syncGoatCardsUseCase: SyncGoatCardsUseCase,
    private readonly getGoatCardFormatUseCase: GetGoatCardFormatUseCase,
    private readonly syncHatCardsUseCase: SyncHatCardsUseCase,
    private readonly getHatCardFormatUseCase: GetHatCardFormatUseCase,
  ) {}

  @Post('edison/sync')
  @ApiOperation({ summary: 'Sync the Edison format card list' })
  async syncEdisonCards() {
    return this.syncEdisonCardsUseCase.execute();
  }

  @Get('edison/:cardId')
  @ApiOperation({ summary: 'Check whether a card is in the Edison format' })
  @ApiParam({
    name: 'cardId',
    description: 'YGOPRODeck card ID',
    example: '46986414',
  })
  async getEdisonCardFormat(@Param('cardId') cardId: string) {
    return this.getEdisonCardFormatUseCase.execute(cardId);
  }

  @Post('goat/sync')
  @ApiOperation({ summary: 'Sync the GOAT format card list' })
  async syncGoatCards() {
    return this.syncGoatCardsUseCase.execute();
  }

  @Get('goat/:cardId')
  @ApiOperation({ summary: 'Check whether a card is in the GOAT format' })
  @ApiParam({
    name: 'cardId',
    description: 'YGOPRODeck card ID',
    example: '86988864',
  })
  async getGoatCardFormat(@Param('cardId') cardId: string) {
    return this.getGoatCardFormatUseCase.execute(cardId);
  }

  @Post('hat/sync')
  @ApiOperation({ summary: 'Sync the HAT format card list' })
  async syncHatCards() {
    return this.syncHatCardsUseCase.execute();
  }

  @Get('hat/:cardId')
  @ApiOperation({ summary: 'Check whether a card is in the HAT format' })
  @ApiParam({
    name: 'cardId',
    description: 'YGOPRODeck card ID',
    example: '34541863',
  })
  async getHatCardFormat(@Param('cardId') cardId: string) {
    return this.getHatCardFormatUseCase.execute(cardId);
  }
}
