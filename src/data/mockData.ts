import { LocalidadInfo, MiembroEquipo, ProyectoHCD, VisitaTerritorial } from '../types';

export const LOCALIDADES: LocalidadInfo[] = [
  {
    id: 'adrogue',
    nombre: 'Adrogué',
    circuito: '0017',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Cabecera histórica de Almirante Brown. Centro neurálgico con intensa actividad cívica, educativa y comercial.',
    coordenadas: [-34.7983, -58.3917],
    hitos: ['Plaza Brown', 'Palacio Municipal', 'Estación Adrogué', 'Centro Comercial Mitre'],
    referenteNombre: 'Equipo Territorial Adrogué',
    destacado: 'Mesas informativas semanales y reuniones de comerciantes por baja de tasas.'
  },
  {
    id: 'burzaco',
    nombre: 'Burzaco',
    circuito: '0019',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Corazón productivo e industrial del partido. Aquí se encuentra nuestra Sede Central en Humberto Primo 990.',
    coordenadas: [-34.8290, -58.3942],
    hitos: ['Sede Central Humberto Primo 990', 'Plaza Manuel Belgrano', 'Monumento a la Bandera', 'Parque Industrial Burzaco'],
    referenteNombre: 'Juan Pedro Aquino y Equipo Central',
    destacado: 'Sede permanente de atención al vecino, asesoría legal y recepción de proyectos.'
  },
  {
    id: 'claypole',
    nombre: 'Claypole',
    circuito: '0022A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Localidad con gran tradición deportiva y barrial. Importante nodo de conexión con Florencio Varela y Quilmes.',
    coordenadas: [-34.7989, -58.3377],
    hitos: ['Estación Claypole', 'Club Atlético Claypole', 'Avenida 2 de Abril', 'Peatonal Alsina'],
    referenteNombre: 'Equipo Territorial Claypole',
    destacado: 'Relevamiento de cloacas y luminarias en barrios periféricos.'
  },
  {
    id: 'don-orione',
    nombre: 'Don Orione',
    circuito: '0022A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Gran complejo habitacional y comunidad viva con enorme potencial de desarrollo y demandas de infraestructura.',
    coordenadas: [-34.8105, -58.3411],
    hitos: ['Complejo Habitacional Don Orione', 'Santuario Cottolengo', 'Polideportivo', 'Centro Comunitario'],
    referenteNombre: 'Equipo Territorial Don Orione',
    destacado: 'Presencia constante en plazas y diálogo con centros de jubilados.'
  },
  {
    id: 'glew',
    nombre: 'Glew',
    circuito: '0022',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Polo cultural del maestro Soldi y puerta sur de Almirante Brown. Zona en sostenida expansión demográfica.',
    coordenadas: [-34.8872, -58.3842],
    hitos: ['Fundación Soldi', 'Estación Glew', 'Circuito Almafuerte', 'Barrio Los Álamos'],
    referenteNombre: 'Equipo Territorial Glew',
    destacado: 'Plan de seguridad vecinal y pedidos de asfalto en arterias clave.'
  },
  {
    id: 'jose-marmol',
    nombre: 'José Mármol',
    circuito: '0018',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Tranquila localidad residencial con gran identidad barrial y comercios de cercanía.',
    coordenadas: [-34.7836, -58.3752],
    hitos: ['Estación José Mármol', 'Plaza Nuestra Señora de Luján', 'Avenida Bynnon'],
    referenteNombre: 'Equipo Territorial Mármol',
    destacado: 'Escuchas vecinales sobre poda, luminarias y tránsito escolar seguro.'
  },
  {
    id: 'longchamps',
    nombre: 'Longchamps',
    circuito: '0021',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Cuna de la aviación sudamericana, núcleo comercial vibrante con barrios unidos y participativos.',
    coordenadas: [-34.8601, -58.3881],
    hitos: ['Primer Vuelo Controlado', 'Estación Longchamps', 'Plaza González', 'Avenida Hipólito Yrigoyen'],
    referenteNombre: 'Equipo Territorial Longchamps',
    destacado: 'Mesas de fiscalización y apoyo permanente a los emprendedores locales.'
  },
  {
    id: 'malvinas-argentinas',
    nombre: 'Malvinas Argentinas',
    circuito: '0018A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Comunidad pujante en el límite noreste, comprometida con el progreso y la seguridad de sus familias.',
    coordenadas: [-34.7862, -58.3490],
    hitos: ['Plaza Puerto Argentino', 'Avenida Monteverde', 'Sociedad de Fomento'],
    referenteNombre: 'Equipo Territorial Malvinas',
    destacado: 'Monitoreo de frecuencia de transporte público y reclamos viales.'
  },
  {
    id: 'ministro-rivadavia',
    nombre: 'Ministro Rivadavia',
    circuito: '0020A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'El pueblo histórico más antiguo del distrito, polo agroproductivo, viveros y zonas campestres.',
    coordenadas: [-34.8436, -58.4239],
    hitos: ['Iglesia Nuestra Señora del Tránsito', 'Paraje La Alameda', 'Zona Rural y Granjas'],
    referenteNombre: 'Equipo Territorial Rivadavia',
    destacado: 'Defensa de los productores locales y preservación del patrimonio histórico.'
  },
  {
    id: 'rafael-calzada',
    nombre: 'Rafael Calzada',
    circuito: '0018',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Ciudad con gran vida social, parroquias históricas y un centro comercial activo frente a las vías.',
    coordenadas: [-34.7878, -58.3615],
    hitos: ['Arco de Calzada', 'Plaza 25 de Mayo', 'Estación Rafael Calzada', 'Avenida San Martín'],
    referenteNombre: 'Equipo Territorial Calzada',
    destacado: 'Talleres comunitarios y jornadas de recolección de firmas por seguridad.'
  },
  {
    id: 'san-francisco-de-asis',
    nombre: 'San Francisco de Asís',
    circuito: '0022A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Localidad creada para jerarquizar el sector este, abarcando complejos y barrios en consolidación.',
    coordenadas: [-34.8055, -58.3278],
    hitos: ['Centro Cívico San Francisco', 'Plaza de las Américas', 'Complejo habitacional'],
    referenteNombre: 'Equipo Territorial San Francisco de Asís',
    destacado: 'Reuniones periódicas por alarmas comunitarias y corredores seguros.'
  },
  {
    id: 'san-jose',
    nombre: 'San José',
    circuito: '0018A',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'Localidad del noreste de Brown, caracterizada por su fuerte identidad comunitaria y comercial sobre avenidas Eva Perón y Salta.',
    coordenadas: [-34.7735, -58.3512],
    hitos: ['Plaza San Jerónimo', 'Avenida Eva Perón (Pasco)', 'Centro Comercial Salta', 'Sociedad de Fomento San José'],
    referenteNombre: 'Equipo Territorial San José',
    destacado: 'Relevamiento de luminarias, asfalto y corredores seguros en zonas comerciales.'
  },
  {
    id: 'solano',
    nombre: 'Solano',
    circuito: '0022B',
    wa: 'https://wa.me/5491131596936',
    descripcion: 'San Francisco Solano (sector Brown). Polo de empuje comercial arrollador y vecinos sumamente trabajadores.',
    coordenadas: [-34.7812, -58.3184],
    hitos: ['Paseo Comercial Calle 844', 'Plaza 13 de Julio', 'Límite arroyo Las Piedras'],
    referenteNombre: 'Equipo Territorial Solano',
    destacado: 'Campaña contra cobros extorsivos de habilitaciones municipales.'
  }
];

