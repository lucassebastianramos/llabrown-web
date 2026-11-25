#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEOLOCALIZADOR PRECISO - ORDENANZA 13.906
Búsqueda fuzzy + Google Maps + Nominatim para máxima precisión
"""

import json
import sys
import re
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from urllib.parse import quote
import unicodedata

try:
    from geopy.geocoders import GoogleV3, Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
    from shapely.geometry import Point, Polygon, box
    from difflib import SequenceMatcher
    import requests
except ImportError:
    print("Instala: pip install geopy shapely requests")
    exit(1)

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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

# Municipio y provincia para búsquedas
MUNICIPIO = "Almirante Brown"
PROVINCIA = "Buenos Aires"
PAIS = "Argentina"

# ============================================================================
# UTILIDADES DE BÚSQUEDA FUZZY
# ============================================================================

def remove_accents(text: str) -> str:
    """Remove accents from string"""
    nfkd_form = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

def similarity(a: str, b: str) -> float:
    """Calcula similitud entre dos strings (0-1)"""
    a = remove_accents(a.lower())
    b = remove_accents(b.lower())
    return SequenceMatcher(None, a, b).ratio()

def parse_calle_variants(calle_name: str) -> List[str]:
    """Genera variantes de nombres de calles"""
    variants = [calle_name]
    
    # Sin acentos
    clean = remove_accents(calle_name)
    if clean != calle_name:
        variants.append(clean)
    
    # Abreviaciones comunes
    abbrev_map = {
        "Avenida": ["Av.", "Av"],
        "Calle": ["C.", "C"],
        "General": ["Gral.", "Gral"],
        "Coronel": ["Col.", "Col"],
        "Mayor": ["Tte.", "Tte"],
        "Teniente": ["Tte.", "Tte"],
    }
    
    for palabra, abbrevs in abbrev_map.items():
        if palabra in calle_name:
            for abbrev in abbrevs:
                variants.append(calle_name.replace(palabra, abbrev))
    
    # Invertir orden (ej: "Mitre Esteban" -> "Esteban Mitre")
    parts = calle_name.split()
    if len(parts) >= 2:
        variants.append(" ".join(reversed(parts)))
    
    return list(set(variants))

# ============================================================================
# GEOCODIFICADORES
# ============================================================================

class GeolocalizadorPreciso:
    def __init__(self):
        self.nominatim = Nominatim(user_agent="almirante_brown_geo", timeout=15)
        self.cached_results = {}
        self.request_delay = 2.5  # segundos entre requests (aumentado para Nominatim)
        self.last_request_time = 0
        self.rate_limited = False
    
    def delay_request(self):
        """Rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            wait_time = self.request_delay - elapsed
            # print(f"    ⏳ Esperando {wait_time:.1f}s (rate limit)...")
            time.sleep(wait_time)
        self.last_request_time = time.time()
    
    def geocode_nominatim(self, direccion: str, retry: int = 3) -> Optional[Tuple[float, float]]:
        """Geocodifica usando Nominatim con reintentos y rate limiting"""
        cache_key = f"nominatim_{direccion}"
        
        if cache_key in self.cached_results:
            return self.cached_results[cache_key]
        
        for intento in range(retry):
            try:
                self.delay_request()
                
                # Formato: "Calle, Almirante Brown, Buenos Aires, Argentina"
                query = f"{direccion}, {MUNICIPIO}, {PROVINCIA}, {PAIS}"
                
                result = self.nominatim.geocode(query, timeout=15)
                
                if result:
                    lat, lon = result.latitude, result.longitude
                    
                    # Validar dentro de bbox
                    if (BBOX['min_lat'] <= lat <= BBOX['max_lat'] and
                        BBOX['min_lng'] <= lon <= BBOX['max_lng']):
                        self.cached_results[cache_key] = (lat, lon)
                        return (lat, lon)
            
            except Exception as e:
                error_str = str(e).lower()
                
                # Si es rate limited, esperar más
                if "429" in str(e) or "rate" in error_str:
                    wait_time = 5 * (intento + 1)
                    print(f"    ⚠️  Rate-limited. Esperando {wait_time}s...")
                    time.sleep(wait_time)
                    self.request_delay = min(10, self.request_delay * 1.5)  # Aumentar delay
                    continue
                
                if "timeout" in error_str and intento < retry - 1:
                    print(f"    ⏳ Timeout reintentando {direccion}... ({intento+1}/{retry})")
                    time.sleep(3)
                    continue
        
        self.cached_results[cache_key] = None
        return None
    
    def geocode_intersection(self, calle1: str, calle2: str, retry: int = 2) -> Optional[Tuple[float, float]]:
        """Geocodifica intersección (calle1 Y calle2) con búsqueda selectiva"""
        # Intentar combinación principal primero
        intersection = f"{calle1} y {calle2}"
        result = self.geocode_nominatim(intersection, retry=1)
        if result:
            return result
        
        # Si falla, intentar variantes (pero limitadamente para no saturar)
        variants_c1 = parse_calle_variants(calle1)[:2]  # Solo 2 primeras
        variants_c2 = parse_calle_variants(calle2)[:2]  # Solo 2 primeras
        
        for v1 in variants_c1:
            for v2 in variants_c2:
                if v1 == calle1 and v2 == calle2:
                    continue  # Already tried
                intersection = f"{v1} y {v2}"
                result = self.geocode_nominatim(intersection, retry=1)
                if result:
                    return result
        
        return None
    
    def geocode_street_segment(self, calle: str, entre_calle1: str, entre_calle2: str) -> Optional[Tuple[float, float]]:
        """Geocodifica punto intermedio entre dos calles"""
        p1 = self.geocode_intersection(calle, entre_calle1)
        p2 = self.geocode_intersection(calle, entre_calle2)
        
        if p1 and p2:
            # Punto medio
            lat_mid = (p1[0] + p2[0]) / 2
            lng_mid = (p1[1] + p2[1]) / 2
            return (lat_mid, lng_mid)
        
        # Fallback: retornar una de las dos
        return p1 or p2
    
    def find_best_match_street(self, calle_buscada: str, top_n: int = 1) -> List[Tuple[str, float]]:
        """Busca calles con nombres similares usando fuzzy matching"""
        # Aquí se podría cargar un listado de calles conocidas de AB
        # Por ahora retorna la búsqueda original
        
        known_streets = [
            "Esteban Echeverría", "Perito Moreno", "Videla", "Arturo Illia",
            "Estrada", "Espora", "Perón", "Alberdi", "San Martín", "Rivadavia",
            "Mitre", "Roque Sáenz Peña", "Moreno", "Brown", "Quintana",
            "Azcuénaga", "Lavalle", "Sarmiento", "Emilio Mitre", "Acha",
        ]
        
        matches = []
        for street in known_streets:
            sim = similarity(calle_buscada, street)
            if sim > 0.6:  # Threshold: 60% similar
                matches.append((street, sim))
        
        # Ordenar por similitud
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[:top_n]

