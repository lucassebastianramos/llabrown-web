-- ==========================================================
-- Inicialización de Base de Datos PostgreSQL · LLA Almirante Brown
-- ==========================================================

CREATE TABLE IF NOT EXISTS proyectos (
  id VARCHAR(64) PRIMARY KEY,
  titulo TEXT NOT NULL,
  expediente VARCHAR(64),
  archivo_pdf TEXT,
  archivo_nombre TEXT,
  fecha VARCHAR(32) NOT NULL,
  autor VARCHAR(128) NOT NULL,
  localidad VARCHAR(128) NOT NULL,
  categoria VARCHAR(64) NOT NULL,
  estado VARCHAR(64) NOT NULL,
  resumen TEXT NOT NULL,
  destacado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitas (
  id VARCHAR(64) PRIMARY KEY,
  titulo TEXT NOT NULL,
  localidad VARCHAR(128) NOT NULL,
  circuito VARCHAR(32),
  fecha VARCHAR(32) NOT NULL,
  descripcion TEXT NOT NULL,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  concejales TEXT[] NOT NULL DEFAULT '{}',
  temas_tratados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pines_territoriales (
  id VARCHAR(64) PRIMARY KEY,
  titulo TEXT NOT NULL,
  calle TEXT NOT NULL,
  localidad VARCHAR(128) NOT NULL,
  barrio VARCHAR(128),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  categoria VARCHAR(64) NOT NULL,
  estado VARCHAR(64) NOT NULL,
  descripcion TEXT NOT NULL,
  concejal VARCHAR(128) NOT NULL,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  pdf_nombre TEXT,
  fecha VARCHAR(32) NOT NULL,
  apoyos_vecinales INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reclamos_vecinales (
  id VARCHAR(64) PRIMARY KEY,
  codigo_seguimiento VARCHAR(64) NOT NULL UNIQUE,
  nombre_vecino VARCHAR(128) NOT NULL,
  apellido_vecino VARCHAR(128),
  dni_vecino VARCHAR(32),
  telefono_vecino VARCHAR(64) NOT NULL,
  localidad VARCHAR(128) NOT NULL,
  barrio VARCHAR(128),
  calle TEXT NOT NULL,
  altura VARCHAR(32),
  entre_calles TEXT,
  tipo_reclamo VARCHAR(128) NOT NULL,
  subtipo_reclamo VARCHAR(128),
  descripcion TEXT NOT NULL,
  norma_digesto TEXT,
  estado VARCHAR(64) NOT NULL DEFAULT 'Registrado en LLA',
  numero_reclamo_municipal VARCHAR(64),
  patrocinado_por VARCHAR(128) NOT NULL DEFAULT 'Juan Pedro Aquino · Jefe de Bloque Concejales LLA',
  fecha VARCHAR(32) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas en producción
CREATE INDEX IF NOT EXISTS idx_proyectos_localidad ON proyectos(localidad);
CREATE INDEX IF NOT EXISTS idx_proyectos_categoria ON proyectos(categoria);
CREATE INDEX IF NOT EXISTS idx_visitas_localidad ON visitas(localidad);
CREATE INDEX IF NOT EXISTS idx_pines_localidad ON pines_territoriales(localidad);
CREATE INDEX IF NOT EXISTS idx_pines_categoria ON pines_territoriales(categoria);
CREATE INDEX IF NOT EXISTS idx_reclamos_codigo ON reclamos_vecinales(codigo_seguimiento);

-- Semilla inicial de proyectos
INSERT INTO proyectos (id, titulo, expediente, fecha, autor, localidad, categoria, estado, resumen, destacado)
VALUES 
  ('p-1', 'Eliminación y Reducción del 50% en Tasas de Habilitación Comercial', 'HCD-EXP-0142/2025', '18/03/2025', 'Juan Pedro Aquino y Bloque LLA', 'Burzaco / Adrogué', 'Baja de Tasas', 'En Comisión', 'Proyecto de ordenanza para eliminar el cobro de derechos de habilitación a nuevos comercios y reducir drásticamente tasas abusivas que asfixian a los emprendedores brownianos.', true),
  ('p-2', 'Creación del Sistema de Seguridad y Alertas Barriales en Tiempo Real', 'HCD-EXP-0189/2025', '25/04/2025', 'Ezequiel Barreiro y Juan Pedro Aquino', 'Glew / Longchamps', 'Seguridad', 'Presentado', 'Instalación de cámaras de lectura de patentes, corredores seguros escolares y botón antipánico digital integrado sin costo para los vecinos.', true),
  ('p-3', 'Auditoría Integral y Publicación Online del Fondo Educativo Municipal', 'HCD-EXP-0210/2025', '12/05/2025', 'Jorge Gangi y Bloque LLA', 'Claypole / Don Orione', 'Educación', 'En Tratamiento', 'Exigencia de rendición de cuentas pública, mensual y descargable sobre cada peso recibido del Fondo de Financiamiento Educativo en escuelas del distrito.', false),
  ('p-4', 'Ventanilla Única Digital y Desregulación de Trámites Municipales', 'HCD-EXP-0275/2025', '02/06/2025', 'Florencia Colman y Ariel Vieyra', 'Almirante Brown', 'Desregulación', 'En Comisión', 'Digitalización 100% de trámites vecinales y comerciales con silencio administrativo positivo para terminar con la discrecionalidad y las demoras burocráticas.', true),
  ('p-5', 'Plan de Asfalto Prioritario y Desagües Pluviales en Barrios del Este', 'HCD-EXP-0311/2025', '15/07/2025', 'Diego Garrido e Ivan Ibañez', 'Solano / Malvinas Argentinas', 'Infraestructura', 'Presentado', 'Plan de obras públicas esenciales con foco en conectividad de ambulancias y patrulleros en zonas postergadas de Solano, San José y Malvinas.', false),
  ('p-6', 'Optimización de Guardias y Abastecimiento de Insumos en CAPS Barriales', 'HCD-EXP-0380/2025', '29/08/2025', 'Natalia German y Miriam Locher', 'Rafael Calzada / Mármol', 'Salud', 'Presentado', 'Readecuación presupuestaria para garantizar médicos de guardia pediatría y clínica las 24 horas y botiquín completo en centros de atención primaria.', false)
ON CONFLICT (id) DO NOTHING;

-- Semilla inicial de visitas territoriales
INSERT INTO visitas (id, titulo, localidad, circuito, fecha, descripcion, fotos, concejales, temas_tratados)
VALUES
  ('v-1', 'Mesa Territorial y Diálogo con Comerciantes del Centro de Burzaco', 'Burzaco', '0019', '05/09/2025', 'Junto a los concejales del bloque recorrimos los comercios sobre calle Roca y Alsina, explicando nuestro proyecto de baja de tasas y escuchando problemáticas de seguridad e iluminación.', ARRAY['/img/PedroAquino.jpg.jpg', '/img/vecinos1.jpeg'], ARRAY['Juan Pedro Aquino', 'Diego Garrido', 'Florencia Colman'], ARRAY['Tasas municipales abusivas', 'Seguridad nocturna', 'Estacionamiento medido']),
  ('v-2', 'Encuentro con Vecinos y Familias en Plaza Belgrano y Barrios de Glew', 'Glew', '0022', '18/08/2025', 'Escuchamos las preocupaciones históricas de los vecinos sobre estado de calles de tierra, zanjas sin drenaje y falta de frecuencias en colectivos locales.', ARRAY['/img/vecinos2.jpeg', '/img/foto13.jpeg'], ARRAY['Juan Pedro Aquino', 'Ezequiel Barreiro'], ARRAY['Asfalto y zanjeo', 'Frecuencias de colectivos', 'Alarmas comunitarias']),
  ('v-3', 'Recorrida en Rafael Calzada: Escucha Activa y Reclamos por Obras', 'Rafael Calzada', '0018', '02/08/2025', 'Estuvimos conversando con frentistas y comerciantes en las inmediaciones del Arco de Calzada. La gente pide que los recursos municipales vuelvan realmente a los barrios.', ARRAY['/img/vecinos3.jpeg', '/img/foto14.jpeg'], ARRAY['Juan Pedro Aquino', 'Ariel Vieyra', 'Ivan Ibañez'], ARRAY['Luminarias LED', 'Basurales a cielo abierto', 'Presupuesto participativo']),
  ('v-4', 'Jornada Territorial en Complejos de Don Orione y Claypole', 'Don Orione', '0022A', '20/07/2025', 'Gran reunión con vecinos autoconvocados y referentes comunitarios de Don Orione. Avanzamos en propuestas concretas para clubes y espacios verdes familiares.', ARRAY['/img/vecinos4.jpeg', '/img/foto16.jpeg'], ARRAY['Juan Pedro Aquino', 'Miriam Locher', 'Jorge Gangi'], ARRAY['Espacios públicos seguros', 'Tarifas sociales para clubes', 'Limpieza comunitaria']),
  ('v-5', 'Encuentro con Familias y Comerciantes de San Francisco Solano', 'Solano', '0022B', '08/07/2025', 'Acompañamos a los comerciantes y vecinos de Solano. Les acercamos las herramientas legislativas que estamos impulsando para frenar inspecciones abusivas.', ARRAY['/img/vecinos5.jpeg', '/img/foto17.jpeg'], ARRAY['Juan Pedro Aquino', 'Diego Garrido'], ARRAY['Burocracia municipal', 'Seguridad en paradas de colectivos', 'Habilitaciones exprés']),
  ('v-6', 'Reunión en Adrogué: Planificación Legislativa y Red Territorial Brown', 'Adrogué', '0017', '24/06/2025', 'Equipo completo reunido para coordinar el cronograma de recorridas en las 13 localidades y la agenda de ordenanzas en el Concejo Deliberante.', ARRAY['/img/vecinos6.jpeg', '/img/foto18.jpeg'], ARRAY['Juan Pedro Aquino', 'Diego Garrido', 'Ezequiel Barreiro', 'Florencia Colman', 'Ariel Vieyra', 'Natalia German', 'Ivan Ibañez', 'Miriam Locher'], ARRAY['Coordinación de bloque', 'Fiscalización permanente', 'Agenda legislativa 2025'])
ON CONFLICT (id) DO NOTHING;

-- Semilla inicial de pines territoriales
INSERT INTO pines_territoriales (id, titulo, calle, localidad, barrio, lat, lng, categoria, estado, descripcion, concejal, fotos, pdf_url, pdf_nombre, fecha, apoyos_vecinales)
VALUES
  ('pin-1', 'Pedido de Pavimentación y Desagüe Pluvial en Calle Salta', 'Calle Salta y Bynnon, San José', 'San José', 'San José', -34.7745, -58.3520, 'Arreglo de Calles / Asfalto', 'Proyecto Presentado en HCD', 'Los vecinos llevan años reclamando el asfalto y zanjeo de esta arteria clave que se anega con cada lluvia, impidiendo el paso de ambulancias.', 'Juan Pedro Aquino', ARRAY['/img/vecinos1.jpeg'], NULL, NULL, '14/09/2025', 84),
  ('pin-2', 'Reparación de Cráteres y Bacheo Urgente en Avenida Amenedo', 'Avenida Amenedo y Espora, Burzaco', 'Burzaco', 'Burzaco Centro', -34.8210, -58.3910, 'Arreglo de Calles / Asfalto', 'En Gestión / Comisión', 'Cráteres de gran profundidad que dañan los vehículos de los vecinos y comerciantes sobre uno de los principales accesos a Burzaco.', 'Diego Garrido', ARRAY['/img/vecinos2.jpeg'], NULL, NULL, '28/08/2025', 120),
  ('pin-3', 'Instalación de Luminarias LED y Puntos de Alarma Vecinal', 'Avenida 2 de Abril y Alsina, Claypole', 'Claypole', 'Claypole Este', -34.7985, -58.3380, 'Seguridad / Luminarias', 'Proyecto Presentado en HCD', 'Zona oscura y peligrosa en inmediaciones de la estación y cruce peatonal. Presentamos minuta de comunicación exigiendo reemplazo por luminarias LED.', 'Ezequiel Barreiro', ARRAY['/img/vecinos3.jpeg'], NULL, NULL, '05/08/2025', 95),
  ('pin-4', 'Pedido de Ensanche y Veredas Seguras en Calle Almafuerte', 'Calle Almafuerte y Newbery, Glew', 'Glew', 'Las Calandrias', -34.8872, -58.3842, 'Arreglo de Calles / Asfalto', 'Reclamo Vecinal Recibido', 'Calle sin veredas transitada diariamente por cientos de chicos camino a la escuela. Solicitamos cordón cuneta y veredas de hormigón peatonales.', 'Ariel Vieyra', ARRAY['/img/vecinos4.jpeg'], NULL, NULL, '19/07/2025', 62),
  ('pin-5', 'Erradicación de Microbasural a Cielo Abierto y Saneamiento', 'Avenida Monteverde y Charcas, Malvinas Argentinas', 'Malvinas Argentinas', 'Barrio Lindo', -34.7862, -58.3490, 'Medio Ambiente / Basurales', 'En Gestión / Comisión', 'Acumulación constante de residuos que genera focos infecciosos para las familias del barrio. Pedimos contenedores y patrullaje ambiental.', 'Ivan Ibañez', ARRAY['/img/vecinos5.jpeg'], NULL, NULL, '02/07/2025', 110),
  ('pin-6', 'Guardia Médica 24hs y Refuerzo de Pediatría en CAPS', 'Avenida San Martín y 130, Solano', 'Solano', 'San Francisco Solano', -34.7812, -58.3184, 'Salud / CAPS', 'Proyecto Presentado en HCD', 'Exigencia de dotación permanente de médicos pediatras y de guardia para evitar que los vecinos tengan que trasladarse hasta el Hospital Oñativia.', 'Florencia Colman', ARRAY['/img/vecinos6.jpeg'], NULL, NULL, '15/06/2025', 145)
ON CONFLICT (id) DO NOTHING;