export const CONCEJALES: MiembroEquipo[] = [
  {
    id: 'juan-pedro-aquino',
    nombre: 'Juan Pedro Aquino',
    rol: 'Jefe de Bloque · Concejal',
    localidad: 'Burzaco / Almirante Brown',
    foto: '/img/foto1.jpeg',
    tipo: 'concejal',
    bio: 'Profesor de Historia y Ciencias Sociales formado en el Instituto Superior de Formación Docente Nº 41 (ISFD Nº 41) y referente territorial. Presidente del bloque de concejales de La Libertad Avanza en Almirante Brown y Coordinador seccional de concejales de LLA en la Tercera Sección Electoral bonaerense, promoviendo la baja de tasas municipales y el control del gasto público.',
    redes: {
      instagram: 'https://www.instagram.com/juanpedroaquino.ok'
    }
  },
  {
    id: 'diego-garrido',
    nombre: 'Diego Garrido',
    rol: 'Concejal',
    localidad: 'Burzaco / Almirante Brown',
    foto: '/img/foto2.jpeg',
    tipo: 'concejal',
    bio: 'Comerciante y empresario pyme del sector de equipamiento comercial. Concejal de LLA con trayectoria en gestión pública local, enfocado en el desarrollo económico, el alivio fiscal al comercio barrial y la simplificación de habilitaciones.'
  },
  {
    id: 'ezequiel-barreiro',
    nombre: 'Ezequiel Barreiro',
    rol: 'Concejal',
    localidad: 'Glew / Almirante Brown',
    foto: '/img/foto3.jpeg',
    tipo: 'concejal',
    bio: 'Dirigente político y concejal de La Libertad Avanza (período 2023–2027). Referente de organización territorial y fiscalización en el distrito, canalizando reclamos vecinales sobre seguridad, luminarias e infraestructura barrial.'
  },
  {
    id: 'florencia-colman',
    nombre: 'Florencia Colman',
    rol: 'Concejal',
    localidad: 'Claypole / Almirante Brown',
    foto: '/img/foto4.jpeg',
    tipo: 'concejal',
    bio: 'Dirigente política y militante comunitaria de La Libertad Avanza en Almirante Brown. Concejala electa con mandato hasta 2029, abocada al trabajo social, cercanía barrial y relevamiento de servicios públicos en Claypole, Longchamps y Malvinas Argentinas.'
  },
  {
    id: 'ariel-vieyra',
    nombre: 'Ariel Vieyra',
    rol: 'Concejal',
    localidad: 'Almirante Brown',
    foto: '/img/foto5.jpeg',
    tipo: 'concejal',
    bio: 'Coordinador de Relaciones Institucionales y dirigente territorial de La Libertad Avanza en Almirante Brown. Concejal electo (mandato hasta 2029), enfocado en la articulación legislativa distrital y el armado de mesas de trabajo vecinal.'
  },
  {
    id: 'natalia-german',
    nombre: 'Natalia German',
    rol: 'Concejal',
    localidad: 'Almirante Brown',
    foto: '/img/foto6.jpeg',
    tipo: 'concejal',
    bio: 'Abogada y concejala de La Libertad Avanza (asumida en 2023). Ejerce la docencia y capacitación ciudadana sobre instituciones municipales, con labor legislativa centrada en fiscalización de servicios públicos, legalidad de tasas y corredores seguros.'
  },
  {
    id: 'ivan-ibanez',
    nombre: 'Ivan Ibañez',
    rol: 'Concejal',
    localidad: 'Almirante Brown',
    foto: '/img/foto7.jpeg',
    estilo: 'object-position: center 15%;',
    tipo: 'concejal',
    bio: 'Docente, músico y dirigente territorial de La Libertad Avanza. Concejal electo (mandato hasta 2029) con trayectoria en formación cultural y educación barrial en zonas periféricas del distrito, enfocado en contención comunitaria y juventud.'
  },
  {
    id: 'miriam-locher',
    nombre: 'Miriam Locher',
    rol: 'Concejal',
    localidad: 'Adrogué / Almirante Brown',
    foto: '/img/foto8.jpg',
    tipo: 'concejal',
    bio: 'Abogada y concejala de La Libertad Avanza con extensa trayectoria legislativa en Almirante Brown (mandato 2007–2011 y 2025–2029). Especializada en derecho y control de gestión, auditoría de fondos de seguridad y transparencia institucional.'
  }
];

