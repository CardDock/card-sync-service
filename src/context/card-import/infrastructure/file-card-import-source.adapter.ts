import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CardImportSourcePort,
  ImportableCard,
} from '../application/ports/card-import-source.port';

@Injectable()
export class FileCardImportSourceAdapter implements CardImportSourcePort {
  async read(): Promise<ImportableCard[]> {
    const content = await readFile(
      resolve(process.cwd(), 'data/cards.json'),
      'utf8',
    );
    const payload = JSON.parse(content) as { data?: unknown };

    if (!Array.isArray(payload.data)) {
      throw new Error('data/cards.json must contain a data array');
    }

    return payload.data.filter(
      (card): card is ImportableCard =>
        typeof card === 'object' &&
        card !== null &&
        typeof (card as { id?: unknown }).id === 'number',
    );
  }
}
