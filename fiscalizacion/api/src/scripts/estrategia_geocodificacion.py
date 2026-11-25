#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ESTRATEGIA GEOCODIFICACIÓN - ORDENANZA 13.906
Combina: Caché de calles conocidas + Fuzzy matching + Fallback rectangular
"""

import json
import sys
import re
import unicodedata
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================================
# DICCIONARIO DE CALLES CONOCIDAS EN ALMIRANTE BROWN
# ============================================================================
# Estos datos se pueden obtener de datos municipales o validar manualmente
CALLES_CONOCIDAS = {
    "Estrada": (-34.8150, -58.3750),
    "Arturo Illia": (-34.8165, -58.3718),
    "Perito Moreno": (-34.8180, -58.3700),
    "Esteban Echeverría": (-34.8200, -58.3680),
    "Videla": (-34.8220, -58.3650),
    "Roque Sáenz Peña": (-34.8240, -58.3620),
    "Espora": (-34.8150, -58.3850),
    "Perón": (-34.8165, -58.3900),
    "Alberdi": (-34.8180, -58.3920),
    "San Martín": (-34.8200, -58.3950),
    "Rivadavia": (-34.8220, -58.3980),
    "Mitre": (-34.8240, -58.4010),
    "Roca": (-34.8260, -58.3600),
    "Emilio Mitre": (-34.8280, -58.3570),
    "Azcuénaga": (-34.8300, -58.3540),
    "Lavalle": (-34.8320, -58.3510),
    "Sarmiento": (-34.8340, -58.3480),
    "Acha": (-34.8360, -58.3450),
    "Rawson": (-34.8380, -58.3420),
    "Primera Junta": (-34.8400, -58.3390),
}

LOCALIDADES_CENTROS = {
    "Adrogué": (-34.8033, -58.3846),
    "Burzaco": (-34.8145, -58.3659),
    "Claypole": (-34.8456, -58.3532),
    "Glew": (-34.7865, -58.3421),
    "José Mármol": (-34.8312, -58.3923),
    "Longchamps": (-34.8576, -58.3287),
    "Malvinas Argentinas": (-34.8412, -58.4012),
    "Ministro Rivadavia": (-34.8267, -58.3156),
    "Rafael Calzada": (-34.8434, -58.3876),
    "San Francisco Solano": (-34.8634, -58.3734),
    "San Francisco de Asís": (-34.8523, -58.3643),
    "San José": (-34.8543, -58.3821),
}

# ============================================================================
# UTILIDADES
# ============================================================================

def remove_accents(text: str) -> str:
    """Elimina acentos"""
    nfkd_form = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

def similarity(a: str, b: str) -> float:
    """Similitud entre strings (0-1)"""
    a = remove_accents(a.lower().strip())
    b = remove_accents(b.lower().strip())
    return SequenceMatcher(None, a, b).ratio()

def find_calle_coordinates(calle_buscada: str, threshold: float = 0.7) -> Optional[Tuple[float, float]]:
    """Busca coordenadas de una calle en el diccionario con fuzzy matching"""
    
    best_match = None
    best_score = 0
    
    for calle_conocida, coords in CALLES_CONOCIDAS.items():
        score = similarity(calle_buscada, calle_conocida)
        
        if score > best_score:
            best_score = score
            best_match = (calle_conocida, coords)
    
    if best_score >= threshold:
        calle_matched, coords = best_match
        confidence = f"{best_score*100:.1f}%"
        return coords, calle_matched, confidence
    
    return None

def interpolate_point(p1: Tuple[float, float], p2: Tuple[float, float], factor: float = 0.5) -> Tuple[float, float]:
    """Interpola punto entre dos coordenadas"""
    lat = p1[0] + (p2[0] - p1[0]) * factor
    lng = p1[1] + (p2[1] - p1[1]) * factor
    return (lat, lng)

def estimate_intersection(calle1: str, calle2: str) -> Optional[Tuple[float, float]]:
    """Estima coordenada de intersección entre dos calles"""
    
    result1 = find_calle_coordinates(calle1)
    result2 = find_calle_coordinates(calle2)
    
    if result1 and result2:
        coords1, match1, conf1 = result1
        coords2, match2, conf2 = result2
        
        # Punto medio entre ambas calles
        intersection = interpolate_point(coords1, coords2, 0.5)
        
        return intersection, match1, match2, conf1, conf2
    
    return None

# ============================================================================
# ANÁLISIS Y DIAGNÓSTICO
# ============================================================================

def main():
    print("=" * 80)
    print("★ ESTRATEGIA DE GEOCODIFICACIÓN - ORDENANZA 13.906")
    print("Fuzzy Matching + Diccionario Local")
    print("=" * 80)
    print()
    
    print("DICCIONARIO DE CALLES DISPONIBLES:")
    print()
    for i, calle in enumerate(sorted(CALLES_CONOCIDAS.keys()), 1):
        coords = CALLES_CONOCIDAS[calle]
        print(f"  {i:2d}. {calle:25s} ({coords[0]:8.4f}, {coords[1]:9.4f})")
    
    print()
    print("=" * 80)
    print(f"Total: {len(CALLES_CONOCIDAS)} calles en caché")
    print("=" * 80)
    print()
    
    # ========================================================================
    # TEST 1: Búsqueda fuzzy de calles
    # ========================================================================
    print("TEST 1: Búsqueda Fuzzy de Calles")
    print()
    
    test_calles = [
        "Estrada",
        "Arturo Ilia",  # Variante con error
        "Perito Moreno",
        "Esteban Echeverria",  # Sin acento
        "Videla",
        "San martin",  # Minúsculas
        "Roque Saenz Peña",  # Otro error
    ]
    
    for calle_buscada in test_calles:
        result = find_calle_coordinates(calle_buscada, threshold=0.65)
        
        if result:
            coords, matched, confidence = result
            print(f"  ✓ '{calle_buscada:25s}' → '{matched}' ({confidence} similar)")
            print(f"     Coords: ({coords[0]:.4f}, {coords[1]:.4f})")
        else:
            print(f"  ✗ '{calle_buscada:25s}' no encontrado (threshold: 65%)")
    
    print()
    print("=" * 80)
    print("TEST 2: Estimación de Intersecciones")
    print()
    
    test_intersections = [
        ("Estrada", "Arturo Illia"),
        ("Perito Moreno", "Videla"),
        ("Esteban Echeverría", "Roque Sáenz Peña"),
        ("Estrada", "San Martin"),  # Con variante
    ]
    
    for calle1, calle2 in test_intersections:
        result = estimate_intersection(calle1, calle2)
        
        if result:
            intersection, match1, match2, conf1, conf2 = result
            print(f"  ✓ Intersección: {calle1} y {calle2}")
            print(f"     Match: '{match1}' ({conf1}) ∩ '{match2}' ({conf2})")
            print(f"     Coords: ({intersection[0]:.4f}, {intersection[1]:.4f})")
        else:
            print(f"  ✗ Intersección no encontrada: {calle1} y {calle2}")
        print()
    
    print()
    print("=" * 80)
    print("RECOMENDACIONES PARA MEJORAR PRECISIÓN:")
    print("=" * 80)
    print()
    print("  1. EXPANDIR DICCIONARIO:")
    print("     - Obtener listado completo de calles de Almirante Brown")
    print("     - Validar manualmente en Google Maps cada calle")
    print("     - Guardar en JSON con coordenadas precisas")
    print()
    print("  2. MEJORAR MATCHING:")
    print("     - Permitir búsqueda de variantes (Avenida vs Av., etc)")
    print("     - Usar palabras clave: 'calle', 'avenida', 'pasaje'")
    print()
    print("  3. VALIDACIÓN MANUAL:")
    print("     - Para los 20-30 barrios principales de Ordenanza")
    print("     - Buscar en Google Maps: descripciones de límites")
    print("     - Guardar polígonos reales")
    print()
    print("  4. API EXTERNA (OPCIONAL):")
    print("     - OpenCage Geocoding API (más tolerante que Nominatim)")
    print("     - Google Maps API (más preciso pero requiere API key)")
    print()
    print("=" * 80)
    print()
    print("PRÓXIMO PASO: Validar en Google Maps e iterar diccionario")
    print()

if __name__ == "__main__":
    main()
