import bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from '../models/user.model';

export class AuthService {
  // Verificar credenciales
  static async validateUser(username: string, password: string): Promise<User | null> {
    const user = await UserService.findByUsername(username);

    // 1. Verificar si existe
    if (!user) return null;

    // 2. Verificar si está activo
    if (user.status !== 'active') return null;

    // 3. Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    return user;
  }
}