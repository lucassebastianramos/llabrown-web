import {
  FormularioDinamico,
  MiembroEquipo,
  NoticiaItem,
  SiteConfig,
  UserRole,
} from '@/types';

export interface SeedUserSpec {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  cargo: string;
  email: string;
  initialPassword: string;
}

export const DEFAULT_USERS: SeedUserSpec[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    nombre: 'Administración General LLA Brown',
    role: 'admin',
    cargo: 'Administrador del Sistema',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'lla2025',
  },
  {
    id: 'usr-coordinacion',
    username: 'coordinacion',
    nombre: 'Coordinación Distrital LLA Brown',
    role: 'admin',
    cargo: 'Coordinación y Aprobación Editorial',
    email: 'prensa@llabrown.com.ar',
    initialPassword: 'brown2026',
  },
  // 8 Concejales (cuentas de equipo: solo cargan noticias, expedientes y novedades a revisión)
  {
    id: 'usr-juan-aquino',
    username: 'juan.aquino',
    nombre: 'Juan Pedro Aquino',
    role: 'editor',
    cargo: 'Concejal · Jefe de Bloque',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'aquino2026',
  },
  {
    id: 'usr-diego-garrido',
    username: 'diego.garrido',
    nombre: 'Diego Garrido',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'garrido2026',
  },
  {
    id: 'usr-ezequiel-barreiro',
    username: 'ezequiel.barreiro',
    nombre: 'Ezequiel Barreiro',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'barreiro2026',
  },
  {
    id: 'usr-florencia-colman',
    username: 'florencia.colman',
    nombre: 'Florencia Colman',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'colman2026',
  },
  {
    id: 'usr-ariel-vieyra',
    username: 'ariel.vieyra',
    nombre: 'Ariel Vieyra',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'vieyra2026',
  },
  {
    id: 'usr-natalia-german',
    username: 'natalia.german',
    nombre: 'Natalia German',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'german2026',
  },
  {
    id: 'usr-ivan-ibanez',
    username: 'ivan.ibanez',
    nombre: 'Ivan Ibañez',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'ibanez2026',
  },
  {
    id: 'usr-miriam-locher',
    username: 'miriam.locher',
    nombre: 'Miriam Locher',
    role: 'editor',
    cargo: 'Concejal LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'locher2026',
  },
  // 4 Consejeros Escolares
  {
    id: 'usr-jorge-gangi',
    username: 'jorge.gangi',
    nombre: 'Jorge Gangi',
    role: 'editor',
    cargo: 'Consejero Escolar · Vicepresidente',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'gangi2026',
  },
  {
    id: 'usr-yanina-niczyporuk',
    username: 'yanina.niczyporuk',
    nombre: 'Yanina Niczyporuk',
    role: 'editor',
    cargo: 'Consejera Escolar LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'niczyporuk2026',
  },
  {
    id: 'usr-silvina-barreiro',
    username: 'silvina.barreiro',
    nombre: 'Silvina Barreiro',
    role: 'editor',
    cargo: 'Consejera Escolar LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'sbarreiro2026',
  },
  {
    id: 'usr-juan-cardenas',
    username: 'juan.cardenas',
    nombre: 'Juan Jose Cardenas',
    role: 'editor',
    cargo: 'Consejero Escolar LLA',
    email: 'lalibertadavanza@llabrown.com.ar',
    initialPassword: 'cardenas2026',
  },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  heroTitulo: 'Defendemos al vecino en el Concejo y en cada barrio de Brown',
  heroSubtitulo:
    'Impulsamos proyectos reales de baja de tasas y control del gasto municipal, recorremos las 13 localidades del distrito y auditamos cada reclamo barrial con número de seguimiento.',
  heroLema: '#TuVozConstruye',
  sedeDireccion: 'Humberto Primo 990, Burzaco',
  whatsappNumero: '5491131596936',
  whatsappDisplay: '11 3159-6936',
  instagramUrl: 'https://www.instagram.com/lalibertadavanza_altebrownok',
  facebookUrl: 'https://www.facebook.com/lalibertadavanzaaltebrown',
  emailGeneral: 'lalibertadavanza@llabrown.com.ar',
  emailFiscalizacion: 'fiscalizacion@llabrown.com.ar',
  emailPrensa: 'prensa@llabrown.com.ar',
  barriosCount: 176,
  nacionTitulo: 'Agenda de Nación, Provincia y Almirante Brown',
  nacionBajada:
    'Alineados con el rumbo de orden fiscal, baja de impuestos y desregulación en todo el país, articulamos junto a los legisladores nacionales y bonaerenses de La Libertad Avanza.',
  zohoSmtpHost: 'smtp.zoho.com',
  zohoSmtpPort: 465,
  zohoSmtpUser: 'lalibertadavanza@llabrown.com.ar',
  zohoSmtpConfigured: false,
};

