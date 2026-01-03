import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessage } from '../models/websocket.model';

interface Client {
  ws: WebSocket;
  id: string;
  role: 'editor' | 'overlay';
  isAuthenticated: boolean;
  lastPing: number;
}

export class ConnectionManager {
  private clients: Map<WebSocket, Client> = new Map();

  // Registrar nueva conexión
  addClient(ws: WebSocket, req: IncomingMessage) {
    // Identificar rol por la URL (ej: ws://localhost:8000/ws/editor)
    const url = req.url || '';
    const role = url.includes('/editor') ? 'editor' : 'overlay';
    
    // Generar ID temporal
    const id = Math.random().toString(36).substring(7);

    console.log(`🔌 Nuevo cliente conectado: ${id} (${role})`);

    this.clients.set(ws, {
      ws,
      id,
      role,
      isAuthenticated: false, // Por seguridad, empieza falso
      lastPing: Date.now()
    });

    // Configurar eventos básicos
    ws.on('close', () => this.removeClient(ws));
    ws.on('error', (err) => console.error(`Error en cliente ${id}:`, err));
  }

  removeClient(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`🔌 Cliente desconectado: ${client.id}`);
      this.clients.delete(ws);
    }
  }

  getClient(ws: WebSocket) {
    return this.clients.get(ws);
  }

  // Enviar mensaje a todos los OBS (Overlays)
  broadcastToOverlays(message: WSMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.role === 'overlay' && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  // Enviar mensaje a todos los Editores (para sincronizar entre pestañas)
  broadcastToEditors(message: WSMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.role === 'editor' && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }
}