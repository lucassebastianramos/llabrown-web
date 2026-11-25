#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERADOR VORONOI - ORDENANZA 13.906
Crea barrios usando diagramas de Voronoi para distribución orgánica
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import math
from collections import defaultdict

try:
    from scipy.spatial import Voronoi as ScipyVoronoi
    from shapely.geometry import Point, Polygon, MultiPolygon, box
    from shapely.ops import unary_union
except ImportError:
    print("Instala: pip install scipy shapely")
    exit(1)

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Límites de Almirante Brown (bbox)
BBOX = {
    "min_lat": -34.90986784518467,
    "max_lat": -34.75428071637758,
    "min_lng": -58.447793760992305,
    "max_lng": -58.29239338925479
}

ALMIRANTE_BROWN = box(
    BBOX['min_lng'], BBOX['min_lat'],
    BBOX['max_lng'], BBOX['max_lat']
)

# Localidades con distribución de barrios
LOCALIDADES_BARRIOS = {
    "Adrogué": {
        "center": [-34.8033, -58.3846],
        "color": "#EF4444",
        "barrios": ["Barrio Vattuone", "Adrogué Centro"],
        "anexo": "I"
    },
    "Burzaco": {
        "center": [-34.8145, -58.3659],
        "color": "#F59E0B",
        "barrios": [
            "Corimayo", "Las Rosas", "Primera Junta", "Roca", "Don Alejandro",
            "Burzaco Centro", "La Carlota", "Sakura", "Luz y Fuerza",
            "Lomas de Burzaco", "El Gaucho", "El Hornero", "La Cumbre",
            "La Primavera", "La Pilarica", "La Lucy", "Almafuerte",
            "Ciudad Oculta", "San Pablo", "El Recuerdo", "Arzeno",
            "Parque Industrial", "Solis"
        ],
        "anexo": "II"
    },
    "Claypole": {
        "center": [-34.8456, -58.3532],
        "color": "#3B82F6",
        "barrios": [
            "Claypole Este", "El Trébol", "Horizonte", "La Jovita",
            "Mariano Moreno", "Medalla Milagrosa", "Barrio Parque", "Sáenz",
            "San Lucas", "San Luis", "Sideco", "Claypole Oeste", "Santa Clara",
            "El Triángulo", "Loma de Burzaco"
        ],
        "anexo": "III"
    },
    "Glew": {
        "center": [-34.7865, -58.3421],
        "color": "#10B981",
        "barrios": [
            "Gendarmería", "El Triunfo", "Kanmar", "600 Viviendas", "Santa Rosa",
            "Santa Ana", "Las Calandrias", "Villa París", "Ombú", "Ipona",
            "Los Aromos", "Telepostal", "UPCN", "El Castillo Las Heras",
            "Los Álamos", "COTEPA", "Parque Roma", "OUCRA", "Gorritti",
            "Progreso", "El Trébol Glew", "Glew Centro Oeste", "Glew Centro Este",
            "Almafuerte Glew", "SUPA", "COTEPA-PROGRESO"
        ],
        "anexo": "IV"
    },
    "José Mármol": {
        "center": [-34.8312, -58.3923],
        "color": "#EC4899",
        "barrios": ["Mármol Norte", "Mármol Centro", "Barrio Arca", "Martin Arin"],
        "anexo": "V"
    },
    "Longchamps": {
        "center": [-34.8576, -58.3287],
        "color": "#8B5CF6",
        "barrios": [
            "Altos de Longchamps", "Amancay", "Ampliación Santa Rita", "Amutum 1",
            "Amutum 2 Santa Rita", "Campo Ramos", "Casablanca", "Don Luis",
            "Doña Sol", "El Triángulo Longchamps", "Esperanza", "Ferroviario",
            "Jorge Newbery", "La Carmen", "Las Lilas", "Los Frutales", "Los Studs",
            "Barrio Municipal", "Rayo de Sol", "Sakura Lch", "Santa Adela",
            "Santa María", "Santa Rita", "Villa París Lch", "Viplastic",
            "Bicentenario", "14 de febrero", "Club Lomas"
        ],
        "anexo": "VI"
    },
    "Malvinas Argentinas": {
        "center": [-34.8412, -58.4012],
        "color": "#06B6D4",
        "barrios": [
            "La Lucy Malvinas", "El Encuentro", "Betharram", "Loma Verde",
            "Arzeno Malvinas", "Ona", "La Pilarica Malvinas", "San Miguel",
            "Policial", "Lindo 1 y 2", "Empleados de Comercio", "Canario"
        ],
        "anexo": "VII"
    },
    "Ministro Rivadavia": {
        "center": [-34.8267, -58.3156],
        "color": "#F97316",
        "barrios": [
            "Ibáñez", "San Juan de Corimayo", "La Matera", "Los Troncos",
            "Altos Del Castillo", "Del Carmen", "Madres", "Rivadavia Centro",
            "Policial Rivadavia", "Barrio Parque Rivadavia", "Tsuji", "Los Ciruelos",
            "Lujan", "Los Pinos", "Los Paraguayos", "La Arbolada", "La Hermosa"
        ],
        "anexo": "VIII"
    },
    "Rafael Calzada": {
        "center": [-34.8434, -58.3876],
        "color": "#84CC16",
        "barrios": [
            "Capilla Del Señor", "La Loma RC", "San Javier",
            "Villa Rafael Calzada", "2 de abril RC", "14 de noviembre",
            "San Jerónimo", "Asunción RC"
        ],
        "anexo": "IX"
    },
    "San Francisco de Asís": {
        "center": [-34.8523, -58.3643],
        "color": "#00D9FF",
        "barrios": [
            "Cerrito", "Don Orione", "La Esther", "Las Latitas", "Martin Fierro",
            "Suterh 2", "BI.PER.MU.", "Libertad SF", "6 de diciembre",
            "Don Orione Viejo", "Suterh 1", "Soom"
        ],
        "anexo": "X"
    },
    "San Francisco Solano": {
        "center": [-34.8634, -58.3734],
        "color": "#FBBF24",
        "barrios": [
            "Guadalupe", "Las Lomas De San Francisco", "Las Tunas", "Los Chalets",
            "Parque Uno", "Parque Dos", "Complejo Habitacional SFS", "Nueva Pompeya",
            "San Agustin", "Santa Catalina", "Santa Isabel", "Villa Laura", "Zabala"
        ],
        "anexo": "XI"
    },
    "San José": {
        "center": [-34.8543, -58.3821],
        "color": "#A78BFA",
        "barrios": [
            "San Ramón", "La Gloria", "8 de noviembre", "8 de diciembre", "Garay",
            "Santa Maria SJ", "La Loma SJ", "La Victoria", "Puerto Argentino",
            "La Tablada", "La Cava", "Virgen De Luján Ombú", "Agustín Ramírez",
            "Altos De Santa Ana", "San José"
        ],
        "anexo": "XII"
    }
}

