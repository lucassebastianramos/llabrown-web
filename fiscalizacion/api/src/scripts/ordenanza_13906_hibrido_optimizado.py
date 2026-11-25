#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MÉTODO HÍBRIDO OPTIMIZADO - ORDENANZA 13.906
Rectangular + OpenCage para máxima precisión con fallback
"""

import json
import sys
import math
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

try:
    import requests
    from shapely.geometry import Point, Polygon, box, shape
except ImportError:
    print("Instala: pip install requests shapely")
    exit(1)

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

OPENCAGE_API_KEY = "c79b0067911a4855adcff309fb6eec19"
OPENCAGE_BASE_URL = "https://api.opencagedata.com/geocode/v1/json"

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

# ============================================================================
# DATOS VALIDADOS EN GOOGLE MAPS
# ============================================================================

BARRIOS_PRIORITARIOS = {
    # Estos 6 barrios se intentaran geocodificar con OpenCage
    # Fallback a rectangular si no funciona
    "Adrogué Centro": ("Adrogué", "#EF4444", "I"),
    "Barrio Vattuone": ("Adrogué", "#EF4444", "I"),
    "Burzaco Centro": ("Burzaco", "#F59E0B", "II"),
    "Claypole Este": ("Claypole", "#3B82F6", "III"),
    "Glew Centro Lado Oeste": ("Glew", "#10B981", "IV"),
    "José Mármol Centro": ("José Mármol", "#EC4899", "V"),
}

# ============================================================================
# LOCALIDADES CON DISTRIBUCIÓN
# ============================================================================

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

# ============================================================================
# UTILIDADES
# ============================================================================

def geocode_con_opencage(barrio: str, localidad: str) -> Optional[Tuple[float, float]]:
    """Intenta geocodificar usando OpenCage como punto del barrio"""
    try:
        query = f"{barrio}, {localidad}, Almirante Brown, Buenos Aires, Argentina"
        
        params = {
            "q": query,
            "key": OPENCAGE_API_KEY,
            "countrycode": "AR",
            "limit": 1,
            "language": "es",
            "pretty": 0
        }
        
        response = requests.get(OPENCAGE_BASE_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("results"):
                result = data["results"][0]
                lat = result["geometry"]["lat"]
                lon = result["geometry"]["lng"]
                confidence = result.get("confidence", 0)
                
                # Solo aceptar si tiene confianza >= 7
                if confidence >= 7 and (BBOX['min_lat'] <= lat <= BBOX['max_lat'] and
                                        BBOX['min_lng'] <= lon <= BBOX['max_lng']):
                    return (lat, lon)
        
        return None
    
    except Exception as e:
        return None

def crear_rectangulo_alrededor(centro_lat: float, centro_lng: float, barrio_idx: int, total_barrios: int) -> Polygon:
    """Crea rectángulo alrededor de un punto (método fallback)"""
    
    # Tamaño basado en cantidad de barrios en localidad
    size_base = 0.008
    adjustment = 0.002 * (1 - (barrio_idx / max(1, total_barrios)))
    size = size_base + adjustment
    
    return box(centro_lng - size, centro_lat - size, centro_lng + size, centro_lat + size)

def generar_rectangle_grid(localidad_config: Dict, num_barrios: int) -> List[Polygon]:
    """Genera grid de rectángulos para barrios aproximados"""
    
    center_lat, center_lng = localidad_config["center"]
    
    grid_size = max(2, int(math.sqrt(num_barrios)))
    cell_size = 0.025 / grid_size
    
    rectangles = []
    idx = 0
    
    for i in range(grid_size):
        for j in range(grid_size):
            if idx >= num_barrios:
                break
            
            min_lat = center_lat - (grid_size / 2 + 0.5) * cell_size + i * cell_size
            max_lat = min_lat + cell_size * 0.9
            
            min_lng = center_lng - (grid_size / 2 + 0.5) * cell_size + j * cell_size
            max_lng = min_lng + cell_size * 0.9
            
            rect = box(min_lng, min_lat, max_lng, max_lat)
            
            # Intersectar con Almirante Brown
            clipped = rect.intersection(ALMIRANTE_BROWN)
            if clipped.area > 0:
                rectangles.append(clipped)
            
            idx += 1
    
    return rectangles

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 80)
    print("★ MÉTODO HÍBRIDO OPTIMIZADO - ORDENANZA 13.906")
    print("Rectangular Grid + OpenCage para barrios prioritarios")
    print("=" * 80)
    print()
    
    features = []
    opencage_hits = 0
    rectangular_hits = 0
    
    # ========================================================================
    # FASE 1: Barrios prioritarios con OpenCage
    # ========================================================================
    print("FASE 1: Barrios Prioritarios (OpenCage)")
    print("-" * 80)
    print()
    
    for barrio_name, (localidad, color, anexo) in BARRIOS_PRIORITARIOS.items():
        print(f"  🔍 {barrio_name:30s}", end="", flush=True)
        
        coords = geocode_con_opencage(barrio_name, localidad)
        
        if coords:
            print(f" ✓ OpenCage: ({coords[0]:.4f}, {coords[1]:.4f})")
            
            # Crear pequeño rectángulo alrededor del punto OpenCage
            rect = crear_rectangulo_alrededor(coords[0], coords[1], 0, 1)
            size_factor = 1.5  # Rectángulo un poco más grandes
            poly_coords = rect.buffer(0.002 * size_factor)
            
            if isinstance(poly_coords, Polygon):
                coords_list = [list(poly_coords.exterior.coords)]
                
                feature = {
                    "type": "Feature",
                    "id": barrio_name.lower().replace(" ", "_"),
                    "properties": {
                        "nombre": barrio_name,
                        "localidad": localidad,
                        "anexo": f"ANEXO {anexo}",
                        "color": color,
                        "tipo": "Barrio",
                        "ordenanza": "13.906",
                        "metodo": "OpenCage Geocoding (Precisión alta)",
                        "geometria": "opencage"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": coords_list
                    }
                }
                
                features.append(feature)
                opencage_hits += 1
        else:
            print(f" ✗ Fallback a rectangular")
            localidad_config = LOCALIDADES_BARRIOS[localidad]
            
            # Crear rectángulo en posición del barrio
            rect = crear_rectangulo_alrededor(
                localidad_config["center"][0],
                localidad_config["center"][1],
                0, 1
            )
            
            coords_list = [list(rect.exterior.coords)]
            
            feature = {
                "type": "Feature",
                "id": barrio_name.lower().replace(" ", "_"),
                "properties": {
                    "nombre": barrio_name,
                    "localidad": localidad,
                    "anexo": f"ANEXO {anexo}",
                    "color": color,
                    "tipo": "Barrio",
                    "ordenanza": "13.906",
                    "metodo": "Rectangular (fallback)",
                    "geometria": "rectangular"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coords_list
                }
            }
            
            features.append(feature)
            rectangular_hits += 1
        
        time.sleep(0.3)
    
    print()
    
    # ========================================================================
    # FASE 2: Resto de barrios con método rectangular
    # ========================================================================
    print("FASE 2: Resto de Barrios (Rectangular Grid)")
    print("-" * 80)
    print()
    
    for localidad_name, localidad_config in LOCALIDADES_BARRIOS.items():
        barrios = localidad_config["barrios"]
        num_barrios = len(barrios)
        
        # Saltar si ya se procesó como prioritario
        barrios_sin_prioritarios = [b for b in barrios if b not in BARRIOS_PRIORITARIOS]
        
        if not barrios_sin_prioritarios:
            continue
        
        print(f"  📍 {localidad_name:25s} - {len(barrios_sin_prioritarios)} barrios")
        
        # Generar grid de rectángulos
        rectangles = generar_rectangle_grid(localidad_config, len(barrios_sin_prioritarios))
        
        for idx, barrio_name in enumerate(barrios_sin_prioritarios):
            if idx < len(rectangles):
                rect = rectangles[idx]
            else:
                rect = crear_rectangulo_alrededor(
                    localidad_config["center"][0],
                    localidad_config["center"][1],
                    idx, len(barrios_sin_prioritarios)
                )
            
            coords_list = [list(rect.exterior.coords)]
            
            feature = {
                "type": "Feature",
                "id": barrio_name.lower().replace(" ", "_"),
                "properties": {
                    "nombre": barrio_name,
                    "localidad": localidad_name,
                    "anexo": f"ANEXO {localidad_config['anexo']}",
                    "color": localidad_config["color"],
                    "tipo": "Barrio",
                    "ordenanza": "13.906",
                    "metodo": "Rectangular Grid",
                    "geometria": "rectangular"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coords_list
                }
            }
            
            features.append(feature)
            rectangular_hits += 1
    
    print()
    
    # ========================================================================
    # GUARDAR
    # ========================================================================
    print("=" * 80)
    print(f"✓ RESUMEN HÍBRIDO:")
    print(f"   • Total barrios: {len(features)}")
    print(f"   • OpenCage (preciso): {opencage_hits}")
    print(f"   • Rectangular grid: {rectangular_hits}")
    print()
    
    geojson = {
        "type": "FeatureCollection",
        "name": "HÍBRIDO OPTIMIZADO - ORDENANZA 13.906",
        "bbox": [BBOX['min_lng'], BBOX['min_lat'], BBOX['max_lng'], BBOX['max_lat']],
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "metodo": "Híbrido: OpenCage (6 prioritarios) + Rectangular grid (169 aproximados)",
            "nota": f"{opencage_hits} barrios con OpenCage, {rectangular_hits} con método rectangular"
        },
        "features": features
    }
    
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_completo.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Archivo guardado: {output_path.name}")
    print()
    print("=" * 80)
    print("✓ ¡Mapa híbrido generado!")
    print("↻ Refresca: http://localhost:5557/barrios")
    print("=" * 80)

if __name__ == "__main__":
    main()
