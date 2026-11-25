#!/usr/bin/env python3
"""
Generador de Barrios desde Circuitos Electorales
Mapea los circuitos precisos a barrios según Ordenanza 13.906
"""

import json
from typing import Dict, List
from pathlib import Path
from datetime import datetime

# Mapeo de circuitos a barrios según Ordenanza 13.906
CIRCUITOS_A_BARRIOS = {
    # Adrogué (Circuitos 17, 18, 18A)
    "17": {
        "barrio": "Barrio Vattuone",
        "localidad": "Adrogué",
        "color": "#EF4444"  # Rojo
    },
    "18": {
        "barrio": "Adrogué Centro",
        "localidad": "Adrogué",
        "color": "#EF4444"
    },
    "18A": {
        "barrio": "Adrogué Centro",
        "localidad": "Adrogué",
        "color": "#EF4444"
    },
    
    # Burzaco (Circuitos 19, 20, 20A)
    "19": {
        "barrio": "Barrio Corimayo",
        "localidad": "Burzaco",
        "color": "#F59E0B"  # Naranja
    },
    "20": {
        "barrio": "Burzaco Centro",
        "localidad": "Burzaco",
        "color": "#F59E0B"
    },
    "20A": {
        "barrio": "Barrio Las Rosas",
        "localidad": "Burzaco",
        "color": "#F59E0B"
    },
    
    # Claypole (Circuitos 22A, 22B)
    "22A": {
        "barrio": "Claypole Este",
        "localidad": "Claypole",
        "color": "#3B82F6"  # Azul
    },
    "22B": {
        "barrio": "Barrio El Trébol",
        "localidad": "Claypole",
        "color": "#3B82F6"
    },
    
    # Glew (Circuitos 21, 21A, 22)
    "21": {
        "barrio": "Glew Centro Lado Oeste",
        "localidad": "Glew",
        "color": "#10B981"  # Verde
    },
    "21A": {
        "barrio": "Barrio Gendarmería",
        "localidad": "Glew",
        "color": "#10B981"
    },
    "22": {
        "barrio": "Barrio Gendarmería",
        "localidad": "Glew",
        "color": "#10B981"
    },
}

DESCRIPCIONES = {
    "Barrio Vattuone": "Área entre Av. Tomás Espora, Pte. Arturo Illia y Diego de Villarruel",
    "Adrogué Centro": "Centro histórico entre Av. Hipólito Yrigoyen y zona comercial",
    "Barrio Corimayo": "Zona entre Hugo del Carril y Av. Espora",
    "Barrio Las Rosas": "Zona entre Carlos Gardel y Av. 2 de Abril",
    "Burzaco Centro": "Centro de Burzaco alrededor de Av. Hipólito Yrigoyen",
    "Claypole Este": "Sector este de Claypole entre Av. Billinghurst y R. de Escalada",
    "Barrio El Trébol": "Zona entre Celedonio Flores y Adolfo Alsina",
    "Barrio Gendarmería": "Zona cercana a Av. Tomás Espora y sector de Gendarmería",
    "Glew Centro Lado Oeste": "Centro de Glew, sector oeste",
}


