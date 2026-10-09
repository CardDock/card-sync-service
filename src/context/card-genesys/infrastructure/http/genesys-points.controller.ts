import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetCardGenesysPointsUseCase } from '../../application/use-cases/get-card-genesys-points.use-case';
import { SyncGenesysPointsUseCase } from '../../application/use-cases/sync-genesys-points.use-case';

@ApiTags('Genesys Points')
@Controller('genesys-points')
export class GenesysPointsController {
  constructor(
    private readonly syncGenesysPointsUseCase: SyncGenesysPointsUseCase,
    private readonly getCardGenesysPointsUseCase: GetCardGenesysPointsUseCase,
  ) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Sync the Genesys points list from the public registry',
  })
  async syncGenesysPoints() {
    return this.syncGenesysPointsUseCase.execute();
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Get the Genesys points value for a local card ID' })
  @ApiParam({
    name: 'cardId',
    description: 'Card ID from the Mongo cards collection',
    example: '46986414',
  })
  async getGenesysPoints(@Param('cardId') cardId: string) {
    return this.getCardGenesysPointsUseCase.execute(cardId);
  }
}
