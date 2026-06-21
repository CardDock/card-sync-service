import { ApiProperty } from '@nestjs/swagger';

export class ArtworkResponseDto {
  @ApiProperty({ description: 'Artwork ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Image URL', example: 'https://images.ygoprodeck.com/images/cards/46986414.jpg' })
  imageUrl: string;
}
