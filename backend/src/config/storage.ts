import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// Definir dónde se guardarán los archivos
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    // Obtenemos el ID del usuario de la sesión (gracias al tipo que definimos antes)
    const userId = req.session.user?.id || 'anonymous';
    
    // Estructura: media/1/2024/01/
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Ruta absoluta: backend/media/1/2024/01
    const uploadPath = path.join(__dirname, '../../media', String(userId), String(year), String(month));

    // Crear carpetas si no existen
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generar nombre único: randomUUID + extensión original
    const uniqueName = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

// Filtro de archivos (Solo imágenes y videos)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportado'));
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // Límite de 100MB
  }
});