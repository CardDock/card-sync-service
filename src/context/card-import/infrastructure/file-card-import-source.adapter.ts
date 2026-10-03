import { Injectable } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  access,
  copyFile,
  mkdir,
  readdir,
  rename,
  stat,
  unlink,
} from 'node:fs/promises';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import JSONParser from 'jsonparse';
import {
  CardImportSourcePort,
  CardSnapshot,
  ImportableCard,
} from '../application/ports/card-import-source.port';

@Injectable()
export class FileCardImportSourceAdapter implements CardImportSourcePort {
  private readonly dataDirectory = resolve(
    process.env.CARD_IMPORT_DATA_DIRECTORY ?? 'data',
  );
  private readonly snapshotsDirectory = resolve(
    this.dataDirectory,
    'card-snapshots',
  );
  private readonly sourceUrl =
    process.env.YGOPRODECK_API_BASE_URL ??
    'https://db.ygoprodeck.com/api/v7/cardinfo.php';

  async download(): Promise<CardSnapshot> {
    const response = await fetch(this.sourceUrl);
    if (!response.ok || !response.body) {
      throw new Error(
        `Card source returned ${response.status} ${response.statusText}`,
      );
    }

    await mkdir(this.snapshotsDirectory, { recursive: true });
    const migrationDate = new Date().toISOString();
    const id = `cards-${migrationDate.replace(/[:.]/g, '-')}`;
    const temporaryPath = resolve(this.snapshotsDirectory, `.${id}.tmp`);
    const snapshotPath = this.pathFor(id);
    let output: ReturnType<typeof createWriteStream> | undefined;

    try {
      output = createWriteStream(temporaryPath, { encoding: 'utf8' });
      output.write(
        `{"migrationDate":${JSON.stringify(migrationDate)},"sourceUrl":${JSON.stringify(this.sourceUrl)},"data":[`,
      );

      let first = true;
      const cards = readCards(Readable.fromWeb(response.body as never));

      for await (const value of cards) {
        if (!first) await writeChunk(output, ',');
        first = false;
        await writeChunk(output, JSON.stringify(value));
      }

      await writeChunk(output, ']}');
      output.end();
      await new Promise<void>((resolvePromise, reject) => {
        output.once('finish', resolvePromise);
        output.once('error', reject);
      });
      await rename(temporaryPath, snapshotPath);
      await this.publishFile(snapshotPath);

      return {
        id,
        migrationDate,
        sourceUrl: this.sourceUrl,
        sizeBytes: (await stat(snapshotPath)).size,
      };
    } catch (error) {
      output?.destroy();
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }

  async *read(snapshotId: string): AsyncIterable<ImportableCard> {
    const path = this.pathFor(snapshotId);
    await access(path);
    yield* readCards(createReadStream(path));
  }

  async list(): Promise<CardSnapshot[]> {
    await mkdir(this.snapshotsDirectory, { recursive: true });
    const names = (await readdir(this.snapshotsDirectory)).filter(
      (name) => name.startsWith('cards-') && name.endsWith('.json'),
    );

    return Promise.all(
      names.map(async (name) => {
        const id = name.slice(0, -'.json'.length);
        const file = this.pathFor(id);
        const content = await readPrefix(file);
        const migrationDate =
          content.match(/"migrationDate":"([^"]+)"/)?.[1] ?? '';
        const sourceUrl = content.match(/"sourceUrl":"([^"]+)"/)?.[1] ?? '';
        return {
          id,
          migrationDate,
          sourceUrl,
          sizeBytes: (await stat(file)).size,
        };
      }),
    );
  }

  async publish(snapshotId: string): Promise<void> {
    await this.publishFile(this.pathFor(snapshotId));
  }

  private pathFor(snapshotId: string): string {
    if (
      !/^cards-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(snapshotId)
    ) {
      throw new Error('Invalid card snapshot identifier');
    }
    return resolve(this.snapshotsDirectory, `${snapshotId}.json`);
  }

  private async publishFile(snapshotPath: string): Promise<void> {
    const temporaryPath = resolve(this.dataDirectory, '.cards.json.tmp');
    await copyFile(snapshotPath, temporaryPath);
    await rename(temporaryPath, resolve(this.dataDirectory, 'cards.json'));
  }
}

async function* readCards(
  input: AsyncIterable<Buffer | string>,
): AsyncIterable<ImportableCard> {
  const jsonParser = new JSONParser();
  const cards: ImportableCard[] = [];
  let hasDataArray = false;

  jsonParser.onValue = function (value: unknown) {
    if (this.stack.length === 1 && this.key === 'data') {
      hasDataArray = Array.isArray(value);
      return;
    }
    if (
      this.stack.length !== 2 ||
      typeof this.key !== 'number' ||
      typeof value !== 'object' ||
      value === null ||
      typeof (value as { id?: unknown }).id !== 'number'
    ) {
      return;
    }
    cards.push(value as ImportableCard);
  };

  for await (const chunk of input) {
    jsonParser.write(chunk);
    while (cards.length > 0) yield cards.shift();
  }
  if (jsonParser.stack.length > 0) {
    throw new Error('Card source contains truncated JSON');
  }
  if (!hasDataArray) {
    throw new Error('Card source must contain a data array');
  }
  while (cards.length > 0) yield cards.shift();
}

async function readPrefix(path: string): Promise<string> {
  const file = await import('node:fs/promises');
  const handle = await file.open(path, 'r');
  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

async function writeChunk(
  output: NodeJS.WritableStream,
  chunk: string,
): Promise<void> {
  if (output.write(chunk)) return;
  await new Promise<void>((resolvePromise, reject) => {
    output.once('drain', resolvePromise);
    output.once('error', reject);
  });
}