def generate_seeds_robust(localidad_config: Dict, num_barrios: int, seed_base: int = 0) -> List[Tuple[float, float, str]]:
    """Genera puntos de semilla más robustos distribuidos uniformemente"""
    center_lat, center_lng = localidad_config["center"]
    barrios = localidad_config["barrios"]
    
    # Radio dinámico basado en número de barrios
    radius = 0.015 + (num_barrios * 0.0015)
    
    seeds = []
    
    for idx, barrio_name in enumerate(barrios):
        # Distribución helicoidal/espiral para cobertura uniforme
        angle = (idx / max(1, num_barrios)) * 4 * math.pi
        r = radius * math.sqrt(idx / max(1, num_barrios))
        
        lat_offset = r * math.cos(angle)
        lng_offset = r * math.sin(angle)
        
        seed_lat = center_lat + lat_offset
        seed_lng = center_lng + lng_offset
        
        # Pequeñas variaciones pseudo-aleatorias
        hash_val = hash(f"{seed_base}_{idx}_{barrio_name}")
        seed_lat += (hash_val % 1000) / 200000 - 0.0025
        seed_lng += ((hash_val >> 10) % 1000) / 200000 - 0.0025
        
        seeds.append((seed_lng, seed_lat, barrio_name))
    
    return seeds