export const CONSEJEROS: MiembroEquipo[] = [
  {
    id: 'jorge-gangi',
    nombre: 'Jorge Gangi',
    rol: 'Consejero Escolar · Vicepresidente',
    localidad: 'Almirante Brown',
    foto: '/img/foto9.jpeg',
    tipo: 'consejero',
    bio: 'Vicepresidente del Consejo Escolar de Almirante Brown y referente educativo de La Libertad Avanza. A cargo de la supervisión administrativa, mantenimiento edilicio y funcionamiento de los establecimientos educativos del partido.'
  },
  {
    id: 'yanina-niczyporuk',
    nombre: 'Yanina Niczyporuk',
    rol: 'Consejera Escolar',
    localidad: 'Almirante Brown',
    foto: '/img/foto10.jpeg',
    tipo: 'consejero',
    bio: 'Consejera escolar de La Libertad Avanza (asumida en 2023), técnica abocada a la inspección edilicia, condiciones de seguridad en establecimientos escolares y fiscalización de partidas de infraestructura provincial.'
  },
  {
    id: 'silvina-barreiro',
    nombre: 'Silvina Barreiro',
    rol: 'Consejera Escolar',
    localidad: 'Almirante Brown',
    foto: '/img/foto11.jpeg',
    estilo: 'object-position: center top;',
    tipo: 'consejero',
    bio: 'Consejera escolar electa de La Libertad Avanza. Trabaja en la articulación comunitaria, seguimiento del estado de las escuelas públicas del distrito y participación en plenarios de debate educativo de LLA.'
  },
  {
    id: 'juan-jose-cardenas',
    nombre: 'Juan Jose Cardenas',
    rol: 'Consejero Escolar',
    localidad: 'Almirante Brown',
    foto: '/img/foto12.jpeg',
    tipo: 'consejero',
    bio: 'Consejero escolar electo de La Libertad Avanza. Dedicado al relevamiento de servicios escolares, supervisión de comedores (SAE) y fiscalización de partidas provinciales en establecimientos de Brown.'
  }
];

