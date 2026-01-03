import { db } from './database-adapter';

// Inicializar tablas (funciona para SQLite y PostgreSQL)
const initDb = async () => {
  const userTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled'))
    );
    CREATE INDEX IF NOT EXISTS idx_username ON users(username);
  `;

  try {
    await db.exec(userTable);
    console.log('✅ Tablas de base de datos inicializadas');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
};

// Ejecutar inicialización
initDb().catch(console.error);

export default db;