# ============================================================================
# PARSER DE ORDENANZA
# ============================================================================

BARRIOS_PRECISOS = {
    "Adrogué Centro": {
        "limites": "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón; por Perón hasta estrada",
        "localidad": "Adrogué",
        "anexo": "I"
    },
    "Corimayo": {
        "limites": "Roque Sáenz Peña y Videla; por Videla hasta Primera Junta; por Primera Junta hasta Roque Sáenz Peña",
        "localidad": "Burzaco",
        "anexo": "II"
    },
    "Luz y Fuerza": {
        "limites": "Arturo Illia y Emilio Mitre; por Illia hasta Azcuénaga; por Azcuénaga hasta Mitre",
        "localidad": "Burzaco",
        "anexo": "II"
    },
    # ... (agregar más barrios conforme se vayan validando)
}

def parse_limites(descripcion: str) -> List[Tuple[str, str]]:
    """Extrae intersecciones de descripción de límites"""
    # Patrón: "Calle1 y Calle2" o similar
    pattern = r'([A-Z][a-zá]*(?:\s+[A-Z][a-zá]*)*)\s+y\s+([A-Z][a-zá]*(?:\s+[A-Z][a-zá]*)*)'
    
    matches = re.findall(pattern, descripcion)
    return matches

# ============================================================================
# GENERADOR DE GEOMETRÍAS
# ============================================================================

