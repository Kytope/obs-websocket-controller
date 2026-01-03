import { useEffect, useRef, useState, useCallback } from 'react';
import type { MediaElement } from '../types';

interface WSMessage {
  type: string;
  data?: any;
}

export const useObsWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [elements, setElements] = useState<MediaElement[]>([]);

  useEffect(() => {
    // Conectar al WebSocket
    const socket = new WebSocket(`ws://${location.host}/ws/editor`);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ WS Conectado');
      setIsConnected(true);
      // Pedir estado inicial (opcional, si el backend lo soporta)
    };

    socket.onclose = () => {
      console.log('🔴 WS Desconectado');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);

      // Manejar tipos de mensajes
      switch (msg.type) {
        case 'sync_state':
          setElements(msg.data.elements);
          break;
        case 'add_media':
          setElements(prev => [...prev, msg.data]);
          break;
        // Aquí puedes agregar más casos (update, delete)
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  // Función para enviar actualizaciones al servidor
  const sendUpdate = useCallback((newElements: MediaElement[]) => {
    // Actualizamos localmente primero (optimista)
    setElements(newElements);

    // Enviamos al servidor
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'sync_state',
        data: { version: Date.now(), elements: newElements }
      }));
    }
  }, []);

  return { isConnected, elements, sendUpdate };
};