def load_circuitos(filepath: str) -> Dict:
    """Carga el GeoJSON de circuitos"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def merge_geometries(geometries: List) -> Dict:
    """
    Fusiona múltiples geometrías en una sola
    Para simplificar, si hay múltiples polígonos, los agrupa en una colección
    """
    if len(geometries) == 1:
        return geometries[0]
    
    # Si hay múltiples polígonos, crearemos un multi-polígono
    coordinates = [geom['coordinates'] for geom in geometries]
    return {
        "type": "MultiPolygon",
        "coordinates": coordinates
    }


def generate_barrios_from_circuitos(circuitos_filepath: str) -> Dict:
    """Genera barrios agrupando circuitos precisos"""
    
    # Cargar circuitos
    print("📂 Cargando circuitos electorales precisos...")
    circuitos_data = load_circuitos(circuitos_filepath)
    
    # Agrupar circuitos por barrio
    barrios_temp = {}
    for feature in circuitos_data['features']:
        circuito_code = str(feature['properties'].get('circuito', ''))
        
        if circuito_code not in CIRCUITOS_A_BARRIOS:
            print(f"⚠️  Circuito {circuito_code} no mapeado")
            continue
        
        mapping = CIRCUITOS_A_BARRIOS[circuito_code]
        barrio_name = mapping['barrio']
        
        if barrio_name not in barrios_temp:
            barrios_temp[barrio_name] = {
                'localidad': mapping['localidad'],
                'color': mapping['color'],
                'geometries': [],
                'circuitos': []
            }
        
        barrios_temp[barrio_name]['geometries'].append(feature['geometry'])
        barrios_temp[barrio_name]['circuitos'].append(circuito_code)
    
    # Crear features de barrios
    features = []
    for barrio_name, data in barrios_temp.items():
        # Fusionar geometrías
        merged_geom = merge_geometries(data['geometries'])
        
        feature = {
            "type": "Feature",
            "id": barrio_name.lower().replace(" ", "_").replace("á", "a"),
            "properties": {
                "nombre": barrio_name,
                "localidad": data['localidad'],
                "descripcion": DESCRIPCIONES.get(barrio_name, ""),
                "color": data['color'],
                "tipo": "Barrio",
                "ordenanza": "13.906",
                "circuitos": data['circuitos']
            },
            "geometry": merged_geom
        }
        features.append(feature)
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "Barrios Almirante Brown - Ordenanza 13.906",
        "bbox": circuitos_data.get('bbox', [
            -58.447793760992305,
            -34.90986784518467,
            -58.29239338925479,
            -34.75428071637758
        ]),
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "nota": "Barrios generados a partir de circuitos electorales precisos",
            "fuente": "Circuitos electorales + Ordenanza 13.906"
        },
        "features": features
    }
    
    return geojson


def main():
    """Función principal"""
    print("=" * 80)
    print("Generador de Barrios desde Circuitos Electorales Precisos")
    print("Ordenanza Municipal N° 13.906")
    print("=" * 80)
    print()
    
    # Rutas
    circuitos_path = Path(__file__).parent.parent.parent.parent / "api" / "data" / "circuitos_brown_precisos.clean.geojson"
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown.geojson"
    
    if not circuitos_path.exists():
        print(f"❌ Error: No se encontró {circuitos_path}")
        return
    
    print(f"📍 Circuitos: {circuitos_path}")
    print(f"📍 Salida: {output_path}")
    print()
    
    # Generar
    print("🔄 Generando barrios desde circuitos precisos...")
    geojson_data = generate_barrios_from_circuitos(str(circuitos_path))
    
    # Guardar
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Archivo guardado: {output_path}")
    print()
    
    # Resumen
    print("📈 RESUMEN:")
    print(f"   • Total de barrios: {geojson_data['properties']['total_barrios']}")
    
    localidad_counts = {}
    for feature in geojson_data['features']:
        localidad = feature['properties']['localidad']
        localidad_counts[localidad] = localidad_counts.get(localidad, 0) + 1
    
    for localidad in sorted(localidad_counts.keys()):
        count = localidad_counts[localidad]
        print(f"   • {localidad}: {count} barrios")
    
    print()
    print("📍 Barrios Generados:")
    for feature in sorted(geojson_data['features'], key=lambda f: f['properties']['localidad']):
        props = feature['properties']
        circuitos = ', '.join(props.get('circuitos', []))
        print(f"   • {props['nombre']} ({props['localidad']}) - Circuitos: {circuitos}")
    
    print()
    print("=" * 80)
    print("✨ ¡Barrios generados con COORDENADAS PRECISAS!")
    print("🗺️  Refresca http://localhost:5557/barrios")
    print("=" * 80)


if __name__ == "__main__":
    main()