def create_polygon_from_intersections(intersections: List[Tuple[float, float]]) -> Optional[Polygon]:
    """Crea polígono desde lista de coordenadas de intersecciones"""
    if len(intersections) < 3:
        return None
    
    try:
        poly = Polygon(intersections)
        
        if not poly.is_valid:
            poly = poly.buffer(0)
        
        # Intersectar con Almirante Brown
        clipped = poly.intersection(ALMIRANTE_BROWN)
        
        if isinstance(clipped, Polygon) and clipped.area > 0:
            return clipped
    except:
        pass
    
    return None

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 80)
    print("★ GEOLOCALIZADOR PRECISO - ORDENANZA 13.906")
    print("Búsqueda Fuzzy + Nominatim")
    print("=" * 80)
    print()
    
    geo = GeolocalizadorPreciso()
    
    print("FASE 1: Testeando búsquedas de calles...")
    print()
    
    # Calles conocidas para test (REDUCIDA para no saturar Nominatim)
    test_calles = [
        "Estrada",
        "Arturo Illia",
        "Perito Moreno",
        "Esteban Echeverría",
        "Videla",
    ]
    
    results = {}
    
    for calle in test_calles:
        print(f"  🔍 Buscando: {calle}")
        
        # Intentar geocodificación directa
        result = geo.geocode_nominatim(calle)
        
        if result:
            lat, lon = result
            print(f"    ✓ Encontrado: ({lat:.4f}, {lon:.4f})")
            results[calle] = result
        else:
            # Intentar variantes
            print(f"    ✗ No encontrado directamente. Intentando variantes...")
            found = False
            
            for variant in parse_calle_variants(calle):
                result = geo.geocode_nominatim(variant)
                if result:
                    print(f"    ✓ Encontrado con variante '{variant}': ({result[0]:.4f}, {result[1]:.4f})")
                    results[calle] = result
                    found = True
                    break
            
            if not found:
                print(f"    ✗ No se encontró con ninguna variante")
                
                # Buscar similares
                matches = geo.find_best_match_street(calle, top_n=3)
                if matches:
                    print(f"    💡 Sugerencias similares:")
                    for match, sim in matches:
                        print(f"       - {match} ({sim*100:.1f}% similar)")
    
    print()
    print("=" * 80)
    print(f"FASE 2: Resultados de búsqueda")
    print("=" * 80)
    print()
    print(f"Encontradas: {len(results)}/{len(test_calles)}")
    print()
    
    for calle, coords in results.items():
        print(f"  ✓ {calle:25s} → ({coords[0]:8.4f}, {coords[1]:9.4f})")
    
    print()
    print("=" * 80)
    print("FASE 3: Testeando intersecciones")
    print("=" * 80)
    print()
    
    test_intersections = [
        ("Estrada", "Arturo Illia"),
        ("Perito Moreno", "Videla"),
        ("Esteban Echeverría", "Roque Sáenz Peña"),
    ]
    
    intersection_results = {}
    
    for calle1, calle2 in test_intersections:
        print(f"  🔍 Buscando intersección: {calle1} y {calle2}")
        
        result = geo.geocode_intersection(calle1, calle2)
        
        if result:
            print(f"    ✓ Encontrado: ({result[0]:.4f}, {result[1]:.4f})")
            intersection_results[f"{calle1} y {calle2}"] = result
        else:
            print(f"    ✗ No encontrado")
    
    print()
    print("=" * 80)
    print(f"SUMMARY:")
    print(f"  ✓ Calles encontradas: {len(results)}")
    print(f"  ✓ Intersecciones encontradas: {len(intersection_results)}")
    print("=" * 80)
    print()
    print("Próximos pasos:")
    print("  1. Validar precisión de coordenadas en Google Maps")
    print("  2. Agregar más barrios con límites precisos")
    print("  3. Generar polígonos desde intersecciones geolocalizadas")
    print()

if __name__ == "__main__":
    main()
