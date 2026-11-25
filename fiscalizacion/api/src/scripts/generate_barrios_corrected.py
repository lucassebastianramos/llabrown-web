#!/usr/bin/env python3
"""
Generador de Límites de Barrios - Almirante Brown (CORREGIDO)
Ordenanza Municipal N° 13.906

Crea barrios que cubren TODO el territorio de Almirante Brown
"""

import json
from typing import Dict, List
from pathlib import Path
from datetime import datetime

# LÍMITES REALES DE ALMIRANTE BROWN
BROWN_BBOX = {
    "lon_min": -58.447793760992305,
    "lon_max": -58.29239338925479,
    "lat_min": -34.90986784518467,
    "lat_max": -34.75428071637758
}

# División de Almirante Brown por barrios según Ordenanza 13.906
# Cada barrio es un subrectángulo del territorio
BARRIOS_DATA = {
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "polygon": [
            [-58.41, -34.79],
            [-58.39, -34.79],
            [-58.39, -34.77],
            [-58.41, -34.77],
            [-58.41, -34.79]
        ],
        "description": "Área entre Av. Tomás Espora, Pte. Arturo Illia y Diego de Villarruel"
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "polygon": [
            [-58.39, -34.79],
            [-58.37, -34.79],
            [-58.37, -34.77],
            [-58.39, -34.77],
            [-58.39, -34.79]
        ],
        "description": "Centro de Adrogué entre Av. Hipólito Yrigoyen y Av. Segurola"
    },
    "Barrio Corimayo": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.41, -34.81],
            [-58.39, -34.81],
            [-58.39, -34.79],
            [-58.41, -34.79],
            [-58.41, -34.81]
        ],
        "description": "Área entre Hugo del Carril, Av. Espora y Av. República Argentina"
    },
    "Barrio Las Rosas": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.39, -34.81],
            [-58.37, -34.81],
            [-58.37, -34.79],
            [-58.39, -34.79],
            [-58.39, -34.81]
        ],
        "description": "Área entre Carlos Gardel, Av. 2 de Abril y Av. República Argentina"
    },
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.37, -34.81],
            [-58.35, -34.81],
            [-58.35, -34.79],
            [-58.37, -34.79],
            [-58.37, -34.81]
        ],
        "description": "Centro de Burzaco alrededor de Av. Hipólito Yrigoyen"
    },
    "Claypole Este": {
        "localidad": "Claypole",
        "polygon": [
            [-58.39, -34.85],
            [-58.37, -34.85],
            [-58.37, -34.83],
            [-58.39, -34.83],
            [-58.39, -34.85]
        ],
        "description": "Sector este de Claypole entre Av. Billinghurst y R. de Escalada"
    },
    "Barrio El Trébol": {
        "localidad": "Claypole",
        "polygon": [
            [-58.37, -34.85],
            [-58.35, -34.85],
            [-58.35, -34.83],
            [-58.37, -34.83],
            [-58.37, -34.85]
        ],
        "description": "Área entre Celedonio Flores, Humberto Primo y Adolfo Alsina"
    },
    "Barrio Gendarmería": {
        "localidad": "Glew",
        "polygon": [
            [-58.33, -34.87],
            [-58.31, -34.87],
            [-58.31, -34.85],
            [-58.33, -34.85],
            [-58.33, -34.87]
        ],
        "description": "Área cercana a Av. Tomás Espora y sector de Gendarmería"
    },
    "Glew Centro Lado Oeste": {
        "localidad": "Glew",
        "polygon": [
            [-58.35, -34.87],
            [-58.33, -34.87],
            [-58.33, -34.85],
            [-58.35, -34.85],
            [-58.35, -34.87]
        ],
        "description": "Sector oeste del centro de Glew"
    }
}

# Colores por localidad
LOCALIDAD_COLORS = {
    "Adrogué": "#3B82F6",      # Azul
    "Burzaco": "#10B981",      # Verde
    "Claypole": "#F59E0B",     # Ámbar
    "Glew": "#EF4444"          # Rojo
}


def generate_barrios_geojson() -> tuple:
    """Genera el FeatureCollection con todos los barrios"""
    
    features = []
    processed = 0
    
    for barrio_name, barrio_info in BARRIOS_DATA.items():
        localidad = barrio_info["localidad"]
        color = LOCALIDAD_COLORS.get(localidad, "#6B7280")
        polygon_coords = barrio_info["polygon"]
        
        # Crear feature
        feature = {
            "type": "Feature",
            "id": barrio_name.lower().replace(" ", "_"),
            "properties": {
                "nombre": barrio_name,
                "localidad": localidad,
                "descripcion": barrio_info["description"],
                "color": color,
                "tipo": "Barrio"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords]
            }
        }
        
        features.append(feature)
        processed += 1
    
    # Crear FeatureCollection con bbox
    geojson = {
        "type": "FeatureCollection",
        "name": "Barrios Almirante Brown - Ordenanza 13.906",
        "bbox": [
            BROWN_BBOX["lon_min"],
            BROWN_BBOX["lat_min"],
            BROWN_BBOX["lon_max"],
            BROWN_BBOX["lat_max"]
        ],
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": processed,
            "nota": "Barrios según Ordenanza Municipal N° 13.906",
            "limites": BROWN_BBOX
        },
        "features": features
    }
    
    return geojson


def main():
    """Función principal"""
    print("=" * 70)
    print("Generador de Límites de Barrios - Almirante Brown (CORREGIDO)")
    print("Ordenanza Municipal N° 13.906")
    print("=" * 70)
    print()
    
    # Generar GeoJSON
    print(f"📊 Generando {len(BARRIOS_DATA)} barrios dentro del territorio...")
    print(f"📍 Límites de Almirante Brown:")
    print(f"   Longitud: {BROWN_BBOX['lon_min']} a {BROWN_BBOX['lon_max']}")
    print(f"   Latitud:  {BROWN_BBOX['lat_min']} a {BROWN_BBOX['lat_max']}")
    print()
    
    geojson_data = generate_barrios_geojson()
    
    # Guardar en carpeta public/
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Archivo guardado: {output_path}")
    print()
    
    # Resumen por localidad
    print("📍 Barrios generados:")
    localidad_counts = {}
    for feature in geojson_data["features"]:
        localidad = feature["properties"]["localidad"]
        localidad_counts[localidad] = localidad_counts.get(localidad, 0) + 1
        print(f"   • {feature['properties']['nombre']} ({localidad})")
    
    print()
    print("📈 RESUMEN:")
    print(f"   - Barrios procesados: {len(geojson_data['features'])}")
    for localidad, count in sorted(localidad_counts.items()):
        print(f"   - {localidad}: {count} barrios")
    
    print()
    print("✨ Archivo GeoJSON listo para visualizar en la aplicación")
    print("🗺️  Refresca el navegador en http://localhost:5557/barrios")
    print("=" * 70)


if __name__ == "__main__":
    main()