export const PROYECTOS_INICIALES: ProyectoHCD[] = [
  {
    id: 'p-1',
    titulo: 'Eliminación y Reducción del 50% en Tasas de Habilitación Comercial',
    expediente: 'HCD-EXP-0142/2025',
    fecha: '18/03/2025',
    autor: 'Juan Pedro Aquino y Bloque LLA',
    localidad: 'Burzaco / Adrogué',
    categoria: 'Baja de Tasas',
    estado: 'En Comisión',
    resumen: 'Proyecto de ordenanza para eliminar el cobro de derechos de habilitación a nuevos comercios y reducir drásticamente tasas abusivas que asfixian a los emprendedores brownianos.',
    destacado: true
  },
  {
    id: 'p-2',
    titulo: 'Creación del Sistema de Seguridad y Alertas Barriales en Tiempo Real',
    expediente: 'HCD-EXP-0189/2025',
    fecha: '25/04/2025',
    autor: 'Ezequiel Barreiro y Juan Pedro Aquino',
    localidad: 'Glew / Longchamps',
    categoria: 'Seguridad',
    estado: 'Presentado',
    resumen: 'Instalación de cámaras de lectura de patentes, corredores seguros escolares y botón antipánico digital integrado sin costo para los vecinos.',
    destacado: true
  },
  {
    id: 'p-3',
    titulo: 'Auditoría Integral y Publicación Online del Fondo Educativo Municipal',
    expediente: 'HCD-EXP-0210/2025',
    fecha: '12/05/2025',
    autor: 'Jorge Gangi y Bloque LLA',
    localidad: 'Claypole / Don Orione',
    categoria: 'Educación',
    estado: 'En Tratamiento',
    resumen: 'Exigencia de rendición de cuentas pública, mensual y descargable sobre cada peso recibido del Fondo de Financiamiento Educativo en escuelas del distrito.',
    destacado: false
  },
  {
    id: 'p-4',
    titulo: 'Ventanilla Única Digital y Desregulación de Trámites Municipales',
    expediente: 'HCD-EXP-0275/2025',
    fecha: '02/06/2025',
    autor: 'Florencia Colman y Ariel Vieyra',
    localidad: 'Almirante Brown',
    categoria: 'Desregulación',
    estado: 'En Comisión',
    resumen: 'Digitalización 100% de trámites vecinales y comerciales con silencio administrativo positivo para terminar con la discrecionalidad y las demoras burocráticas.',
    destacado: true
  },
  {
    id: 'p-5',
    titulo: 'Plan de Asfalto Prioritario y Desagües Pluviales en Barrios del Este',
    expediente: 'HCD-EXP-0311/2025',
    fecha: '15/07/2025',
    autor: 'Diego Garrido e Ivan Ibañez',
    localidad: 'Solano / Malvinas Argentinas',
    categoria: 'Infraestructura',
    estado: 'Presentado',
    resumen: 'Plan de obras públicas esenciales con foco en conectividad de ambulancias y patrulleros en zonas postergadas de Solano, San José y Malvinas.',
    destacado: false
  },
  {
    id: 'p-6',
    titulo: 'Optimización de Guardias y Abastecimiento de Insumos en CAPS Barriales',
    expediente: 'HCD-EXP-0380/2025',
    fecha: '29/08/2025',
    autor: 'Natalia German y Miriam Locher',
    localidad: 'Rafael Calzada / Mármol',
    categoria: 'Salud',
    estado: 'Presentado',
    resumen: 'Readecuación presupuestaria para garantizar médicos de guardia pediatría y clínica las 24 horas y botiquín completo en centros de atención primaria.',
    destacado: false
  }
];