def create_robust_voronoi(all_seeds: List[Tuple[float, float, str]]) -> Tuple[Dict[int, List[Tuple[float, float]]], any]:
    """Crea regiones Voronoi con puntos dummy para limitarlas"""
    if len(all_seeds) < 3:
        return {}, None
    
    seed_points = [[s[0], s[1]] for s in all_seeds]
    
    # Puntos dummy fuera del bbox para limitar Voronoi
    margin = 0.15
    dummy_points = [
        [BBOX['min_lng'] - margin, BBOX['min_lat'] - margin],
        [BBOX['max_lng'] + margin, BBOX['min_lat'] - margin],
        [BBOX['min_lng'] - margin, BBOX['max_lat'] + margin],
        [BBOX['max_lng'] + margin, BBOX['max_lat'] + margin],
        [(BBOX['min_lng'] + BBOX['max_lng']) / 2, BBOX['min_lat'] - margin],
        [(BBOX['min_lng'] + BBOX['max_lng']) / 2, BBOX['max_lat'] + margin],
    ]
    
    all_points = seed_points + dummy_points
    
    try:
        vor = ScipyVoronoi(all_points)
    except Exception as e:
        print(f"Error Voronoi: {e}")
        return {}, None
    
    regions_dict = {}
    
    for seed_idx in range(len(all_seeds)):
        region_idx = vor.point_region[seed_idx]
        region = vor.regions[region_idx]
        
        if len(region) > 0 and -1 not in region:
            try:
                vertices = vor.vertices[region]
                regions_dict[seed_idx] = [(v[0], v[1]) for v in vertices]
            except:
                pass
    
    return regions_dict, vor

def polygon_from_voronoi(vertices: List[Tuple[float, float]]) -> Optional[Polygon]:
    """Convierte vértices Voronoi en Polygon válido"""
    if len(vertices) < 3:
        return None
    
    try:
        # Centroide
        center_lat = sum(v[1] for v in vertices) / len(vertices)
        center_lng = sum(v[0] for v in vertices) / len(vertices)
        
        # Ordenar por ángulo desde centroide
        def angle_key(v):
            return math.atan2(v[1] - center_lat, v[0] - center_lng)
        
        sorted_verts = sorted(vertices, key=angle_key)
        
        # Crear polígono
        poly = Polygon(sorted_verts)
        
        if not poly.is_valid:
            poly = poly.buffer(0)
        
        # Intersectar con Almirante Brown
        clipped = poly.intersection(ALMIRANTE_BROWN)
        
        if clipped.is_empty or clipped.area < 0.0001:
            return None
        
        # Si es MultiPolygon, coger el más grande
        geometries = clipped.geoms if hasattr(clipped, 'geoms') else [clipped]
        if geometries:
            clipped = max(geometries, key=lambda p: p.area if hasattr(p, 'area') else 0)
        
        if isinstance(clipped, Polygon) and clipped.area > 0:
            return clipped
            
        return None
    except Exception as e:
        return None

def fallback_rectangle(center_lat: float, center_lng: float) -> Polygon:
    """Crea rectángulo pequeño como fallback"""
    size = 0.008
    return box(center_lng - size, center_lat - size, center_lng + size, center_lat + size)

