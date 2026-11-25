#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEOLOCALIZADOR OPENCAGE - ORDENANZA 13.906
Búsqueda precisa de calles e intersecciones con OpenCage API
"""

import json
import sys
import re
import time
import unicodedata
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from urllib.parse import quote

try:
    import requests
    from shapely.geometry import Polygon, box
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

# Límites de Almirante Brown
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

MUNICIPIO = "Almirante Brown"
PROVINCIA = "Buenos Aires"
PAIS = "Argentina"

# ============================================================================
# DEFINICIONES DE BARRIOS CON LÍMITES DE ORDENANZA
# ============================================================================

BARRIOS_ORDENANZA = {
    # ANEXO I: ADROGUÉ
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "anexo": "I",
        "limites": "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón; por Perón hasta Estrada",
        "color": "#EF4444"
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "anexo": "I",
        "limites": "Estrada y Espora; por Espora hasta Acha; por Acha hasta Perón; por Perón hasta Estrada",
        "color": "#EF4444"
    },
    # ANEXO II: BURZACO (muestra de 3)
    "Corimayo": {
        "localidad": "Burzaco",
        "anexo": "II",
        "limites": "Roque Sáenz Peña y Videla; por Videla hasta Primera Junta; por Primera Junta hasta Roque Sáenz Peña",
        "color": "#F59E0B"
    },
    "Las Rosas": {
        "localidad": "Burzaco",
        "anexo": "II",
        "limites": "Arturo Illia y Perito Moreno; por Moreno hasta Videla; por Videla hasta Illia",
        "color": "#F59E0B"
    },
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "anexo": "II",
        "limites": "Perito Moreno y Esteban Echeverría; por Echeverría hasta Roque Sáenz Peña; por Sáenz Peña hasta Moreno",
        "color": "#F59E0B"
    },
    # ANEXO III: CLAYPOLE
    "Claypole Este": {
        "localidad": "Claypole",
        "anexo": "III",
        "limites": "Roque Sáenz Peña y Primera Junta; por Primera Junta hasta Rawson; por Rawson hasta Roque Sáenz Peña",
        "color": "#3B82F6"
    },
}

# ============================================================================
# OPENCAGE GEOCODER
# ============================================================================

class OpenCageGeocoder:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.cache = {}
        self.request_count = 0
        self.rate_limit = 2500  # requests/day (plan gratuito)
    
    def geocode(self, query: str, country: str = "AR") -> Optional[Tuple[float, float]]:
        """Geocodifica una dirección con OpenCage"""
        
        cache_key = f"{query}_{country}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Validar límite de requests
            if self.request_count >= self.rate_limit:
                print(f"⚠️  Límite de requests alcanzado ({self.request_count}/{self.rate_limit})")
                return None
            
            # Construir query
            full_query = f"{query}, {MUNICIPIO}, {PROVINCIA}, {country}"
            
            params = {
                "q": full_query,
                "key": self.api_key,
                "countrycode": country,
                "limit": 1,
                "language": "es",  # Preferir español
                "pretty": 0
            }
            
            print(f"    🔍 OpenCage: '{query}'", end="", flush=True)
            
            response = self.session.get(OPENCAGE_BASE_URL, params=params, timeout=10)
            self.request_count += 1
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("results"):
                    result = data["results"][0]
                    lat = result["geometry"]["lat"]
                    lon = result["geometry"]["lng"]
                    confidence = result.get("confidence", 0)
                    
                    # Validar dentro de bbox
                    if (BBOX['min_lat'] <= lat <= BBOX['max_lat'] and
                        BBOX['min_lng'] <= lon <= BBOX['max_lng']):
                        
                        self.cache[cache_key] = (lat, lon)
                        formatted = result.get("formatted", "?")
                        print(f" ✓ ({lat:.4f}, {lon:.4f}) [conf: {confidence}]")
                        return (lat, lon)
                    else:
                        print(f" ✗ Fuera de bbox")
                        return None
                else:
                    print(f" ✗ No encontrado")
                    self.cache[cache_key] = None
                    return None
            else:
                print(f" ✗ Error HTTP {response.status_code}")
                return None
        
        except Exception as e:
            print(f" ✗ Error: {e}")
            return None
    
    def geocode_intersection(self, calle1: str, calle2: str) -> Optional[Tuple[float, float]]:
        """Geocodifica intersección (calle1 Y calle2)"""
        intersection = f"{calle1} y {calle2}"
        return self.geocode(intersection)
    
    def geocode_street_segment(self, calle_principal: str, entre_calle1: str, entre_calle2: str) -> Optional[Tuple[float, float]]:
        """Geocodifica punto medio entre dos calles de una calle principal"""
        
        # Obtener puntos de intersección
        p1 = self.geocode_intersection(calle_principal, entre_calle1)
        p2 = self.geocode_intersection(calle_principal, entre_calle2)
        
        if p1 and p2:
            # Punto intermedio
            lat_mid = (p1[0] + p2[0]) / 2
            lng_mid = (p1[1] + p2[1]) / 2
            return (lat_mid, lng_mid)
        
        return p1 or p2

def parse_limites(descripcion: str) -> List[Tuple[str, str]]:
    """Extrae puntos de vuelta (vértices) de descripción de límites"""
    
    # Divide por puntos clave: "por X hasta Y"
    # Ej: "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón"
    
    # Primero obtener la intersección inicial
    match_inicial = re.search(r'([A-Z][a-záéíóúñ]*(?:\s+[A-Z][a-záéíóúñ]*)*)\s+y\s+([A-Z][a-záéíóúñ]*(?:\s+[A-Z][a-záéíóúñ]*)*)', descripcion)
    
    intersecciones = []
    
    if match_inicial:
        calle1, calle2 = match_inicial.groups()
        intersecciones.append((calle1, calle2))
    
    # Luego buscar todas las transiciones "por X hasta Y"
    pattern = r'por\s+([A-Z][a-záéíóúñ]*(?:\s+[A-Z][a-záéíóúñ]*)*)\s+hasta\s+([A-Z][a-záéíóúñ]*(?:\s+[A-Z][a-záéíóúñ]*)*)'
    matches = re.findall(pattern, descripcion)
    
    # Convertir transiciones a intersecciones
    for from_calle, to_calle in matches:
        # Cada transición "por X hasta Y" significa intersección "X y Y"
        intersecciones.append((from_calle, to_calle))
    
    return list(set(intersecciones))  # Eliminar duplicados

def create_polygon_from_points(points: List[Tuple[float, float]]) -> Optional[Polygon]:
    """Crea polígono desde lista de puntos (intersecciones)"""
    
    if len(points) < 3:
        print(f"    ⚠️  Insuficientes puntos ({len(points)} < 3)")
        return None
    
    try:
        poly = Polygon(points)
        
        if not poly.is_valid:
            poly = poly.buffer(0)
        
        # Intersectar con Almirante Brown
        clipped = poly.intersection(ALMIRANTE_BROWN)
        
        if isinstance(clipped, Polygon) and clipped.area > 0:
            return clipped
        
        print(f"    ⚠️  Polígono vacío o inválido")
        return None
    
    except Exception as e:
        print(f"    ✗ Error creando polígono: {e}")
        return None

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 80)
    print("★ GEOLOCALIZADOR OPENCAGE - ORDENANZA 13.906")
    print("Búsqueda precisa con OpenCage API")
    print("=" * 80)
    print()
    
    geocoder = OpenCageGeocoder(OPENCAGE_API_KEY)
    
    # ========================================================================
    # FASE 1: Testar búsqueda de calles individuales
    # ========================================================================
    print("FASE 1: Búsqueda de Calles Principales")
    print("-" * 80)
    print()
    
    test_calles = [
        "Estrada",
        "Arturo Illia",
        "Perito Moreno",
        "Esteban Echeverría",
        "Videla",
        "Espora",
        "Perón",
        "Roque Sáenz Peña",
        "Primera Junta",
        "Acha",
    ]
    
    calle_coords = {}
    
    for calle in test_calles:
        coords = geocoder.geocode(calle)
        if coords:
            calle_coords[calle] = coords
        time.sleep(0.3)  # Small delay between requests
    
    print()
    print(f"✓ {len(calle_coords)}/{len(test_calles)} calles encontradas")
    print()
    
    # ========================================================================
    # FASE 2: Testar intersecciones
    # ========================================================================
    print("FASE 2: Búsqueda de Intersecciones")
    print("-" * 80)
    print()
    
    test_intersections = [
        ("Estrada", "Arturo Illia"),
        ("Arturo Illia", "Espora"),
        ("Perito Moreno", "Videla"),
        ("Esteban Echeverría", "Roque Sáenz Peña"),
        ("Estrada", "Espora"),
    ]
    
    intersection_coords = {}
    
    for calle1, calle2 in test_intersections:
        coords = geocoder.geocode_intersection(calle1, calle2)
        if coords:
            intersection_coords[f"{calle1} y {calle2}"] = coords
        time.sleep(0.3)
    
    print()
    print(f"✓ {len(intersection_coords)}/{len(test_intersections)} intersecciones encontradas")
    print()
    
    # ========================================================================
    # FASE 3: Procesar barrios completos
    # ========================================================================
    print("FASE 3: Procesamiento de Barrios")
    print("-" * 80)
    print()
    
    features = []
    
    for barrio_nombre, barrio_info in BARRIOS_ORDENANZA.items():
        print(f"📍 {barrio_nombre:25s} ({barrio_info['localidad']})")
        
        limites_text = barrio_info["limites"]
        
        # Extraer intersecciones
        intersecciones = parse_limites(limites_text)
        print(f"    Límites: {limites_text}")
        print(f"    Intersecciones encontradas: {len(intersecciones)}")
        
        # Geocodificar cada intersección
        puntos = []
        for calle1, calle2 in intersecciones:
            coords = geocoder.geocode_intersection(calle1, calle2)
            if coords:
                puntos.append(coords)
                print(f"      ✓ {calle1} y {calle2}: ({coords[0]:.4f}, {coords[1]:.4f})")
            else:
                print(f"      ✗ {calle1} y {calle2}")
            time.sleep(0.2)
        
        # Crear polígono
        if len(puntos) >= 3:
            polygon = create_polygon_from_points(puntos)
            
            if polygon:
                # Convertir a GeoJSON
                coords = [list(polygon.exterior.coords)]
                
                feature = {
                    "type": "Feature",
                    "id": barrio_nombre.lower().replace(" ", "_"),
                    "properties": {
                        "nombre": barrio_nombre,
                        "localidad": barrio_info["localidad"],
                        "anexo": f"ANEXO {barrio_info['anexo']}",
                        "color": barrio_info["color"],
                        "tipo": "Barrio",
                        "ordenanza": "13.906",
                        "metodo": "OpenCage Geocoding (preciso)",
                        "puntos_usados": len(puntos)
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": coords
                    }
                }
                
                features.append(feature)
                print(f"    ✓ Polígono creado con éxito")
        
        print()
    
    # ========================================================================
    # RESUMEN Y GUARDAR
    # ========================================================================
    print("=" * 80)
    print(f"RESUMEN:")
    print(f"  • Requests realizados: {geocoder.request_count}/{geocoder.rate_limit}")
    print(f"  • Barrios procesados: {len(features)}/{len(BARRIOS_ORDENANZA)}")
    print()
    
    if features:
        geojson = {
            "type": "FeatureCollection",
            "name": "BARRIOS OPENCAGE - ORDENANZA 13.906",
            "bbox": [BBOX['min_lng'], BBOX['min_lat'], BBOX['max_lng'], BBOX['max_lat']],
            "properties": {
                "generado": datetime.now().isoformat(),
                "municipio": "Almirante Brown",
                "provincia": "Buenos Aires",
                "pais": "Argentina",
                "total_barrios": len(features),
                "metodo": "OpenCage Geocoding API",
                "nota": f"{len(features)} barrios geolocalizados con precisión"
            },
            "features": features
        }
        
        output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_opencage.geojson"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Archivo guardado: {output_path.name}")
    
    print("=" * 80)

if __name__ == "__main__":
    main()
