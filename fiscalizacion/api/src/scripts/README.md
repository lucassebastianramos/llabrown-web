# 📁 Scripts - Generador de Barrios GeoJSON

Esta carpeta contiene todos los scripts necesarios para generar, validar y visualizar el archivo `limites_barrios_brown.geojson` basado en la Ordenanza Municipal N° 13.906 de Almirante Brown.

## 📚 Archivos

### 🌟 Scripts principales

| Script | Descripción | Instrucción |
|--------|-------------|-------------|
| **generate_barrios_geojson.py** | Genera el archivo GeoJSON desde descripciones textuales | `python generate_barrios_geojson.py` |
| **validate_barrios_geojson.py** | Valida la estructura y contenido del GeoJSON | `python validate_barrios_geojson.py` |
| **visualize_barrios_map.py** | Crea un mapa interactivo con Folium | `python visualize_barrios_map.py` |

### 🔧 Scripts secundarios

| Script | Descripción |
|--------|-------------|
| **setup_barrios.py** | Instala todas las dependencias necesarias |
| **examples_usage.py** | Demuestra cómo usar el GeoJSON generado |
| **TEMPLATE_ANEXOS_V_XII.py** | Template para agregar más barrios |

### 📝 Otros archivos

| Archivo | Descripción |
|---------|-------------|
| **geocode_cache.json** | Cache de geocodificaciones (se genera automáticamente) |

---

## 🚀 Guía rápida

### 1. Instalar dependencias

**Opción A - Script automático:**
```bash
python setup_barrios.py
```

**Opción B - Manual:**
```bash
pip install geopy geojson folium
```

### 2. Generar GeoJSON

```bash
python generate_barrios_geojson.py
```

Esto crea: `limites_barrios_brown.geojson` en la **raíz del proyecto**

### 3. Validar resultado

```bash
python validate_barrios_geojson.py
```

### 4. Visualizar (opcional)

```bash
python visualize_barrios_map.py
```

Genera: `barrios_map.html` (abre en navegador)

### 5. Ver ejemplos

```bash
python examples_usage.py
```

---

## 🔍 Estructura de generate_barrios_geojson.py

```
1. Clase GeocodeCache
   ↓ Maneja el caché de geocodificaciones

2. Clase BarrioGeocoder
   ├─ geocode_intersection()      → Busca coordenadas de intersecciones
   ├─ parse_barrio_description()  → Extrae pares de calles
   ├─ generate_barrio_polygon()   → Crea polígono para cada barrio
   ├─ generate_geojson()          → Genera FeatureCollection
   └─ save_geojson()              → Guarda a archivo

3. Datos (Anexos I-IV)
   ├─ BARRIOS_ANEXO_I_ADROGUÉ
   ├─ BARRIOS_ANEXO_II_BURZACO
   ├─ BARRIOS_ANEXO_III_CLAYPOLE
   └─ BARRIOS_ANEXO_IV_GLEW

4. main()
   ↓ Ejecuta geocodificación y genera archivo
```

---

## 📊 Salida esperada

Cuando ejecutas `generate_barrios_geojson.py`:

```
======================================================================
Generador de Límites de Barrios - Almirante Brown
Ordenanza Municipal N° 13.906
======================================================================

📊 Procesando 10 barrios...
🗺️  Geocodificador: Nominatim (OpenStreetMap)
📍 Área de búsqueda: Almirante Brown, Buenos Aires, Argentina

🏘️  Procesando: Barrio Vattuone (Adrogué)
    Descripción: Juan Manuel Estrada y Pte. Arturo Illia; por Illia h...
    Pares encontrados: 5
  📍 Geocodificando: Juan Manuel Estrada y Pte. Arturo Illia, Almirante Brown, Buenos Aires, Argentina
     ✓ Encontrado en (-34.789045, -58.381234)
     ...

======================================================================
📈 RESUMEN:
   - Barrios procesados: 10/10
   - Features en GeoJSON: 10
✅ Archivo guardado: C:\...\limites_barrios_brown.geojson
✅ Sin errores de geocodificación
======================================================================
```