def main():
    print("=" * 80)
    print("★ GENERADOR VORONOI MEJORADO - ORDENANZA 13.906")
    print("Distribución orgánica robusta con fallbacks")
    print("=" * 80)
    print()
    
    all_seeds = []
    seed_to_barrio = {}
    current_seed_idx = 0
    
    # Generar todas las semillas
    for localidad_name, localidad_config in LOCALIDADES_BARRIOS.items():
        seeds = generate_seeds_robust(localidad_config, len(localidad_config["barrios"]), hash(localidad_name) % 1000)
        for seed_lng, seed_lat, barrio_name in seeds:
            all_seeds.append((seed_lng, seed_lat, barrio_name, localidad_name))
            seed_to_barrio[current_seed_idx] = (barrio_name, localidad_name)
            current_seed_idx += 1
    
    print(f"Total de semillas generadas: {len(all_seeds)}")
    print()
    
    # Generar Voronoi
    regions, vor = create_robust_voronoi([(s[0], s[1], s[2]) for s in all_seeds])
    
    features = []
    created_count = 0
    fallback_count = 0
    
    for seed_idx, (seed_lng, seed_lat, barrio_name, localidad_name) in enumerate(all_seeds):
        localidad_config = LOCALIDADES_BARRIOS[localidad_name]
        
        polygon = None
        poly_type = "voronoi"
        
        # Intentar Voronoi
        if seed_idx in regions:
            vertices = regions[seed_idx]
            polygon = polygon_from_voronoi(vertices)
        
        # Fallback a rectángulo
        if polygon is None:
            polygon = fallback_rectangle(seed_lat, seed_lng)
            poly_type = "fallback"
            fallback_count += 1
        
        if polygon and polygon.area > 0:
            # Convertir a GeoJSON
            if polygon.geom_type == 'Polygon':
                coords = [list(polygon.exterior.coords)]
            else:
                continue
            
            feature = {
                "type": "Feature",
                "id": barrio_name.lower().replace(" ", "_").replace("á", "a"),
                "properties": {
                    "nombre": barrio_name,
                    "localidad": localidad_name,
                    "anexo": f"ANEXO {localidad_config['anexo']}",
                    "color": localidad_config["color"],
                    "tipo": "Barrio",
                    "ordenanza": "13.906",
                    "metodo": f"Voronoi (con {fallback_count} fallbacks)",
                    "geometria": poly_type
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coords
                }
            }
            
            features.append(feature)
            created_count += 1
            
            if created_count % 30 == 0:
                print(f"  ✓ {created_count} barrios procesados...")
    
    print()
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "VORONOI - ORDENANZA 13.906",
        "bbox": [BBOX['min_lng'], BBOX['min_lat'], BBOX['max_lng'], BBOX['max_lat']],
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "metodo": "Diagrama de Voronoi (distribución orgánica)",
            "fallbacks_rectangles": fallback_count,
            "nota": f"{created_count} barrios exitosos con {fallback_count} rectángulos de fallback"
        },
        "features": features
    }
    
    # Guardar
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_completo.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print("=" * 80)
    print(f"✓ ARCHIVO GENERADO: {output_path.name}")
    print()
    print(f"★ RESUMEN VORONOI MEJORADO:")
    print(f"   • Total barrios: {len(features)} / 175 ✓")
    print(f"   • Voronoi exitosos: {len(features) - fallback_count}")
    print(f"   • Fallback rectangles: {fallback_count}")
    print()
    
    # Contar por localidad
    for localidad_name in sorted(LOCALIDADES_BARRIOS.keys()):
        count = len([f for f in features if f['properties']['localidad'] == localidad_name])
        expected = len(LOCALIDADES_BARRIOS[localidad_name]['barrios'])
        status = "✓" if count == expected else f"✗ ({count}/{expected})"
        print(f"   • {localidad_name:25s}: {count:2d}/{expected:2d} {status}")
    
    print()
    print("=" * 80)
    print("✓ ¡Mapa VORONOI listo!")
    print("↻ Refresca: http://localhost:5557/barrios")
    print("=" * 80)

if __name__ == "__main__":
    main()
