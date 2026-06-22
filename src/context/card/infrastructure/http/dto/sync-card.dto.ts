import { ApiProperty } from '@nestjs/swagger';

export class SyncCardDto {
  @ApiProperty({
    description: 'ID of the card to sync from YGOPRODeck',
    example: '46986414',
  })
  id: string;
}
