import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetCardForbiddenPointsUseCase } from '../../application/use-cases/get-card-forbidden-points.use-case';
import { SyncForbiddenCardsUseCase } from '../../application/use-cases/sync-forbidden-cards.use-case';

@ApiTags('Forbidden Cards')
@Controller('forbidden-cards')
export class ForbiddenCardsController {
  constructor(
    private readonly syncForbiddenCardsUseCase: SyncForbiddenCardsUseCase,
    private readonly getCardForbiddenPointsUseCase: GetCardForbiddenPointsUseCase,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync the TCG forbidden card regulation list' })
  async syncForbiddenCards() {
    return this.syncForbiddenCardsUseCase.execute();
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Get the limit value for a local card ID' })
  @ApiParam({
    name: 'cardId',
    description: 'Card ID from the Mongo cards collection',
    example: '46986414',
  })
  async getForbiddenPoints(@Param('cardId') cardId: string) {
    return this.getCardForbiddenPointsUseCase.execute(cardId);
  }
}
