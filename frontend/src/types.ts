export interface User {
  id: number;
  username: string;
  display_name: string;
}

export interface MediaElement {
  id: string;
  type: 'image' | 'video' | 'text';
  url?: string; // Para img/video

  // Propiedades Comunes
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible: boolean;
  opacity: number;

  // Propiedades de Texto
  content?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string; // Fondo del texto

  // Propiedades de Video
  videoProps?: {
    playing: boolean;
    volume: number; // 0 a 1
    muted: boolean;
    loop: boolean;
  };
}

// Archivo de media en el servidor
export interface MediaFile {
  filename: string;
  url: string;
  type: string;
  mimetype?: string;
}

// Respuesta de la API de Login
export interface AuthResponse {
  message?: string;
  user?: User;
  error?: string;
  authenticated?: boolean;
}