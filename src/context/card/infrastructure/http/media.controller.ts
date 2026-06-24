import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { Logger } from '../../domain/ports/logger.port';
import { GetCardImageUseCase } from '../../application/use-cases/get-card-image.use-case';

@ApiTags('Media')
@Controller()
export class MediaController {
  constructor(
    private readonly getCardImageUseCase: GetCardImageUseCase,
    private readonly logger: Logger,
  ) {}

  @Get('media/cards/:id.jpg')
  @ApiOperation({ summary: 'Get a card image, downloading and caching it locally on first request' })
  @ApiParam({ name: 'id', type: String, description: 'Card ID from YGOPRODeck', example: '46986414' })
  @ApiQuery({ name: 'variant', type: String, required: false, description: 'Image variant (normal, small, cropped)', example: 'normal' })
  @ApiResponse({ status: 200, description: 'Card image served successfully' })
  @ApiNotFoundResponse({ description: 'Card image not found' })
  async getCardImage(
    @Param('id') id: string,
    @Query('variant') variant: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    this.logger.info({ cardId: id, variant }, 'Media request: serving card image');

    const result = await this.getCardImageUseCase.execute({
      cardId: id,
      variant,
    });

    if (!result) {
      this.logger.warn({ cardId: id, variant }, 'Media request: image not found');
      throw new NotFoundException(`Image not found for card ${id}`);
    }

    const stream = createReadStream(result.filePath);

    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    });

    return new StreamableFile(stream);
  }
}
