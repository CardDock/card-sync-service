import { ApiProperty } from '@nestjs/swagger';

export class SyncCardDto {
  @ApiProperty({
    description: 'External ID of the card to sync from YGOPRODeck',
    example: '46986414',
  })
  externalId: string;
}