---

## 🎯 Casos de uso

### Usar datos en una ruta Express

```typescript
// api/src/routes/geo.ts
import fs from 'fs';
import path from 'path';

router.get('/geo/barrios', (req, res) => {
  const filepath = path.join(__dirname, '../../data/limites_barrios_brown.geojson');
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  res.json(data);
});
```

### Filtrar barrios en el frontend

```typescript
// src/pages/Map.tsx
const response = await fetch('/api/geo/barrios');
const geojson = await response.json();

const barrios = geojson.features.map(f => ({
  nombre: f.properties.nombre,
  localidad: f.properties.localidad,
  geometry: f.geometry
}));
```

### Mapear con Leaflet

```typescript
import L from 'leaflet';

const response = await fetch('/api/geo/barrios');
const geojson = await response.json();

L.geoJSON(geojson, {
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`${feature.properties.nombre} (${feature.properties.localidad})`);
  }
}).addTo(map);
```

---

## 🚨 Troubleshooting

### Error: "ModuleNotFoundError"

```bash
pip install geopy geojson folium
```

### Nominatim timeout

El script reintentar automáticamente. Si persiste:
- Aumenta `DELAY_BETWEEN_REQUESTS` en `generate_barrios_geojson.py`
- O ejecuta en horarios de menor carga

### Street not found

1. Verifica ortografía exacta en https://nominatim.openstreetmap.org/
2. Edita la descripción en `generate_barrios_geojson.py`
3. Ejecuta de nuevo

### Cache corrupto

Borra y regenera:
```bash
rm geocode_cache.json
python generate_barrios_geojson.py
```

---

## 📖 Agregar más barrios

### Opción 1: Editar generate_barrios_geojson.py

```python
BARRIOS_ANEXO_V_ISIDRO_CASANOVA = [
    BarrioDefinition(
        nombre="Mi Barrio",
        localidad="Isidro Casanova",
        descripcion="Calle A y Calle B; por B hasta Calle C; ..."
    ),
]

TODOS_LOS_BARRIOS = (
    # ... anexos anteriores ...
    BARRIOS_ANEXO_V_ISIDRO_CASANOVA,  # ← Agregar aquí
)
```

### Opción 2: Usar el template

1. Lee `TEMPLATE_ANEXOS_V_XII.py`
2. Copia el bloque del anexo que necesites
3. Completa con tus datos
4. Pégalo en `generate_barrios_geojson.py`

---

## 🔒 Información almacenada

- **GeoJSON**: `limites_barrios_brown.geojson`
  - Barrios con geometrías (polígonos)
  - Nombres y localidades
  - Descripciones originales

- **Cache**: `geocode_cache.json`
  - Intersecciones ya geocodificadas
  - Coordenadas (lat/lon)
  - **No compartir** entre máquinas (diferencias en OSM)

---

## 📞 Soporte

- 🌐 **Nominatim**: https://nominatim.org/
- 📍 **GeoJSON**: https://tools.ietf.org/html/rfc7946
- 🗺️ **Visualizar**: https://geojson.io/
- 📚 **Python geopy**: https://geopy.readthedocs.io/

---

## ✅ Checklist de uso

- [ ] Instalar dependencias (`pip install geopy geojson folium`)
- [ ] Ejecutar generador (`python generate_barrios_geojson.py`)
- [ ] Validar archivo (`python validate_barrios_geojson.py`)
- [ ] Visualizar en mapa (`python visualize_barrios_map.py`)
- [ ] Copiar a `api/data/` si lo vas a usar en API
- [ ] Integrar con rutas Express si es necesario

---

**Última actualización**: 2026-05-09  
**Versión**: 1.0  
**Compatibilidad**: Python 3.8+
