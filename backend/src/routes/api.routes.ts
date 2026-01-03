import { Router } from 'express';
import { upload } from '../config/storage';
import { MediaController } from '../controllers/media.controller';

const router = Router();

// Middleware simple para verificar sesión antes de subir/listar
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Rutas de Media
router.post('/media/upload', requireAuth, upload.single('file'), MediaController.uploadFile);
router.get('/media/list', requireAuth, MediaController.listFiles);
router.delete('/media/:filename', requireAuth, MediaController.deleteFile);

export default router;