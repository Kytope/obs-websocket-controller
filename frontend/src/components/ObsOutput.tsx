import { useEffect, useRef } from 'react';
import { useObsWebSocket } from '../hooks/useObsWebSocket';
import type { MediaElement } from '../types';

export const ObsOutput = () => {
  // Usamos el mismo hook para recibir los datos en tiempo real
  const { elements } = useObsWebSocket();

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden', // IMPORTANTE: Esto oculta lo que está en la "Mesa de Trabajo"
        backgroundColor: 'transparent', // Transparente para que se vea el juego/cámara detrás en OBS
      }}
    >
      {elements.map(el => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.position.x}px`,
            top: `${el.position.y}px`,
            width: `${el.size.width}px`,
            height: `${el.size.height}px`,
            zIndex: el.zIndex,
            opacity: el.opacity,
            // Si visibilidad es false, lo ocultamos (por si implementas un toggle de "ojo" luego)
            display: el.visible ? 'block' : 'none',
          }}
        >
          {/* RENDERIZADO DE IMAGEN */}
          {el.type === 'image' && (
            <img
              src={el.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt=""
            />
          )}

          {/* RENDERIZADO DE VIDEO */}
          {el.type === 'video' && (
             <VideoPlayer element={el} />
          )}

          {/* RENDERIZADO DE TEXTO */}
          {el.type === 'text' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                color: el.color || '#ffffff',
                fontSize: `${el.fontSize || 40}px`,
                fontFamily: el.fontFamily || 'sans-serif',
                fontWeight: el.fontWeight || 'bold',
                textAlign: el.textAlign || 'center',
                backgroundColor: el.backgroundColor || 'transparent',
                // Alineación flex basada en textAlign
                justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.2
              }}
            >
              {el.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Componente auxiliar para controlar el video sin hooks complejos
const VideoPlayer = ({ element }: { element: MediaElement }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && element.videoProps) {
      vid.volume = element.videoProps.volume;
      vid.muted = element.videoProps.muted;
      vid.loop = element.videoProps.loop;

      if (element.videoProps.playing) {
        vid.play().catch(e => console.error("AutoPlay error", e));
      } else {
        vid.pause();
      }
    }
  }, [element.videoProps]);

  return (
    <video
      ref={videoRef}
      src={element.url}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      // Valores por defecto iniciales
      autoPlay
      loop
      muted
    />
  );
};
