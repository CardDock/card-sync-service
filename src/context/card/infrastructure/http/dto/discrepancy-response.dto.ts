import { ApiProperty } from '@nestjs/swagger';

export class DiscrepancyResponseDto {
  @ApiProperty({ description: 'Discrepancy ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Card ID', example: '46986414' })
  cardId: string;

  @ApiProperty({ description: 'Field name with discrepancy', example: 'name' })
  fieldName: string;

  @ApiProperty({ description: 'Current value in local database' })
  localValue: unknown;

  @ApiProperty({ description: 'Value from YGOPRODeck API' })
  apiValue: unknown;

  @ApiProperty({
    description: 'Discrepancy status',
    enum: ['PENDING', 'REVIEWED_LOCAL_WINS', 'REVIEWED_API_WINS', 'RESOLVED'],
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
