import { Injectable } from '@nestjs/common';
import { access, mkdir, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { ImageStoragePort } from '../../domain/ports/image-storage.port';
import { CardImageVariant } from '../../domain/value-objects/card-image-variant.value-object';
import { Logger } from '../../domain/ports/logger.port';

@Injectable()
export class LocalImageStorageAdapter extends ImageStoragePort {
  private readonly baseDir: string;

  constructor(private readonly logger: Logger) {
    super();
    this.baseDir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
  }

  async getImagePath(
    cardId: string,
    variant: CardImageVariant,
  ): Promise<string | null> {
    const filePath = this.buildFilePath(cardId, variant);

    try {
      await access(filePath, constants.R_OK);
      return filePath;
    } catch {
      return null;
    }
  }

  async saveImage(
    cardId: string,
    variant: CardImageVariant,
    buffer: Buffer,
  ): Promise<string> {
    const dir = this.buildDirPath(variant);
    await mkdir(dir, { recursive: true });

    const filePath = this.buildFilePath(cardId, variant);
    await writeFile(filePath, buffer);

    return filePath;
  }

  private buildDirPath(variant: CardImageVariant): string {
    return join(this.baseDir, 'cards', variant.toUrlSegment());
  }

  private buildFilePath(cardId: string, variant: CardImageVariant): string {
    return join(this.buildDirPath(variant), `${cardId}.jpg`);
  }
}
