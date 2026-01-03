import db from '../config/database';
import { User, CreateUserDTO } from '../models/user.model';
import bcrypt from 'bcrypt';

export class UserService {
  private static SALT_ROUNDS = 12;

  // Crear nuevo usuario
  static async createUser(data: CreateUserDTO): Promise<number> {
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const result = await db.run(
      `INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)`,
      [data.username, hashedPassword, data.display_name]
    );

    return result.lastInsertId || 0;
  }

  // Buscar usuario por nombre de usuario
  static async findByUsername(username: string): Promise<User | undefined> {
    return await db.get<User>('SELECT * FROM users WHERE username = ?', [username]);
  }

  // Listar todos los usuarios
  static async listUsers(): Promise<Omit<User, 'password_hash'>[]> {
    return await db.query<Omit<User, 'password_hash'>>(
      'SELECT id, username, display_name, created_at, last_login, status FROM users'
    );
  }
}