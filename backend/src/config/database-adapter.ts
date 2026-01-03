import { Pool } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Interfaz común para ambas bases de datos
export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<{ lastInsertId?: number; changes?: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

// Adaptador para PostgreSQL
class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Convertir placeholders de SQLite (?) a PostgreSQL ($1, $2, ...)
    const pgSql = this.convertPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const results = await this.query<T>(sql, params);
    return results[0];
  }

  async run(sql: string, params: any[] = []): Promise<{ lastInsertId?: number; changes?: number }> {
    const pgSql = this.convertPlaceholders(sql);

    // Si es un INSERT, agregar RETURNING id para obtener el ID insertado
    let finalSql = pgSql;
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      finalSql += ' RETURNING id';
    }

    const result = await this.pool.query(finalSql, params);

    return {
      lastInsertId: result.rows[0]?.id,
      changes: result.rowCount || 0
    };
  }

  async exec(sql: string): Promise<void> {
    // Convertir tipos de SQLite a PostgreSQL
    const pgSql = this.convertSqliteToPostgres(sql);
    await this.pool.query(pgSql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Convertir ? a $1, $2, $3, etc.
  private convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  // Convertir sintaxis de SQLite a PostgreSQL
  private convertSqliteToPostgres(sql: string): string {
    return sql
      // INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      // DATETIME -> TIMESTAMP
      .replace(/DATETIME/gi, 'TIMESTAMP')
      // CURRENT_TIMESTAMP funciona igual
      // TEXT -> VARCHAR o TEXT (ambos funcionan en PG)
      .replace(/\bTEXT\b/gi, 'TEXT');
  }
}

// Adaptador para SQLite (wrapper del código existente)
class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Asegurar que el directorio existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  async run(sql: string, params: any[] = []): Promise<{ lastInsertId?: number; changes?: number }> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      lastInsertId: info.lastInsertRowid as number,
      changes: info.changes
    };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// Factory function que decide qué adaptador usar
export function createDatabaseAdapter(): DatabaseAdapter {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('✅ Usando PostgreSQL (DATABASE_URL detectada)');
    return new PostgresAdapter(databaseUrl);
  } else {
    console.log('✅ Usando SQLite (modo desarrollo)');
    const dbPath = path.join(__dirname, '../../data/users.db');
    return new SQLiteAdapter(dbPath);
  }
}

// Instancia global del adaptador
export const db = createDatabaseAdapter();
