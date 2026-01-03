import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  
  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    try {
      const user = await AuthService.validateUser(username, password);

      if (!user) {
        // Por seguridad, no decimos si falló el usuario o la contraseña
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Guardar usuario en sesión
      req.session.user = {
        id: user.id,
        username: user.username,
        display_name: user.display_name
      };

      return res.json({ 
        message: 'Login exitoso', 
        user: req.session.user 
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'No se pudo cerrar sesión' });
      }
      res.clearCookie('connect.sid'); // Nombre por defecto de la cookie
      return res.json({ message: 'Sesión cerrada' });
    });
  }

  static me(req: Request, res: Response) {
    if (!req.session.user) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  }
}