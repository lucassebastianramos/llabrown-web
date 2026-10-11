const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'circuitos-electorales-pba', 'circuito-electorales-pba.geojson');
const outDir = path.join(__dirname, '..', 'public', 'data');
const outPath = path.join(outDir, 'almirante-brown-circuitos.json');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Reading source GeoJSON...');
const raw = fs.readFileSync(srcPath, 'utf8');
const geo = JSON.parse(raw);

const brownCircuitsMetadata = {
  '0017': {
    nombre: 'Adrogué - Circuito 17',
    localidadesPrincipales: ['Adrogué'],
    descripcion: 'Cabecera del partido de Almirante Brown. Zona céntrica, comercial y residencial.',
    referente: 'Equipo Territorial Adrogué',
    wa: 'https://wa.me/5491167218190',
    color: '#8b5cf6'
  },
  '0018': {
    nombre: 'José Mármol / Calzada Norte - Circuito 18',
    localidadesPrincipales: ['José Mármol', 'Rafael Calzada'],
    descripcion: 'Corredor residencial e histórico de José Mármol y Rafael Calzada.',
    referente: 'Equipo Territorial Mármol / Calzada',
    wa: 'https://wa.me/5491167218190',
    color: '#a855f7'
  },
  '0018A': {
    nombre: 'San José / Malvinas Argentinas - Circuito 18A',
    localidadesPrincipales: ['Malvinas Argentinas', 'San José'],
    descripcion: 'Zona densamente poblada con fuerte actividad barrial y comercial.',
    referente: 'Equipo Territorial Malvinas / San José',
    wa: 'https://wa.me/5491167218190',
    color: '#ec4899'
  },
  '0019': {
    nombre: 'Burzaco Centro - Circuito 19',
    localidadesPrincipales: ['Burzaco'],
    descripcion: 'Corazón geográfico y productivo. Sede de LLA Brown y centro neurálgico del distrito.',
    referente: 'Sede Central - Humberto Primo 990',
    wa: 'https://wa.me/5491171682115',
    color: '#f59e0b'
  },
  '0020': {
    nombre: 'Burzaco Sur / Rivadavia Norte - Circuito 20',
    localidadesPrincipales: ['Burzaco', 'Ministro Rivadavia'],
    descripcion: 'Área residencial e intermedia hacia el sur del distrito.',
    referente: 'Equipo Territorial Burzaco Sur',
    wa: 'https://wa.me/5491167218190',
    color: '#10b981'
  },
  '0020A': {
    nombre: 'Ministro Rivadavia - Circuito 20A',
    localidadesPrincipales: ['Ministro Rivadavia'],
    descripcion: 'La localidad más antigua del distrito, con zona rural y productiva frutihortícola.',
    referente: 'Equipo Territorial Rivadavia',
    wa: 'https://wa.me/5491167218190',
    color: '#06b6d4'
  },
  '0021': {
    nombre: 'Longchamps - Circuito 21',
    localidadesPrincipales: ['Longchamps'],
    descripcion: 'Importante centro urbano y comercial con gran actividad ciudadana.',
    referente: 'Equipo Territorial Longchamps',
    wa: 'https://wa.me/5491167218190',
    color: '#3b82f6'
  },
  '0021A': {
    nombre: 'Glew Este / San Roque - Circuito 21A',
    localidadesPrincipales: ['Glew', 'Longchamps Este'],
    descripcion: 'Zona de continuo crecimiento y barrios con demandas de infraestructura.',
    referente: 'Equipo Territorial Glew Este',
    wa: 'https://wa.me/5491167218190',
    color: '#6366f1'
  },
  '0022': {
    nombre: 'Glew Centro / Sur - Circuito 22',
    localidadesPrincipales: ['Glew'],
    descripcion: 'Límite sur de Almirante Brown. Zona comercial ferroviaria y barrios populares.',
    referente: 'Equipo Territorial Glew Centro',
    wa: 'https://wa.me/5491167218190',
    color: '#eab308'
  },
  '0022A': {
    nombre: 'Claypole / Don Orione / San Fco. de Asís - Circuito 22A',
    localidadesPrincipales: ['Claypole', 'Don Orione', 'San Francisco de Asís'],
    descripcion: 'Gran densidad poblacional, complejos habitacionales y clubes deportivos de gran arraigo.',
    referente: 'Equipo Territorial Claypole / Don Orione',
    wa: 'https://wa.me/5491167218190',
    color: '#f97316'
  },
  '0022B': {
    nombre: 'San Francisco Solano - Circuito 22B',
    localidadesPrincipales: ['Solano'],
    descripcion: 'Sector este del partido, corredor comercial y activa participación comunitaria.',
    referente: 'Equipo Territorial Solano',
    wa: 'https://wa.me/5491167218190',
    color: '#ef4444'
  }
};

const brownFeatures = geo.features.filter(f => 
  f.properties && 
  f.properties.departamen && 
  f.properties.departamen.toLowerCase().includes('brown')
);

console.log(`Filtered ${brownFeatures.length} Brown features.`);

const enrichedFeatures = brownFeatures.map(f => {
  const cNum = f.properties.circuito;
  const meta = brownCircuitsMetadata[cNum] || {};
  return {
    ...f,
    properties: {
      ...f.properties,
      ...meta,
      seccionElectoral: 'Tercera Sección Electoral (PBA)',
      municipio: 'Almirante Brown',
      circuitoCode: cNum
    }
  };
});

const output = {
  type: 'FeatureCollection',
  metadata: {
    title: 'Circuitos Electorales - Almirante Brown',
    fuente: 'Juzgado Federal con Competencia Electoral de PBA / CNE',
    seccion: '3ra Sección Electoral',
    distrito: 'Almirante Brown (028)',
    totalCircuitos: enrichedFeatures.length
  },
  features: enrichedFeatures
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Saved enriched GeoJSON to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
