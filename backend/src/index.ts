import express, { Request, Response } from 'express';
import http from 'http';
import session from 'express-session';
import { WebSocketServer } from 'ws';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import path from 'path';
import apiRoutes from './routes/api.routes';

const app = express();

// Configuración de la sesión
const sessionParser = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
  }
});

// Middlewares
app.use(sessionParser);
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);

app.use('/api', apiRoutes); // <--- AGREGAR ESTO

app.use('/media', express.static(path.join(__dirname, '../media')));

// Ruta de prueba (Health Check) - DEBE ESTAR ANTES del catch-all
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'OBS Media Controller Backend',
    mode: config.nodeEnv
  });
});

// Servir archivos estáticos del frontend en producción
if (config.nodeEnv === 'production') {
  // Servir archivos estáticos de la carpeta dist del frontend
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Todas las rutas no API deben servir el index.html (para React Router)
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ---------------------------------------------------------
// CONFIGURACIÓN DEL SERVIDOR Y WEBSOCKET
// ---------------------------------------------------------
// Creamos el server y WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Estado del canvas (en memoria, se puede mover a DB después)
let canvasState = {
  version: Date.now(),
  elements: []
};

// Interceptar la actualización de protocolo (HTTP -> WebSocket)
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url!, `http://${request.headers.host}`);

  // Solo manejar rutas WebSocket específicas
  if (url.pathname === '/ws/editor') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Función para hacer broadcast a todos los clientes
const broadcast = (message: any) => {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(messageStr);
    }
  });
};

// Manejar nuevas conexiones WebSocket
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  console.log(`✅ Cliente conectado a ${url.pathname}`);

  if (url.pathname === '/ws/editor') {
    // Enviar estado inicial al conectar
    ws.send(JSON.stringify({
      type: 'sync_state',
      data: canvasState
    }));

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message.toString());
        console.log(`📩 Mensaje del editor:`, msg.type);

        switch (msg.type) {
          case 'sync_state':
            // Actualizar estado y hacer broadcast
            canvasState = msg.data;
            broadcast({
              type: 'sync_state',
              data: canvasState
            });
            break;

          default:
            console.log(`⚠️ Tipo de mensaje desconocido: ${msg.type}`);
        }
      } catch (err) {
        console.error('❌ Error procesando mensaje:', err);
      }
    });

    ws.on('close', () => {
      console.log('🔴 Cliente desconectado del editor');
    });
  }
});

// Iniciar servidor
server.listen(config.port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${config.port}`);
  console.log(`   Modo: ${config.nodeEnv}`);
});