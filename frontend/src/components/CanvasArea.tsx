import { Rnd } from 'react-rnd';
import type { MediaElement } from '../types';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  elements: MediaElement[];
  onUpdate: (elements: MediaElement[]) => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

export const CanvasArea = ({ elements, onUpdate, onSelect, selectedId }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Referencia para controlar la frecuencia de envío (Throttling)
  const lastUpdateRef = useRef<number>(0);

  // Calcular escala para ajustar el 1920x1080 al espacio disponible
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        const parentHeight = containerRef.current.offsetHeight;
        const scaleW = parentWidth / 1920;
        const scaleH = parentHeight / 1080;
        // Factor 0.8 para dejar espacio a la "Mesa de Trabajo"
        setScale(Math.min(scaleW, scaleH) * 0.8);
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- LÓGICA DE MOVIMIENTO EN TIEMPO REAL ---

  const handleDrag = useCallback((id: string, d: { x: number; y: number }, isFinal: boolean = false) => {
    const now = Date.now();

    // Si NO es el evento final (soltar click) y han pasado menos de 30ms, ignoramos para no saturar
    // 30ms equivale aprox a 33 FPS, suficiente para que se vea fluido en OBS
    if (!isFinal && now - lastUpdateRef.current < 30) {
      return;
    }

    const updated = elements.map(el =>
      el.id === id ? { ...el, position: { x: d.x, y: d.y } } : el
    );

    onUpdate(updated);
    lastUpdateRef.current = now;
  }, [elements, onUpdate]);

  // --- LÓGICA DE REDIMENSIONADO DE ELEMENTOS EN TIEMPO REAL ---

  const handleElementResize = useCallback((id: string, ref: HTMLElement, position: { x: number; y: number }, isFinal: boolean = false) => {
    const now = Date.now();
    if (!isFinal && now - lastUpdateRef.current < 30) {
      return;
    }

    const updated = elements.map(el =>
      el.id === id ? {
        ...el,
        size: { width: ref.offsetWidth, height: ref.offsetHeight },
        position: { x: position.x, y: position.y }
      } : el
    );

    onUpdate(updated);
    lastUpdateRef.current = now;
  }, [elements, onUpdate]);

  return (
    // CAMBIO 1: Quitamos overflow-hidden aquí para ver los elementos fuera
    <div className="w-full h-full flex items-center justify-center bg-gray-950/50 relative overflow-hidden" ref={containerRef}>

      {/* WRAPPER ESCALADO */}
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'absolute',
        }}
      >
        {/* ZONA ACTIVA (LO QUE SE VE EN OBS)
            Fondo negro sólido para diferenciarlo del resto
        */}
        <div
            className="absolute inset-0 bg-black shadow-2xl z-0"
            style={{
                boxShadow: '0 0 0 2px #3eede7, 0 0 100px rgba(0,0,0,0.5)', // Borde Cyan brillante
                backgroundImage: 'radial-gradient(#3eede722 2px, transparent 2px)',
                backgroundSize: '50px 50px'
            }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onSelect(null);
            }}
        >
            {/* Etiqueta "EN VIVO" */}
            <div className="absolute -top-10 left-0 bg-cyan-500 text-black font-bold px-3 py-1 rounded-t text-sm tracking-widest">
                ZONA VISIBLE (OUTPUT)
            </div>
        </div>

        {/* ZONA INACTIVA (MESA DE TRABAJO)
            Visualmente marcamos el exterior (opcional, ayuda visual)
        */}
        <div className="absolute -inset-[2000px] bg-gray-800/30 -z-10 border border-white/5 pointer-events-none"></div>


        {/* ELEMENTOS */}
        {elements.map(el => {
            return (
                <Rnd
                    key={el.id}
                    size={{ width: el.size.width, height: el.size.height }}
                    position={{ x: el.position.x, y: el.position.y }}
                    scale={scale}

                    // CAMBIO 2: bounds={undefined} permite arrastrar fuera de la caja padre
                    bounds={undefined}

                    // EVENTOS DE DRAG (MOVIMIENTO)
                    onDragStart={() => onSelect(el.id)}
                    onDrag={(_e, d) => handleDrag(el.id, d, false)} // Movimiento continuo con throttling
                    onDragStop={(_e, d) => handleDrag(el.id, d, true)} // Posición final exacta

                    // EVENTOS DE RESIZE (TAMAÑO)
                    onResizeStart={() => onSelect(el.id)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onResize={(_e: any, _dir: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) =>
                      handleElementResize(el.id, ref, position, false)
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onResizeStop={(_e: any, _dir: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) =>
                      handleElementResize(el.id, ref, position, true)
                    }

                    lockAspectRatio={el.type === 'video' || el.type === 'image'}

                    style={{
                        zIndex: el.zIndex,
                        cursor: 'grab',
                        pointerEvents: 'auto'
                    }}
                    className={`group ${selectedId === el.id ? 'ring-2 ring-cyan-400' : 'hover:ring-1 hover:ring-cyan-400/50'}`}
                >
                    <div
                    className="w-full h-full relative shadow-lg"
                    style={{ opacity: el.opacity }}
                    >
                    {el.type === 'image' && (
                        <img src={el.url} className="w-full h-full object-cover pointer-events-none select-none block" alt="" />
                    )}
                    {el.type === 'video' && (
                        <VideoRenderer element={el} />
                    )}
                    {el.type === 'text' && (
                        <div
                            className="w-full h-full flex items-center"
                            style={{
                                color: el.color || '#ffffff',
                                fontSize: `${el.fontSize || 40}px`,
                                fontFamily: el.fontFamily || 'sans-serif',
                                fontWeight: el.fontWeight || 'bold',
                                textAlign: el.textAlign || 'center',
                                backgroundColor: el.backgroundColor || 'transparent',
                                justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.2
                            }}
                        >
                        {el.content}
                        </div>
                    )}

                    {/* Overlay de selección */}
                    <div className={`absolute inset-0 bg-cyan-400/10 transition-opacity duration-200 pointer-events-none ${selectedId === el.id ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </Rnd>
            );
        })}
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-mono bg-black/80 px-3 py-1.5 rounded border border-gray-700">
        Canvas: 1920x1080 | Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

// Componente auxiliar de video (se mantiene igual)
const VideoRenderer = ({ element }: { element: MediaElement }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = element.videoProps?.volume ?? 1;
      videoRef.current.muted = element.videoProps?.muted ?? false;
      videoRef.current.loop = element.videoProps?.loop ?? true;

      if (element.videoProps?.playing) {
        videoRef.current.play().catch(e => console.log("Autoplay prevent", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [element.videoProps]);

  return (
    <video
      ref={videoRef}
      src={element.url}
      className="w-full h-full object-cover pointer-events-none select-none block"
    />
  );
};