export const LEGISLADORES_INICIALES: MiembroEquipo[] = [
  {
    id: 'leg-prov-1',
    nombre: 'Bloque Diputados Provinciales LLA',
    rol: 'Legislatura de la Provincia de Buenos Aires · Tercera Sección',
    localidad: 'Provincia de Buenos Aires',
    foto: '/img/a7.jpg',
    tipo: 'legislador_provincial',
    bio: 'Articulación legislativa en la Cámara de Diputados bonaerense para exigir baja de impuestos provinciales, seguridad en el Conurbano Sur e infraestructura escolar en Almirante Brown. Editá o cargá legisladores individuales desde el panel.',
    orden: 1,
    activo: true,
  },
  {
    id: 'leg-prov-2',
    nombre: 'Bloque Senadores Provinciales LLA',
    rol: 'Honorable Senado de la Provincia de Buenos Aires',
    localidad: 'Provincia de Buenos Aires',
    foto: '/img/a8.jpg',
    tipo: 'legislador_provincial',
    bio: 'Control parlamentario sobre el presupuesto provincial, coparticipación y rendición de fondos destinados a los municipios de la Tercera Sección Electoral.',
    orden: 2,
    activo: true,
  },
  {
    id: 'leg-nac-1',
    nombre: 'Bloque Diputados Nacionales LLA',
    rol: 'Honorable Cámara de Diputados de la Nación',
    localidad: 'Congreso de la Nación Argentina',
    foto: '/img/a6.jpg',
    tipo: 'legislador_nacional',
    bio: 'Representación nacional impulsando leyes de equilibrio fiscal, modernización laboral, baja de retenciones e impuestos y desregulación económica para la Argentina.',
    orden: 1,
    activo: true,
  },
  {
    id: 'leg-nac-2',
    nombre: 'Representación Nacional PBA · LLA',
    rol: 'Congreso de la Nación · Provincia de Buenos Aires',
    localidad: 'Nación / Provincia de Buenos Aires',
    foto: '/img/a5.JPG',
    tipo: 'legislador_nacional',
    bio: 'Trabajo conjunto entre el Congreso Nacional y los concejos deliberantes bonaerenses para trasladar el orden fiscal y la transparencia a cada municipio.',
    orden: 2,
    activo: true,
  },
];

export const NOTICIAS_INICIALES: NoticiaItem[] = [
  {
    id: 'not-1',
    titulo: 'Agenda Nacional: equilibrio fiscal y eliminación de trabas para quienes producen',
    bajada:
      'El orden macroeconómico nacional se complementa en Almirante Brown con iniciativas locales para reducir tasas municipales y eliminar derechos de habilitación comercial.',
    cuerpo:
      'Desde La Libertad Avanza Almirante Brown acompañamos las reformas impulsadas a nivel nacional para bajar la inflación, ordenar las cuentas públicas y quitarle el peso del Estado a comerciantes, pymes y familias trabajadoras. En el Concejo Deliberante trabajamos para replicar esa misma austeridad en el gasto municipal.',
    ambito: 'Nación',
    localidad: 'Argentina / Almirante Brown',
    imagenUrl: '/img/a6.jpg',
    autor: 'Prensa LLA Almirante Brown',
    fecha: '24/11/2026',
    destacada: true,
    estadoAprobacion: 'aprobado',
    creadoPor: 'admin',
    revisadoPor: 'admin',
  },
  {
    id: 'not-2',
    titulo: 'Articulación con la Tercera Sección Electoral para auditar fondos bonaerenses',
    bajada:
      'Concejales y legisladores provinciales de La Libertad Avanza coordinaron pedidos de informes sobre seguridad, rutas y partidas educativas destinadas al Conurbano Sur.',
    cuerpo:
      'En una reunión de trabajo con representantes bonaerenses de la Tercera Sección, el bloque encabezado por Juan Pedro Aquino repasó los reclamos prioritarios de las 13 localidades de Almirante Brown, con eje en el Fondo Educativo, corredores escolares seguros y mantenimiento de avenidas provinciales.',
    ambito: 'Provincia',
    localidad: 'Tercera Sección / Almirante Brown',
    imagenUrl: '/img/a7.jpg',
    autor: 'Coordinación Seccional LLA',
    fecha: '20/11/2026',
    destacada: true,
    estadoAprobacion: 'aprobado',
    creadoPor: 'admin',
    revisadoPor: 'admin',
  },
  {
    id: 'not-3',
    titulo: 'Nuevo canal de seguimiento vecinal y transparencia legislativa en Brown',
    bajada:
      'Los vecinos de las 13 localidades ya pueden cargar reclamos con código único de auditoría y verificar el avance de los proyectos presentados en el HCD.',
    cuerpo:
      'Cada reclamo registrado en nuestra plataforma queda asentado en la base de datos institucional del bloque para controlar los plazos de respuesta municipal y, ante demoras, elevar pedidos formales en el Honorable Concejo Deliberante.',
    ambito: 'Distrito',
    localidad: 'Almirante Brown',
    imagenUrl: '/img/PedroAquino.jpg.jpg',
    autor: 'Bloque Concejales LLA Brown',
    fecha: '18/11/2026',
    destacada: false,
    estadoAprobacion: 'aprobado',
    creadoPor: 'admin',
    revisadoPor: 'admin',
  },
];

