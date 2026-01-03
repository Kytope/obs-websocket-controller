import { db } from '../config/database-adapter';

/**
 * Script de migración para inicializar la base de datos
 * Funciona tanto para SQLite como para PostgreSQL
 */

async function migrate() {
  console.log('🔄 Iniciando migración de base de datos...');

  try {
    // Crear tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled'))
      )
    `;

    await db.exec(createUsersTable);
    console.log('✅ Tabla users creada');

    // Crear índice en username
    const createUsernameIndex = `
      CREATE INDEX IF NOT EXISTS idx_username ON users(username)
    `;

    await db.exec(createUsernameIndex);
    console.log('✅ Índice idx_username creado');

    // Verificar si hay usuarios
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = users[0]?.count || 0;

    console.log(`✅ Base de datos inicializada. Usuarios existentes: ${userCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  No hay usuarios en la base de datos.');
      console.log('   Ejecuta el siguiente comando para crear un usuario:');
      console.log('   npm run user:add -- -u admin -p tupassword -n "Administrador"');
    }

    await db.close();
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    await db.close();
    process.exit(1);
  }
}

// Ejecutar migración
migrate();
