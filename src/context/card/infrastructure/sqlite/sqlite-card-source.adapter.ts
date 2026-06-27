import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import {
  SqliteCardSourcePort,
  CardTranslationRow,
} from '../../domain/ports/sqlite-card-source.port';

@Injectable()
export class SqliteCardSourceAdapter
  implements SqliteCardSourcePort, OnModuleDestroy
{
  private readonly dbs = new Map<string, Database.Database>();

  private getDb(language: string): Database.Database {
    let db = this.dbs.get(language);

    if (!db) {
      const dbPath =
        process.env[`EDOPRO_DB_PATH_${language.toUpperCase()}`] ??
        process.cwd() + `/uploads/language/${language}/cards.cdb`;

      if (!fs.existsSync(dbPath)) {
        this.dbs.set(language, null as unknown as Database.Database);
        return null as unknown as Database.Database;
      }

      db = new Database(dbPath, { readonly: true });
      this.dbs.set(language, db);
    }

    return db;
  }

  count(language: string): number {
    const db = this.getDb(language);
    if (!db) return 0;

    const row = db.prepare('SELECT COUNT(*) AS cnt FROM "texts"').get() as {
      cnt: number;
    };
    return row.cnt;
  }

  readChunk(
    limit: number,
    offset: number,
    language: string,
  ): CardTranslationRow[] {
    const db = this.getDb(language);
    if (!db) return [];

    const rows = db
      .prepare<
        [number, number]
      >('SELECT "id", "name", "desc" FROM "texts" ORDER BY "id" LIMIT ? OFFSET ?')
      .all(limit, offset) as { id: number; name: string; desc: string }[];

    return rows.map((r) => ({
      cardId: String(r.id),
      name: r.name,
      desc: r.desc,
    }));
  }

  close(language?: string): void {
    if (language) {
      const db = this.dbs.get(language);
      if (db) {
        db.close();
        this.dbs.delete(language);
      }
    } else {
      for (const db of this.dbs.values()) {
        if (db) db.close();
      }
      this.dbs.clear();
    }
  }

  onModuleDestroy(): void {
    this.close();
  }
}
