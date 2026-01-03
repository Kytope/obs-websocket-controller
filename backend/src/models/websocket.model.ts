// Tipos de acciones posibles
export type MessageType = 
  | 'auth' 
  | 'ping' 
  | 'pong'
  | 'add_media'
  | 'remove_media'
  | 'update_property'
  | 'clear_all'
  | 'sync_state';

// Estructura base de un mensaje
export interface WSMessage {
  type: MessageType;
  data?: any;
  requestId?: string; // Para saber a qué operación responde
}

// Estructura de un elemento multimedia en el canvas
export interface MediaElement {
  id: string;       // UUID único de esta instancia
  type: 'image' | 'video' | 'text';
  url?: string;     // URL del archivo
  content?: string; // Texto (si es tipo texto)
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible: boolean;
  opacity: number;
  // Propiedades específicas podrían ir aquí o en un campo 'properties'
}

// Estado global del Overlay
export interface OverlayState {
  version: number;
  elements: MediaElement[];
}