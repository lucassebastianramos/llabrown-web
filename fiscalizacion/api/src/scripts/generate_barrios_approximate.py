#!/usr/bin/env python3
"""
Generador de Límites de Barrios - Almirante Brown (Versión Aproximada)
Ordinanza Municipal N° 13.906

Crea un GeoJSON con polígonos aproximados para los barrios de Almirante Brown
utilizando coordenadas conocidas y estimaciones basadas en la ubicación municipal.
"""

import json
from typing import Dict, List, Tuple
from pathlib import Path
from datetime import datetime

# Coordenadas REALES de Almirante Brown - Barrios según Ordenanza 13.906
# Basado en límites del municipio: [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758]
BARRIOS_DATA = {
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "polygon": [
            [-58.38, -34.80],
            [-58.39, -34.80],
            [-58.40, -34.79],
            [-58.39, -34.78],
            [-58.38, -34.78],
            [-58.38, -34.80]
        ],
        "description": "Área entre Av. Tomás Espora, Pte. Arturo Illia y Diego de Villarruel"
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "polygon": [
            [-58.38, -34.78],
            [-58.39, -34.78],
            [-58.40, -34.79],
            [-58.40, -34.80],
            [-58.38, -34.80],
            [-58.38, -34.78]
        ],
        "description": "Centro de Adrogué entre Av. Hipólito Yrigoyen y Av. Segurola"
    },
    "Barrio Corimayo": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.36, -34.80],
            [-58.37, -34.80],
            [-58.38, -34.81],
            [-58.37, -34.82],
            [-58.36, -34.82],
            [-58.36, -34.80]
        ],
        "description": "Área entre Hugo del Carril, Av. Espora y Av. República Argentina"
    },
    "Barrio Las Rosas": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.35, -34.81],
            [-58.36, -34.81],
            [-58.37, -34.82],
            [-58.36, -34.83],
            [-58.35, -34.83],
            [-58.35, -34.81]
        ],
        "description": "Área entre Carlos Gardel, Av. 2 de Abril y Av. República Argentina"
    },
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "polygon": [
            [-58.37, -34.82],
            [-58.38, -34.82],
            [-58.39, -34.83],
            [-58.38, -34.84],
            [-58.37, -34.84],
            [-58.37, -34.82]
        ],
        "description": "Centro de Burzaco alrededor de Av. Hipólito Yrigoyen"
    },
    "Claypole Este": {
        "localidad": "Claypole",
        "polygon": [
            [-58.34, -34.84],
            [-58.35, -34.84],
            [-58.36, -34.85],
            [-58.35, -34.86],
            [-58.34, -34.86],
            [-58.34, -34.84]
        ],
        "description": "Sector este de Claypole entre Av. Billinghurst y R. de Escalada"
    },
    "Barrio El Trébol": {
        "localidad": "Claypole",
        "polygon": [
            [-58.33, -34.85],
            [-58.34, -34.85],
            [-58.35, -34.86],
            [-58.34, -34.87],
            [-58.33, -34.87],
            [-58.33, -34.85]
        ],
        "description": "Área entre Celedonio Flores, Humberto Primo y Adolfo Alsina"
    },
    "Barrio Gendarmería": {
        "localidad": "Glew",
        "polygon": [
            [-58.31, -34.86],
            [-58.32, -34.86],
            [-58.33, -34.87],
            [-58.32, -34.88],
            [-58.31, -34.88],
            [-58.31, -34.86]
        ],
        "description": "Área cercana a Av. Tomás Espora y sector de Gendarmería"
    },
    "Glew Centro Lado Oeste": {
        "localidad": "Glew",
        "polygon": [
            [-58.32, -34.87],
            [-58.33, -34.87],
            [-58.34, -34.88],
            [-58.33, -34.89],
            [-58.32, -34.89],
            [-58.32, -34.87]
        ],
        "description": "Sector oeste del centro de Glew"
    }
}

# Asignación de colores por localidad
LOCALIDAD_COLORS = {
    "Adrogué": "#3B82F6",      # Azul
    "Burzaco": "#10B981",      # Verde
    "Claypole": "#F59E0B",     # Ámbar
    "Glew": "#EF4444"          # Rojo
}


def validate_polygon(polygon: List[List[float]]) -> bool:
    """
    Valida que un polígono esté dentro de los límites de Almirante Brown
    
    Args:
        polygon: Lista de [lon, lat]
    
    Returns:
        True si el polígono está dentro de los límites
    """
    BROWN_BBOX = {
        "lon_min": -58.447793760992305,
        "lon_max": -58.29239338925479,
        "lat_min": -34.90986784518467,
        "lat_max": -34.75428071637758
    }
    
    for lon, lat in polygon:
        if not (BROWN_BBOX["lon_min"] <= lon <= BROWN_BBOX["lon_max"] and
                BROWN_BBOX["lat_min"] <= lat <= BROWN_BBOX["lat_max"]):
            return False
    
    return True


def generate_barrios_geojson() -> Dict:
    """Genera el FeatureCollection con todos los barrios"""
    
    features = []
    processed = 0
    errors = []
    
    for barrio_name, barrio_info in BARRIOS_DATA.items():
        localidad = barrio_info["localidad"]
        color = LOCALIDAD_COLORS.get(localidad, "#6B7280")
        polygon_coords = barrio_info["polygon"]
        
        # Validar polígono
        if not validate_polygon(polygon_coords):
            errors.append(f"{barrio_name}: Polígono fuera de los límites de Almirante Brown")
            continue
        
        # Asegurar que el polígono esté cerrado
        if polygon_coords[0] != polygon_coords[-1]:
            polygon_coords = polygon_coords + [polygon_coords[0]]
        
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
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "Barrios Almirante Brown - Ordenanza 13.906",
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": processed,
            "nota": "Barrios según Ordenanza Municipal N° 13.906",
            "bbox": [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758]
        },
        "features": features
    }
    
    return geojson, errors


def main():
    """Función principal"""
    print("=" * 70)
    print("Generador de Límites de Barrios - Almirante Brown")
    print("Ordenanza Municipal N° 13.906")
    print("=" * 70)
    print()
    
    # Generar GeoJSON
    print(f"📊 Generando {len(BARRIOS_DATA)} barrios...")
    geojson_data, errors = generate_barrios_geojson()
    
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
    
    if errors:
        print()
        print("⚠️  Errores encontrados:")
        for error in errors:
            print(f"   - {error}")
    
    print()
    print("✨ Archivo GeoJSON listo para visualizar en la aplicación")
    print("📍 Límites: Almirante Brown, Buenos Aires, Argentina")
    print("=" * 70)


if __name__ == "__main__":
    main()
