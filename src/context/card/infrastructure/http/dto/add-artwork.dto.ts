import { ApiProperty } from '@nestjs/swagger';

export class AddArtworkDto {
  @ApiProperty({
    description: 'Image URL for the artwork',
    example: 'https://images.ygoprodeck.com/images/cards_alt/46986414.jpg',
  })
  imageUrl: string;
}
