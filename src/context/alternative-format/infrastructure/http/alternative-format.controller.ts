import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetEdisonCardFormatUseCase } from '../../application/use-cases/get-edison-card-format.use-case';
import { SyncEdisonCardsUseCase } from '../../application/use-cases/sync-edison-cards.use-case';

@ApiTags('Alternative Formats')
@Controller('alternative-formats/edison')
export class AlternativeFormatController {
  constructor(
    private readonly syncEdisonCardsUseCase: SyncEdisonCardsUseCase,
    private readonly getEdisonCardFormatUseCase: GetEdisonCardFormatUseCase,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync the Edison format card list' })
  async syncEdisonCards() {
    return this.syncEdisonCardsUseCase.execute();
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Check whether a card is in the Edison format' })
  @ApiParam({
    name: 'cardId',
    description: 'YGOPRODeck card ID',
    example: '46986414',
  })
  async getEdisonCardFormat(@Param('cardId') cardId: string) {
    return this.getEdisonCardFormatUseCase.execute(cardId);
  }
}
