import { Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import {
  SqliteCardSourcePort,
  CardTranslationRow,
} from '../../domain/ports/sqlite-card-source.port';

@Injectable()
export class SqliteCardSourceAdapter implements SqliteCardSourcePort {
  private readonly db: Database.Database;
  private readonly stmtCount: Database.Statement;
  private readonly stmtChunk: Database.Statement<[number, number]>;

  constructor() {
    const dbPath =
      process.env.EDOPRO_DB_PATH ?? process.cwd() + '/uploads/cards.cdb';
    this.db = new Database(dbPath, { readonly: true });
    this.stmtCount = this.db.prepare('SELECT COUNT(*) AS cnt FROM "texts"');
    this.stmtChunk = this.db.prepare(
      'SELECT "id", "name", "desc" FROM "texts" ORDER BY "id" LIMIT ? OFFSET ?',
    );
  }

  count(): number {
    const row = this.stmtCount.get() as { cnt: number };
    return row.cnt;
  }

  readChunk(limit: number, offset: number): CardTranslationRow[] {
    const rows = this.stmtChunk.all(limit, offset) as {
      id: number;
      name: string;
      desc: string;
    }[];
    return rows.map((r) => ({
      cardId: String(r.id),
      name: r.name,
      desc: r.desc,
    }));
  }

  close(): void {
    this.db.close();
  }
}