export const FORMULARIOS_INICIALES: FormularioDinamico[] = [
  {
    id: 'form-fiscalizacion',
    slug: 'fiscalizacion',
    titulo: 'Inscripción de Fiscales — Almirante Brown',
    descripcion:
      'Sumate al equipo de fiscalización de La Libertad Avanza en tu escuela y localidad para cuidar cada voto en Almirante Brown.',
    categoria: 'Fiscalización',
    emailNotificacion: 'fiscalizacion@llabrown.com.ar',
    activo: true,
    creadoPor: 'admin',
    campos: [
      { id: 'nombre', label: 'Nombre y apellido', tipo: 'text', requerido: true, placeholder: 'Ej: Martín Rodríguez' },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true, placeholder: 'Sin puntos' },
      { id: 'telefono', label: 'WhatsApp / Teléfono', tipo: 'tel', requerido: true, placeholder: '11 XXXX-XXXX' },
      { id: 'email', label: 'Correo electrónico', tipo: 'email', requerido: false, placeholder: 'tu@correo.com' },
      { id: 'localidad', label: 'Localidad donde votás', tipo: 'localidad', requerido: true },
      {
        id: 'rol_fiscal',
        label: 'Rol en el que te gustaría colaborar',
        tipo: 'select',
        requerido: true,
        opciones: ['Fiscal de Mesa', 'Fiscal General de Escuela', 'Logística y Movilidad', 'Capacitación / Coordinación'],
      },
      { id: 'experiencia', label: '¿Ya fiscalizaste en elecciones anteriores?', tipo: 'checkbox', requerido: false },
    ],
  },
  {
    id: 'form-sumate',
    slug: 'sumate',
    titulo: 'Sumate a La Libertad Avanza Brown',
    descripcion:
      'Dejanos tus datos para integrarte a las mesas barriales, voluntariado o equipos técnicos de tu localidad.',
    categoria: 'Participación',
    emailNotificacion: 'lalibertadavanza@llabrown.com.ar',
    activo: true,
    creadoPor: 'admin',
    campos: [
      { id: 'nombre', label: 'Nombre y apellido', tipo: 'text', requerido: true, placeholder: 'Tu nombre completo' },
      { id: 'localidad', label: 'Localidad', tipo: 'localidad', requerido: true },
      { id: 'telefono', label: 'Teléfono / WhatsApp', tipo: 'tel', requerido: true, placeholder: '11 XXXX-XXXX' },
      { id: 'email', label: 'Correo electrónico', tipo: 'email', requerido: false, placeholder: 'tu@correo.com' },
      {
        id: 'participacion',
        label: '¿Cómo querés participar?',
        tipo: 'select',
        requerido: true,
        opciones: [
          'Fiscalizar mesas',
          'Sumarme al equipo territorial de mi barrio',
          'Acercar proyectos para el Concejo Deliberante',
          'Comerciante o pyme',
          'Voluntario general',
        ],
      },
      { id: 'mensaje', label: 'Mensaje o barrio', tipo: 'textarea', requerido: false, placeholder: 'Contanos tu inquietud o propuesta' },
    ],
  },
  {
    id: 'form-prensa',
    slug: 'prensa-y-propuestas',
    titulo: 'Contacto de Prensa y Propuestas Legislativas',
    descripcion:
      'Canal directo para medios locales, instituciones barriales y vecinos que quieran elevar documentación o propuestas al bloque.',
    categoria: 'Prensa',
    emailNotificacion: 'prensa@llabrown.com.ar',
    activo: true,
    creadoPor: 'admin',
    campos: [
      { id: 'nombre', label: 'Nombre y apellido', tipo: 'text', requerido: true },
      { id: 'organizacion', label: 'Medio, comercio o institución (opcional)', tipo: 'text', requerido: false },
      { id: 'telefono', label: 'Teléfono / WhatsApp', tipo: 'tel', requerido: true },
      { id: 'email', label: 'Correo electrónico', tipo: 'email', requerido: true },
      { id: 'localidad', label: 'Localidad', tipo: 'localidad', requerido: true },
      { id: 'detalle', label: 'Consulta o propuesta', tipo: 'textarea', requerido: true },
    ],
  },
];
