'use client';

import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PinTerritorial, PinCategoria, PinEstado, LocalidadNombre } from '@/types';
import { LOCALIDADES, CONCEJALES } from '@/data/mockData';
import { 
  MapPin, 
  PlusCircle, 
  Trash2, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';

export default function AdminPinPickerInner() {
  const [pines, setPines] = useState<PinTerritorial[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: -34.825,
    lng: -58.385
  });

  // Form fields
  const [titulo, setTitulo] = useState('');
  const [calle, setCalle] = useState('');
  const [localidad, setLocalidad] = useState<LocalidadNombre>('Burzaco');
  const [categoria, setCategoria] = useState<PinCategoria>('Arreglo de Calles / Asfalto');
  const [estado, setEstado] = useState<PinEstado>('Proyecto Presentado en HCD');
  const [concejal, setConcejal] = useState('Juan Pedro Aquino');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfNombre, setPdfNombre] = useState('');

  // Uploading states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Load existing pins
  const loadPines = () => {
    fetch('/api/pines')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setPines(data);
      })
      .catch((e) => console.warn('Error loading pins:', e));
  };

  useEffect(() => {
    loadPines();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-34.820, -58.380],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
    });

    // Capa oficial ESRI World Street Map: 100% limpia, sin marcas de agua de API key
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Map &copy; Esri &mdash; Almirante Brown',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'admin-temp-pin',
      html: `
        <div style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6)); cursor: grab;">
          <svg width="34" height="42" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14.8 23.3 15.4 23.8.4.3.9.3 1.2 0C17.2 39.3 32 26.5 32 16c0-8.84-7.16-16-16-16z" fill="#f59e0b"/>
            <path d="M16 1C7.72 1 1 7.72 1 16c0 9.8 14.2 22.3 15 23 0.8-.7 15-13.2 15-23C31 7.72 24.28 1 16 1z" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="15" r="5" fill="#08040d"/>
          </svg>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
    });

    // Create default marker
    const marker = L.marker([-34.825, -58.385], { icon: pinIcon, draggable: true }).addTo(map);
    tempMarkerRef.current = marker;

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setSelectedCoords({ lat: Number(pos.lat.toFixed(5)), lng: Number(pos.lng.toFixed(5)) });
    });

    // On Click anywhere on map
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
      marker.setLatLng([lat, lng]);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center map when locality changes
  const handleLocalidadChange = (locNombre: LocalidadNombre) => {
    setLocalidad(locNombre);
    const loc = LOCALIDADES.find((l) => l.nombre === locNombre);
    if (loc && mapInstanceRef.current && tempMarkerRef.current) {
      mapInstanceRef.current.flyTo(loc.coordenadas, 14);
      tempMarkerRef.current.setLatLng(loc.coordenadas);
      setSelectedCoords({ lat: loc.coordenadas[0], lng: loc.coordenadas[1] });
    }
  };

  // Upload Photo handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setFotoUrl(data.url);
      } else {
        alert('Error al subir la imagen');
      }
    } catch (err) {
      alert('Error de conexión al subir imagen');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Upload PDF handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPdfUrl(data.url);
        setPdfNombre(data.originalName || file.name);
      } else {
        alert('Error al subir el archivo PDF');
      }
    } catch (err) {
      alert('Error de conexión al subir PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Save Pin handler
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !calle) {
      alert('Por favor completá el título y la calle del reclamo o proyecto.');
      return;
    }

    const newPin: PinTerritorial = {
      id: `pin-${Date.now()}`,
      titulo,
      calle,
      localidad,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      categoria,
      estado,
      concejal,
      descripcion: descripcion || 'Pedido territorial registrado por el bloque de concejales.',
      fotos: fotoUrl ? [fotoUrl] : ['/img/vecinos1.jpeg'],
      pdfUrl: pdfUrl || undefined,
      pdfNombre: pdfNombre || undefined,
      fecha: new Date().toLocaleDateString('es-AR'),
      apoyosVecinales: 1,
    };

    try {
      const res = await fetch('/api/pines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPin),
      });

      if (res.ok) {
        alert('¡Pin territorial guardado exitosamente en PostgreSQL!');
        // Reset form
        setTitulo('');
        setCalle('');
        setDescripcion('');
        setFotoUrl('');
        setPdfUrl('');
        setPdfNombre('');
        loadPines();
      } else {
        alert('Hubo un error al guardar el pin.');
      }
    } catch (err) {
      alert('Error de conexión al guardar.');
    }
  };

  // Delete Pin handler
  const handleDeletePin = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar este pin territorial?')) return;
    try {
      const res = await fetch(`/api/pines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPines((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Error al eliminar pin.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Map Picker Column (6 cols) */}
      <div className="lg:col-span-6 glass-panel rounded-3xl p-5 border border-purple-500/30 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Elegí la Calle en el Mapa
            </h3>
          </div>
          <span className="text-xs text-amber-300 font-mono">
            Lat: {selectedCoords.lat}, Lng: {selectedCoords.lng}
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Hacé click en cualquier calle o esquina de Almirante Brown para posicionar el pin, o arrastrá el marcador amarillo:
        </p>

        {/* Leaflet Canvas */}
        <div
          ref={mapContainerRef}
          className="w-full h-[400px] rounded-2xl overflow-hidden border border-purple-900/60 z-0"
        />

        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">Punto seleccionado:</span>
          <span className="text-amber-400 font-mono font-bold">
            [{selectedCoords.lat}, {selectedCoords.lng}]
          </span>
        </div>
      </div>

      {/* Form Column (6 cols) */}
      <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
          <PlusCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            2. Completá los Datos del Reclamo o Proyecto
          </h3>
        </div>

        <form onSubmit={handleCreatePin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título del Reclamo / Obra *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Pedido de Asfalto y Cordón Cuneta en Calle Salta"
              className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Calle y Altura / Esquina *
              </label>
              <input
                type="text"
                required
                value={calle}
                onChange={(e) => setCalle(e.target.value)}
                placeholder="Ej: Calle Salta y Bynnon"
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Localidad *
              </label>
              <select
                value={localidad}
                onChange={(e) => handleLocalidadChange(e.target.value as LocalidadNombre)}
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {LOCALIDADES.map((l) => (
                  <option key={l.id} value={l.nombre} className="bg-[#140b24]">
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as PinCategoria)}
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Arreglo de Calles / Asfalto" className="bg-[#140b24]">🚧 Arreglo de Calles / Asfalto</option>
                <option value="Seguridad / Luminarias" className="bg-[#140b24]">🚨 Seguridad / Luminarias</option>
                <option value="Proyecto de Ordenanza HCD" className="bg-[#140b24]">🏛️ Proyecto de Ordenanza HCD</option>
                <option value="Visita Vecinal / Reclamo" className="bg-[#140b24]">🤝 Visita Vecinal / Reclamo</option>
                <option value="Salud / CAPS" className="bg-[#140b24]">🏥 Salud / CAPS</option>
                <option value="Medio Ambiente / Basurales" className="bg-[#140b24]">♻️ Medio Ambiente / Basurales</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as PinEstado)}
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Reclamo Vecinal Recibido" className="bg-[#140b24]">Reclamo Vecinal Recibido</option>
                <option value="Proyecto Presentado en HCD" className="bg-[#140b24]">Proyecto Presentado en HCD</option>
                <option value="En Gestión / Comisión" className="bg-[#140b24]">En Gestión / Comisión</option>
                <option value="Resuelto / Completado" className="bg-[#140b24]">Resuelto / Completado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Concejal Responsable / Autor
            </label>
            <select
              value={concejal}
              onChange={(e) => setConcejal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {CONCEJALES.map((c) => (
                <option key={c.id} value={c.nombre} className="bg-[#140b24]">
                  {c.nombre}
                </option>
              ))}
              <option value="Bloque LLA Almirante Brown" className="bg-[#140b24]">Bloque LLA Almirante Brown</option>
            </select>
          </div>

          {/* Subir Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Foto del Lugar / Bache / Actividad
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-800 hover:border-amber-400 cursor-pointer flex items-center justify-center gap-2 text-xs text-purple-200 transition-all">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{isUploadingPhoto ? 'Subiendo...' : fotoUrl ? 'Foto Cargada ✓' : 'Seleccionar Imagen (JPG/PNG)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {fotoUrl && (
                <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[150px]">
                  {fotoUrl}
                </span>
              )}
            </div>
          </div>

          {/* Subir PDF */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Proyecto de Ordenanza / Nota Oficial (PDF)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-800 hover:border-amber-400 cursor-pointer flex items-center justify-center gap-2 text-xs text-purple-200 transition-all">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{isUploadingPdf ? 'Subiendo PDF...' : pdfUrl ? `PDF: ${pdfNombre} ✓` : 'Adjuntar Documento PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
              {pdfUrl && (
                <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[150px]">
                  {pdfNombre}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción del Problema o Propuesta *
            </label>
            <textarea
              required
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explicación del reclamo de los vecinos, expediente legislativo, plazo estimado..."
              className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            Guardar Pin en el Mapa de Brown
          </button>
        </form>
      </div>

      {/* Existing Pins List (12 cols) */}
      <div className="lg:col-span-12 mt-6 pt-6 border-t border-purple-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Pines y Proyectos Registrados en Almirante Brown ({pines.length})</span>
          </h3>
          <span className="text-xs text-purple-300">
            Monitoreo en tiempo real por localidad
          </span>
        </div>

        {/* Cobertura Territorial por Localidad */}
        <div className="mb-6 p-4 rounded-2xl glass-panel border border-purple-900/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-2">
            Cantidad de Proyectos y Reclamos por Localidad:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {LOCALIDADES.map((loc) => {
              const count = pines.filter((p) => p.localidad === loc.nombre).length;
              return (
                <div
                  key={loc.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    count > 0
                      ? 'bg-purple-900/40 border-purple-700/60 text-white'
                      : 'bg-purple-950/20 border-purple-900/30 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-semibold block truncate">{loc.nombre}</span>
                  <span className={`text-sm font-black block mt-0.5 ${count > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {count} {count === 1 ? 'pin' : 'pines'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pines.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl glass-panel border border-purple-900/40 flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{p.calle} · {p.localidad}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{p.titulo}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 mb-2">{p.descripcion}</p>
                
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                    {p.categoria}
                  </span>
                  <span className="text-slate-400">Autor: {p.concejal}</span>
                  {p.pdfUrl && (
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      <FileText className="w-3 h-3" /> PDF
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeletePin(p.id)}
                className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60 transition-colors"
                title="Eliminar pin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
