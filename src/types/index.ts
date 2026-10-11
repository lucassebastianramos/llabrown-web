export type LocalidadNombre = 
  | 'Adrogué'
  | 'Burzaco'
  | 'Claypole'
  | 'Don Orione'
  | 'Glew'
  | 'José Mármol'
  | 'Longchamps'
  | 'Malvinas Argentinas'
  | 'Ministro Rivadavia'
  | 'Rafael Calzada'
  | 'San Francisco de Asís'
  | 'San José'
  | 'Solano';

export interface LocalidadInfo {
  id: string;
  nombre: LocalidadNombre;
  circuito: string;
  wa: string;
  descripcion: string;
  coordenadas: [number, number]; // [lat, lng]
  hitos: string[];
  referenteNombre: string;
  destacado: string;
}

export interface ProyectoHCD {
  id: string;
  titulo: string;
  expediente?: string;
  archivoPdf?: string;
  archivoNombre?: string;
  fecha: string;
  autor: string;
  localidad: string;
  categoria: 'Seguridad' | 'Transparencia' | 'Infraestructura' | 'Baja de Tasas' | 'Educación' | 'Salud' | 'Desregulación';
  estado: 'Presentado' | 'En Comisión' | 'Aprobado' | 'En Tratamiento';
  resumen: string;
  destacado?: boolean;
}

export interface VisitaTerritorial {
  id: string;
  titulo: string;
  localidad: LocalidadNombre;
  circuito?: string;
  fecha: string;
  descripcion: string;
  fotos: string[];
  concejales: string[];
  temasTratados: string[];
}

export interface MiembroEquipo {
  id: string;
  nombre: string;
  rol: string;
  localidad: string;
  foto: string;
  estilo?: string;
  tipo: 'concejal' | 'consejero';
  bio?: string;
  redes?: {
    instagram?: string;
    twitter?: string;
  };
}

export type PinCategoria = 
  | 'Arreglo de Calles / Asfalto'
  | 'Seguridad / Luminarias'
  | 'Proyecto de Ordenanza HCD'
  | 'Visita Vecinal / Reclamo'
  | 'Salud / CAPS'
  | 'Medio Ambiente / Basurales';

export type PinEstado = 
  | 'Reclamo Vecinal Recibido'
  | 'Proyecto Presentado en HCD'
  | 'En Gestión / Comisión'
  | 'Resuelto / Completado';

export interface PinTerritorial {
  id: string;
  titulo: string;
  calle: string;
  localidad: LocalidadNombre;
  barrio?: string; // Barrio oficial según Ordenanza 13.906
  lat: number;
  lng: number;
  categoria: PinCategoria;
  estado: PinEstado;
  descripcion: string;
  concejal: string;
  fotos: string[];
  pdfUrl?: string;
  pdfNombre?: string;
  fecha: string;
  apoyosVecinales?: number;
}

export type ReclamoEstado = 
  | 'Registrado en LLA'
  | 'Enviado a BrownGestión'
  | 'En Auditoría HCD'
  | 'Resuelto';

export interface ReclamoVecinal {
  id: string;
  codigoSeguimiento: string; // ej. LLA-REC-2025-XXXX
  nombreVecino: string;
  apellidoVecino?: string;
  dniVecino?: string;
  telefonoVecino: string;
  localidad: LocalidadNombre;
  barrio?: string; // Barrio de Ordenanza 13.906
  calle: string;
  altura?: string;
  entreCalles?: string;
  tipoReclamo: string;
  subtipoReclamo?: string;
  descripcion: string;
  normaDigesto?: string; // Cita del Digesto Oficial (https://a.brown.gob.ar/hcd/digesto)
  estado: ReclamoEstado;
  numeroReclamoMunicipal?: string; // N° oficial devuelto o registrado en Solicitudes Brown
  patrocinadoPor: string; // 'Juan Pedro Aquino - Jefe de Bloque Concejales LLA'
  fecha: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
}