export const VISITAS_INICIALES: VisitaTerritorial[] = [
  {
    id: 'v-1',
    titulo: 'Mesa Territorial y Diálogo con Comerciantes del Centro de Burzaco',
    localidad: 'Burzaco',
    circuito: '0019',
    fecha: '05/09/2025',
    descripcion: 'Junto a los concejales del bloque recorrimos los comercios sobre calle Roca y Alsina, explicando nuestro proyecto de baja de tasas y escuchando problemáticas de seguridad e iluminación.',
    fotos: ['/img/PedroAquino.jpg.jpg', '/img/vecinos1.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Diego Garrido', 'Florencia Colman'],
    temasTratados: ['Tasas municipales abusivas', 'Seguridad nocturna', 'Estacionamiento medido']
  },
  {
    id: 'v-2',
    titulo: 'Encuentro con Vecinos y Familias en Plaza Belgrano y Barrios de Glew',
    localidad: 'Glew',
    circuito: '0022',
    fecha: '18/08/2025',
    descripcion: 'Escuchamos las preocupaciones históricas de los vecinos sobre estado de calles de tierra, zanjas sin drenaje y falta de frecuencias en colectivos locales.',
    fotos: ['/img/vecinos2.jpeg', '/img/foto13.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Ezequiel Barreiro'],
    temasTratados: ['Asfalto y zanjeo', 'Frecuencias de colectivos', 'Alarmas comunitarias']
  },
  {
    id: 'v-3',
    titulo: 'Recorrida en Rafael Calzada: Escucha Activa y Reclamos por Obras',
    localidad: 'Rafael Calzada',
    circuito: '0018',
    fecha: '02/08/2025',
    descripcion: 'Estuvimos conversando con frentistas y comerciantes en las inmediaciones del Arco de Calzada. La gente pide que los recursos municipales vuelvan realmente a los barrios.',
    fotos: ['/img/vecinos3.jpeg', '/img/foto14.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Ariel Vieyra', 'Ivan Ibañez'],
    temasTratados: ['Luminarias LED', 'Basurales a cielo abierto', 'Presupuesto participativo']
  },
  {
    id: 'v-4',
    titulo: 'Jornada Territorial en Complejos de Don Orione y Claypole',
    localidad: 'Don Orione',
    circuito: '0022A',
    fecha: '20/07/2025',
    descripcion: 'Gran reunión con vecinos autoconvocados y referentes comunitarios de Don Orione. Avanzamos en propuestas concretas para clubes y espacios verdes familiares.',
    fotos: ['/img/vecinos4.jpeg', '/img/foto16.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Miriam Locher', 'Jorge Gangi'],
    temasTratados: ['Espacios públicos seguros', 'Tarifas sociales para clubes', 'Limpieza comunitaria']
  },
  {
    id: 'v-5',
    titulo: 'Encuentro con Familias y Comerciantes de San Francisco Solano',
    localidad: 'Solano',
    circuito: '0022B',
    fecha: '08/07/2025',
    descripcion: 'Acompañamos a los comerciantes y vecinos de Solano. Les acercamos las herramientas legislativas que estamos impulsando para frenar inspecciones abusivas.',
    fotos: ['/img/vecinos5.jpeg', '/img/foto17.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Diego Garrido'],
    temasTratados: ['Burocracia municipal', 'Seguridad en paradas de colectivos', 'Habilitaciones exprés']
  },
  {
    id: 'v-6',
    titulo: 'Reunión en Adrogué: Planificación Legislativa y Red Territorial Brown',
    localidad: 'Adrogué',
    circuito: '0017',
    fecha: '24/06/2025',
    descripcion: 'Equipo completo reunido para definir el cronograma de visitas a las 12 localidades y consolidar la agenda parlamentaria de libertad económica en Almirante Brown.',
    fotos: ['/img/vecinos6.jpeg', '/img/foto18.jpeg'],
    concejales: ['Juan Pedro Aquino', 'Diego Garrido', 'Ezequiel Barreiro', 'Florencia Colman', 'Ariel Vieyra', 'Natalia German', 'Ivan Ibañez', 'Miriam Locher'],
    temasTratados: ['Coordinación de bloque', 'Fiscalización permanente', 'Agenda legislativa 2025']
  }
];

