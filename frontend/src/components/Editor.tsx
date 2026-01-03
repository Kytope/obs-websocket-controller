import { useAuth } from '../context/AuthContext';
import { useObsWebSocket } from '../hooks/useObsWebSocket';
import { CanvasArea } from './CanvasArea';
import type { MediaElement, MediaFile } from '../types';
import { LogOut, Upload, Image as ImageIcon, Trash2, Monitor, Type as TypeIcon, Eraser, Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const Editor = () => {
  const { user, logout } = useAuth();
  const { isConnected, elements, sendUpdate } = useObsWebSocket();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedElement = elements.find(el => el.id === selectedId);

  // --- CARGA DE DATOS ---
  const loadMedia = async () => {
    try {
      const res = await fetch('/api/media/list', { credentials: 'include' });
      const data = await res.json();
      if (data.files) setMediaFiles(data.files);
    } catch (err) { console.error("Error cargando media:", err); }
  };

  useEffect(() => {
    // Cargar medios al montar el componente
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media/list', { credentials: 'include' });
        const data = await res.json();
        if (data.files) setMediaFiles(data.files);
      } catch (err) { console.error("Error cargando media:", err); }
    };
    fetchMedia();
  }, []);

  // --- FUNCIONES LÓGICAS ---

  // 1. Agregar Media con Resolución Nativa
  const addMediaElement = (file: MediaFile) => {
    const mimetype = file.mimetype || file.type || '';
    const url = file.url || '';
    const isVideo = mimetype.includes('video') || url.endsWith('.mp4');

    // Función auxiliar para crear el elemento una vez tenemos dimensiones
    const createEl = (w: number, h: number) => {
      // Si la imagen es gigante (ej: 4K), la limitamos para que no tape todo
      const maxInitialSize = 800;
      let finalW = w;
      let finalH = h;

      if (w > maxInitialSize || h > maxInitialSize) {
        const ratio = w / h;
        if (w > h) { finalW = maxInitialSize; finalH = maxInitialSize / ratio; }
        else { finalH = maxInitialSize; finalW = maxInitialSize * ratio; }
      }

      const newElement: MediaElement = {
        id: uuidv4(),
        type: isVideo ? 'video' : 'image',
        url: url,
        position: { x: (1920 - finalW) / 2, y: (1080 - finalH) / 2 }, // Centrado real
        size: { width: finalW, height: finalH },
        zIndex: elements.length + 10,
        visible: true,
        opacity: 1,
        videoProps: isVideo ? { playing: true, volume: 1, muted: true, loop: true } : undefined
      };

      sendUpdate([...elements, newElement]);
      setSelectedId(newElement.id);
    };

    if (isVideo) {
      const vid = document.createElement('video');
      vid.onloadedmetadata = () => createEl(vid.videoWidth, vid.videoHeight);
      vid.src = url;
    } else {
      const img = new Image();
      img.onload = () => createEl(img.width, img.height);
      img.src = url;
    }
  };

  // 2. Agregar Texto
  const addTextElement = () => {
    const newElement: MediaElement = {
      id: uuidv4(),
      type: 'text',
      content: 'Nuevo Texto',
      color: '#ffffff',
      fontSize: 80,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      position: { x: 1920 / 2 - 200, y: 1080 / 2 - 50 },
      size: { width: 400, height: 100 },
      zIndex: elements.length + 10,
      visible: true,
      opacity: 1
    };
    sendUpdate([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  // 3. Borrar del Canvas
  const deleteElement = () => {
    if (!selectedId) return;
    sendUpdate(elements.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  // 4. Limpiar Todo el Canvas
  const clearCanvas = () => {
    if (confirm('¿Estás seguro de limpiar todo el lienzo?')) {
      sendUpdate([]);
      setSelectedId(null);
    }
  };

  // 5. Borrar Archivo de Librería
  const deleteFileFromLibrary = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation(); // Evitar que se añada al canvas al hacer click en borrar
    if (!confirm(`¿Eliminar permanentemente "${filename}"?`)) return;

    try {
      const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) loadMedia();
      else alert('Error al eliminar');
    } catch { alert('Error de conexión'); }
  };

  // 6. Actualizar Propiedades
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProp = (key: keyof MediaElement, value: any) => {
    if (!selectedId) return;
    sendUpdate(elements.map(e => e.id === selectedId ? { ...e, [key]: value } : e));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateVideoProp = (key: string, value: any) => {
    if (!selectedElement || !selectedElement.videoProps) return;
    updateProp('videoProps', { ...selectedElement.videoProps, [key]: value });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData, credentials: 'include' });
      if (res.ok) loadMedia();
    } catch { alert('Error al subir'); }
  };

  return (
    <div className="editor-container h-screen bg-gray-900 text-white flex overflow-hidden">

      {/* === LIBRERÍA (Izquierda) === */}
      <div className="sidebar w-72 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700 space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-white"><ImageIcon size={20} className="text-cyan-400" /> Librería</h3>

          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer text-sm transition-colors">
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
              <Upload size={16} /> Subir
            </label>
            <button onClick={addTextElement} className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded text-sm transition-colors border border-gray-600">
              <TypeIcon size={16} /> Texto
            </button>
          </div>

          <button onClick={clearCanvas} className="w-full flex items-center justify-center gap-2 p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold rounded text-xs transition-colors border border-red-900/50">
            <Eraser size={14} /> LIMPIAR CANVAS
          </button>
        </div>

        <div className="p-3 grid grid-cols-2 gap-3 overflow-y-auto content-start flex-1">
          {mediaFiles.map((file, i) => (
            <div key={i} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-cyan-400 transition-all shadow-sm"
              onClick={() => addMediaElement(file)}>

              {(file.mimetype?.includes('video') || file.url.endsWith('.mp4')) ? (
                <video src={file.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
              )}

              {/* Botón Borrar de Librería */}
              <button onClick={(e) => deleteFileFromLibrary(e, file.filename)} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">
                <X size={12} color="white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* === CANVAS (Centro) === */}
      <div className="main-area flex-1 bg-gray-950 relative flex items-center justify-center p-0 overflow-hidden">
        <div className="absolute top-4 right-4 z-50 bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-full border border-gray-700 shadow-lg">
          <div className="flex items-center gap-2">
             <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
             <span className={`text-xs font-bold tracking-wide ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
             </span>
          </div>
        </div>
        <CanvasArea elements={elements} onUpdate={sendUpdate} onSelect={setSelectedId} selectedId={selectedId} />
      </div>

      {/* === PROPIEDADES (Derecha) === */}
      <div className="properties-panel w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-5 border-b border-gray-700">
          <h3 className="font-bold text-white flex items-center gap-2 text-lg"><Monitor size={20} className="text-cyan-400"/> Propiedades</h3>
          <p className="text-xs text-gray-400 mt-1">Usuario: <span className="text-cyan-400 font-semibold">{user?.display_name}</span></p>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* --- PROPIEDADES GENERALES --- */}
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700/50">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tipo: {selectedElement.type}</div>
                <div className="flex gap-2">
                   <div className="flex-1">
                      <label className="text-[10px] text-gray-500">Opacidad</label>
                      <input type="range" min="0" max="1" step="0.1" value={selectedElement.opacity} onChange={(e) => updateProp('opacity', parseFloat(e.target.value))} className="w-full accent-cyan-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                   </div>
                   <div className="flex-1">
                      <label className="text-[10px] text-gray-500">Z-Index</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateProp('zIndex', selectedElement.zIndex - 1)} className="w-6 h-6 bg-gray-700 rounded text-xs">-</button>
                        <span className="text-xs font-mono flex-1 text-center">{selectedElement.zIndex}</span>
                        <button onClick={() => updateProp('zIndex', selectedElement.zIndex + 1)} className="w-6 h-6 bg-gray-700 rounded text-xs">+</button>
                      </div>
                   </div>
                </div>
              </div>

              {/* --- PROPIEDADES DE TEXTO --- */}
              {selectedElement.type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-1 block">Contenido</label>
                    <textarea rows={3} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                      value={selectedElement.content} onChange={(e) => updateProp('content', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                       <label className="text-xs text-gray-400 block mb-1">Color</label>
                       <input type="color" className="w-full h-8 bg-transparent border-0 rounded cursor-pointer"
                         value={selectedElement.color} onChange={(e) => updateProp('color', e.target.value)} />
                    </div>
                    <div>
                       <label className="text-xs text-gray-400 block mb-1">Tamaño</label>
                       <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm"
                         value={selectedElement.fontSize} onChange={(e) => updateProp('fontSize', parseInt(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fondo</label>
                     <div className="flex gap-2 items-center">
                        <input type="color" className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer"
                          value={selectedElement.backgroundColor === 'transparent' ? '#000000' : selectedElement.backgroundColor}
                          onChange={(e) => updateProp('backgroundColor', e.target.value)} />
                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                           <input type="checkbox" checked={selectedElement.backgroundColor === 'transparent'}
                            onChange={(e) => updateProp('backgroundColor', e.target.checked ? 'transparent' : '#000000')} />
                           Transparente
                        </label>
                     </div>
                  </div>
                </div>
              )}

              {/* --- PROPIEDADES DE VIDEO --- */}
              {selectedElement.type === 'video' && selectedElement.videoProps && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
                   <div className="flex items-center justify-between">
                      <button onClick={() => updateVideoProp('playing', !selectedElement.videoProps?.playing)}
                        className={`p-2 rounded-full ${selectedElement.videoProps.playing ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                        {selectedElement.videoProps.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                      </button>
                      <button onClick={() => updateVideoProp('muted', !selectedElement.videoProps?.muted)}
                        className={`p-2 rounded-full ${selectedElement.videoProps.muted ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {selectedElement.videoProps.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                   </div>

                   <div>
                      <label className="text-xs text-gray-400 flex justify-between mb-1">
                        Volumen <span>{Math.round(selectedElement.videoProps.volume * 100)}%</span>
                      </label>
                      <input type="range" min="0" max="1" step="0.01"
                        value={selectedElement.videoProps.volume}
                        onChange={(e) => updateVideoProp('volume', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                   </div>

                   <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-2 hover:bg-white/5 rounded">
                      <input type="checkbox" checked={selectedElement.videoProps.loop}
                        onChange={(e) => updateVideoProp('loop', e.target.checked)}
                        className="accent-cyan-400" />
                      Repetir en Bucle (Loop)
                   </label>
                </div>
              )}

              <div className="pt-8 mt-4 border-t border-gray-700">
                <button onClick={deleteElement} className="w-full py-3 flex items-center justify-center gap-2 text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 transition-all font-bold text-sm shadow-sm">
                  <Trash2 size={16} /> ELIMINAR ELEMENTO
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-60">
               <div className="p-4 rounded-full bg-gray-700/30 ring-1 ring-gray-700"><Monitor size={32} /></div>
               <p className="text-sm text-center px-8">Selecciona un elemento para editar.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800 z-10">
          <button onClick={logout} className="w-full py-2.5 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
