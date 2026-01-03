import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export class MediaController {
  
  // Subir archivo
  static uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    // Construir URL pública para el frontend
    // Ojo: En producción esto debería ser una URL estática, aquí usaremos una ruta relativa
    // La ruta física es algo como: .../media/1/2024/01/archivo.jpg
    // La URL será: /media/1/2024/01/archivo.jpg
    
    const relativePath = path.relative(path.join(__dirname, '../../media'), req.file.path);
    // Asegurar barras normales en Windows para la URL
    const urlPath = relativePath.split(path.sep).join('/');

    return res.json({
      message: 'Archivo subido con éxito',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/media/${urlPath}`
      }
    });
  }

  // Listar archivos del usuario (Escaneo simple recursivo)
  static listFiles(req: Request, res: Response) {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const userMediaDir = path.join(__dirname, '../../media', String(userId));

    if (!fs.existsSync(userMediaDir)) {
      return res.json({ files: [] });
    }

    const files: any[] = [];

    // Función recursiva para buscar archivos
    const scanDir = (directory: string) => {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else {
          // Crear URL relativa
          const relativePath = path.relative(path.join(__dirname, '../../media'), fullPath);
          const urlPath = relativePath.split(path.sep).join('/');

          files.push({
            filename: item,
            url: `/media/${urlPath}`,
            size: stat.size,
            mimetype: urlPath.endsWith('mp4') || urlPath.endsWith('webm') ? 'video' : 'image'
          });
        }
      }
    };

    scanDir(userMediaDir);
    return res.json({ files });
  }

  // NUEVO: Borrar archivo
  static deleteFile(req: Request, res: Response) {
    const userId = req.session.user?.id;
    const { filename } = req.params;

    if (!userId || !filename) return res.status(400).json({ error: 'Datos inválidos' });

    // IMPORTANTE: Por seguridad, solo permitimos borrar archivos dentro de la carpeta del usuario
    // y evitamos "path traversal" (../)
    const safeFilename = path.basename(filename);

    // Buscamos recursivamente el archivo porque no sabemos en qué año/mes está
    const userMediaDir = path.join(__dirname, '../../media', String(userId));

    const findAndDelete = (dir: string): boolean => {
      if (!fs.existsSync(dir)) return false;
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (findAndDelete(fullPath)) return true;
        } else if (item === safeFilename) {
          fs.unlinkSync(fullPath); // Borrar archivo
          return true;
        }
      }
      return false;
    };

    if (findAndDelete(userMediaDir)) {
      return res.json({ success: true, message: 'Archivo eliminado' });
    } else {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
  }
}