export const CAROUSEL_GALLERY = [
  { img: '/img/PedroAquino.jpg.jpg', caption: 'Juan Pedro Aquino en el territorio de Almirante Brown' },
  { img: '/img/a1.JPG', caption: 'Reunión con vecinos y equipo de Almirante Brown' },
  { img: '/img/a5.JPG', caption: 'Compromiso y escucha activa en cada barrio' },
  { img: '/img/a6.jpg', caption: 'Concejales de La Libertad Avanza trabajando en el HCD' },
  { img: '/img/a7.jpg', caption: 'Territorio: cara a cara con la comunidad' },
  { img: '/img/a8.jpg', caption: 'Sumando voluntades en Almirante Brown' },
  { img: '/img/a10.jpg', caption: 'Jornada participativa #TuVozConstruye' },
  { img: '/img/vecinos2.jpeg', caption: 'Recorriendo los barrios de Brown' },
  { img: '/img/vecinos3.jpeg', caption: 'Escuchando a los comerciantes' },
  { img: '/img/vecinos4.jpeg', caption: 'Encuentro barrial con familias' },
  { img: '/img/vecinos5.jpeg', caption: 'Trabajando junto a los vecinos' },
  { img: '/img/vecinos6.jpeg', caption: 'Presencia constante en el distrito' },
  { img: '/img/vecinos7.jpeg', caption: 'El cambio se construye desde la base' },
  { img: '/img/vecinos8.jpeg', caption: 'Reuniones de coordinación territorial' }
];

