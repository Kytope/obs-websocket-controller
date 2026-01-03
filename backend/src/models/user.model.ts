export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: string; // SQLite devuelve fechas como strings
  last_login: string | null;
  status: 'active' | 'disabled';
}

// Tipo seguro para crear usuarios (sin ID ni fechas)
export interface CreateUserDTO {
  username: string;
  password: string; // La contraseña en texto plano antes de hashear
  display_name: string;
}