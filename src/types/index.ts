export type LocalidadNombre = string;

export type UserRole = 'admin' | 'editor';

export type ApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface SessionUser {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  cargo: string;
}

export interface UsuarioSistema {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  cargo: string;
  email?: string;
  activo: boolean;
  createdAt?: string;
}

export interface LocalidadInfo {
  id: string;
  nombre: string;
  circuito: string;
  wa: string;
  descripcion: string;
  coordenadas: [number, number]; // [lat, lng]
  hitos: string[];
  referenteNombre: string;
  destacado: string;
  activo?: boolean;
  orden?: number;
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
  estadoAprobacion?: ApprovalStatus;
  creadoPor?: string;
  revisadoPor?: string;
  revisadoAt?: string;
  motivoRechazo?: string;
  deletedAt?: string | null;
}

export interface VisitaTerritorial {
  id: string;
  titulo: string;
  localidad: string;
  circuito?: string;
  fecha: string;
  descripcion: string;
  fotos: string[];
  concejales: string[];
  temasTratados: string[];
  estadoAprobacion?: ApprovalStatus;
  creadoPor?: string;
  revisadoPor?: string;
  revisadoAt?: string;
  motivoRechazo?: string;
  deletedAt?: string | null;
}

export type NoticiaAmbito = 'Nación' | 'Provincia' | 'Distrito' | 'Novedades';

export interface NoticiaItem {
  id: string;
  titulo: string;
  bajada: string;
  cuerpo: string;
  ambito: NoticiaAmbito;
  localidad?: string;
  imagenUrl?: string;
  fuenteUrl?: string;
  autor: string;
  fecha: string;
  destacada?: boolean;
  estadoAprobacion: ApprovalStatus;
  creadoPor?: string;
  revisadoPor?: string;
  revisadoAt?: string;
  motivoRechazo?: string;
  deletedAt?: string | null;
  createdAt?: string;
}

export type TipoMiembroEquipo =
  | 'concejal'
  | 'consejero'
  | 'legislador_provincial'
  | 'legislador_nacional';

export interface MiembroEquipo {
  id: string;
  nombre: string;
  rol: string;
  localidad: string;
  foto: string;
  estilo?: string;
  tipo: TipoMiembroEquipo;
  bio?: string;
  orden?: number;
  activo?: boolean;
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
  localidad: string;
  barrio?: string;
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
  | 'Enviado a Gestión Municipal'
  | 'En Auditoría HCD'
  | 'Resuelto';

export interface ReclamoVecinal {
  id: string;
  codigoSeguimiento: string;
  nombreVecino: string;
  apellidoVecino?: string;
  dniVecino?: string;
  telefonoVecino: string;
  localidad: string;
  barrio?: string;
  calle: string;
  altura?: string;
  entreCalles?: string;
  tipoReclamo: string;
  subtipoReclamo?: string;
  descripcion: string;
  normaDigesto?: string;
  estado: ReclamoEstado;
  numeroReclamoMunicipal?: string;
  patrocinadoPor: string;
  fecha: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
}

export type CampoTipo =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'localidad'
  | 'checkbox'
  | 'date';

export interface CampoFormulario {
  id: string;
  label: string;
  tipo: CampoTipo;
  requerido: boolean;
  placeholder?: string;
  opciones?: string[];
}

export interface FormularioDinamico {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  emailNotificacion?: string;
  campos: CampoFormulario[];
  activo: boolean;
  respuestasCount?: number;
  creadoPor?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface FormularioRespuesta {
  id: string;
  formularioId: string;
  formularioSlug: string;
  datos: Record<string, string | boolean>;
  createdAt: string;
}

export interface SiteConfig {
  heroTitulo: string;
  heroSubtitulo: string;
  heroLema: string;
  sedeDireccion: string;
  whatsappNumero: string;
  whatsappDisplay: string;
  instagramUrl: string;
  facebookUrl: string;
  emailGeneral: string;
  emailFiscalizacion: string;
  emailPrensa: string;
  barriosCount: number;
  nacionTitulo: string;
  nacionBajada: string;
  zohoSmtpHost?: string;
  zohoSmtpPort?: number;
  zohoSmtpUser?: string;
  zohoSmtpConfigured?: boolean;
}

export interface CorreoEnviado {
  id: string;
  remitente: string;
  destinatarios: string[];
  asunto: string;
  cuerpo: string;
  estado: 'enviado' | 'error' | 'simulado';
  errorDetalle?: string;
  enviadoPor: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  usuario: string;
  rol: string;
  detalle?: string;
  respaldoJson: Record<string, unknown>;
  createdAt: string;
}