export const PINES_INICIALES: import('../types').PinTerritorial[] = [
  {
    id: 'pin-1',
    titulo: 'Pedido de Pavimentación y Desagüe Pluvial en Calle Salta',
    calle: 'Calle Salta y Bynnon, San José',
    localidad: 'San José',
    barrio: 'San José',
    lat: -34.7745,
    lng: -58.3520,
    categoria: 'Arreglo de Calles / Asfalto',
    estado: 'Proyecto Presentado en HCD',
    descripcion: 'Los vecinos llevan años reclamando el asfalto y zanjeo de esta arteria clave que se anega con cada lluvia, impidiendo el paso de ambulancias.',
    concejal: 'Juan Pedro Aquino',
    fotos: ['/img/vecinos1.jpeg'],
    pdfUrl: '/uploads/proyecto-asfalto-salta.pdf',
    pdfNombre: 'Proyecto-HCD-Asfalto-Salta-SanJose.pdf',
    fecha: '14/09/2025',
    apoyosVecinales: 84
  },
  {
    id: 'pin-2',
    titulo: 'Reparación de Cráteres y Bacheo Urgente en Avenida Amenedo',
    calle: 'Avenida Amenedo y Espora, Burzaco',
    localidad: 'Burzaco',
    barrio: 'Burzaco Centro',
    lat: -34.8210,
    lng: -58.3910,
    categoria: 'Arreglo de Calles / Asfalto',
    estado: 'En Gestión / Comisión',
    descripcion: 'Cráteres de gran profundidad que dañan los vehículos de los vecinos y comerciantes sobre uno de los principales accesos a Burzaco.',
    concejal: 'Diego Garrido',
    fotos: ['/img/vecinos2.jpeg'],
    fecha: '28/08/2025',
    apoyosVecinales: 120
  },
  {
    id: 'pin-3',
    titulo: 'Instalación de Luminarias LED y Puntos de Alarma Vecinal',
    calle: 'Avenida 2 de Abril y Alsina, Claypole',
    localidad: 'Claypole',
    barrio: 'Claypole Este',
    lat: -34.7985,
    lng: -58.3380,
    categoria: 'Seguridad / Luminarias',
    estado: 'Proyecto Presentado en HCD',
    descripcion: 'Zona oscura y peligrosa en inmediaciones de la estación y cruce peatonal. Presentamos minuta de comunicación exigiendo recambio a LED.',
    concejal: 'Ezequiel Barreiro',
    fotos: ['/img/vecinos3.jpeg'],
    pdfUrl: '/uploads/proyecto-seguridad-claypole.pdf',
    pdfNombre: 'Proyecto-HCD-Luminarias-Claypole.pdf',
    fecha: '05/08/2025',
    apoyosVecinales: 95
  },
  {
    id: 'pin-4',
    titulo: 'Pedido de Ensanche y Veredas Seguras en Calle Almafuerte',
    calle: 'Calle Almafuerte y Newbery, Glew',
    localidad: 'Glew',
    barrio: 'Las Calandrias',
    lat: -34.8872,
    lng: -58.3842,
    categoria: 'Arreglo de Calles / Asfalto',
    estado: 'Reclamo Vecinal Recibido',
    descripcion: 'Calle sin veredas transitada diariamente por cientos de chicos camino a la escuela. Solicitamos cordón cuneta y veredas de hormigón peatonales.',
    concejal: 'Ariel Vieyra',
    fotos: ['/img/vecinos4.jpeg'],
    fecha: '19/07/2025',
    apoyosVecinales: 62
  },
  {
    id: 'pin-5',
    titulo: 'Erradicación de Microbasural a Cielo Abierto y Saneamiento',
    calle: 'Avenida Monteverde y Charcas, Malvinas Argentinas',
    localidad: 'Malvinas Argentinas',
    barrio: 'Barrio Lindo',
    lat: -34.7862,
    lng: -58.3490,
    categoria: 'Medio Ambiente / Basurales',
    estado: 'En Gestión / Comisión',
    descripcion: 'Acumulación constante de residuos que genera focos infecciosos para las familias del barrio. Pedimos contenedores y patrullaje ambiental.',
    concejal: 'Ivan Ibañez',
    fotos: ['/img/vecinos5.jpeg'],
    fecha: '02/07/2025',
    apoyosVecinales: 110
  },
  {
    id: 'pin-6',
    titulo: 'Guardia Médica 24hs y Refuerzo de Pediatría en CAPS',
    calle: 'Avenida San Martín y 130, Solano',
    localidad: 'Solano',
    barrio: 'San Francisco Solano',
    lat: -34.7812,
    lng: -58.3184,
    categoria: 'Salud / CAPS',
    estado: 'Proyecto Presentado en HCD',
    descripcion: 'Exigencia de dotación permanente de médicos pediatras y de guardia para evitar que los vecinos tengan que trasladarse hasta el Hospital Oñativia.',
    concejal: 'Florencia Colman',
    fotos: ['/img/vecinos6.jpeg'],
    pdfUrl: '/uploads/proyecto-salud-solano.pdf',
    pdfNombre: 'Proyecto-HCD-Salud-Solano.pdf',
    fecha: '15/06/2025',
    apoyosVecinales: 145
  }
];

