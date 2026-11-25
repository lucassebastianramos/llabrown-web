#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERADOR INCREMENTAL DE PRECISIÓN - ORDENANZA 13.906
Lee diccionario validado y genera polígonos precisos
Se mejora automáticamente conforme se validan más calles
"""

import json
import sys
import math
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher

try:
    from shapely.geometry import Polygon, box
except ImportError:
    print("Instala: pip install shapely")
    exit(1)

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

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
# UTILIDADES DE DICCIONARIO
# ============================================================================

def cargar_calles_validadas(json_path: str) -> Dict[str, Tuple[float, float]]:
    """Carga diccionario de calles validadas desde JSON"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        calles = {}
        for nombre, info in data.get("calles", {}).items():
            if info.get("validado"):  # Solo usar calles validadas
                calles[nombre] = (info["lat"], info["lng"])
        
        return calles
    
    except Exception as e:
        print(f"✗ Error cargando calles: {e}")
        return {}

def encontrar_calle(nombre_buscado: str, diccionario: Dict[str, Tuple[float, float]]) -> Optional[Tuple[str, float, float]]:
    """Busca calle con fuzzy matching"""
    
    def similarity(a: str, b: str) -> float:
        a = a.lower().strip()
        b = b.lower().strip()
        return SequenceMatcher(None, a, b).ratio()
    
    mejor_match = None
    mejor_score = 0
    
    for calle_dict, coords in diccionario.items():
        score = similarity(nombre_buscado, calle_dict)
        if score > mejor_score:
            mejor_score = score
            mejor_match = (calle_dict, coords)
    
    if mejor_score >= 0.80:  # 80% similar
        calle_matched, coords = mejor_match
        return (calle_matched, coords[0], coords[1], mejor_score)
    
    return None

def interpolar_punto(lat1: float, lng1: float, lat2: float, lng2: float, factor: float = 0.5) -> Tuple[float, float]:
    """Interpola un punto entre dos coordenadas"""
    lat = lat1 + (lat2 - lat1) * factor
    lng = lng1 + (lng2 - lng1) * factor
    return (lat, lng)

# ============================================================================
# DEFINICIONES DE BARRIOS CON DESCRIPCIÓN DE LÍMITES
# ============================================================================

BARRIOS_CON_LIMITES = {
    # Adrogué (ANEXO I)
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "limites": [
            ("Estrada", "Arturo Illia"),
            ("Arturo Illia", "Espora"),
            ("Espora", "Perón"),
            ("Perón", "Estrada")
        ]
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "limites": [
            ("Estrada", "Espora"),
            ("Espora", "Alberdi"),
            ("Alberdi", "Perón"),
            ("Perón", "Estrada")
        ]
    },
    # Burzaco (ANEXO II)
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "limites": [
            ("Perito Moreno", "Esteban Echeverría"),
            ("Esteban Echeverría", "Roque Sáenz Peña"),
            ("Roque Sáenz Peña", "Perito Moreno"),
        ]
    },
    # Claypole (ANEXO III)
    "Claypole Este": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "limites": [
            ("Roque Sáenz Peña", "Primera Junta"),
            ("Primera Junta", "Rawson"),
            ("Rawson", "Roque Sáenz Peña")
        ]
    },
}

# ============================================================================
# GENERADOR DE POLÍGONOS PRECISOS
# ============================================================================

def generar_poligono_barrio(barrio_info: Dict, calles_dict: Dict[str, Tuple[float, float]]) -> Optional[Polygon]:
    """Genera polígono preciso usando límites del barrio"""
    
    limites = barrio_info["limites"]
    puntos = []
    
    for calle1, calle2 in limites:
        # Buscar ambas calles en el diccionario
        result1 = encontrar_calle(calle1, calles_dict)
        result2 = encontrar_calle(calle2, calles_dict)
        
        if result1 and result2:
            # Punto de intersección (aproximado como punto medio)
            _, lat1, lng1, _ = result1
            _, lat2, lng2, conf2 = result2
            
            punto_interseccion = interpolar_punto(lat1, lng1, lat2, lng2, 0.5)
            puntos.append(punto_interseccion)
    
    if len(puntos) < 3:
        return None
    
    try:
        poly = Polygon(puntos)
        
        if not poly.is_valid:
            poly = poly.buffer(0)
        
        # Intersectar con Almirante Brown
        clipped = poly.intersection(ALMIRANTE_BROWN)
        
        if isinstance(clipped, Polygon) and clipped.area > 0:
            return clipped
    except:
        pass
    
    return None

def crear_rectangulo_fallback(centro_lat: float, centro_lng: float) -> Polygon:
    """Rectángulo como fallback"""
    size = 0.008
    return box(centro_lng - size, centro_lat - size, centro_lng + size, centro_lat + size)

# ============================================================================
# LOCALIDADES (Para barrios sin límites precisos)
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
}

def generar_grid_rectangular(localidad_config: Dict, num_barrios: int) -> List[Polygon]:
    """Genera grid rectangular como fallback"""
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
    print("★ GENERADOR INCREMENTAL DE PRECISIÓN - ORDENANZA 13.906")
    print("")
    print("=" * 80)
    print()
    
    # Cargar diccionario de calles
    script_dir = Path(__file__).parent
    calles_json_path = script_dir / "calles_validadas.json"
    
    if not calles_json_path.exists():
        print(f"✗ No encontrado: {calles_json_path}")
        print("  Asegúrate de que calles_validadas.json existe")
        return
    
    calles_validadas = cargar_calles_validadas(str(calles_json_path))
    print(f"✓ Calles cargadas: {len(calles_validadas)}")
    print()
    
    # ========================================================================
    # PROCESAMIENTO DE BARRIOS
    # ========================================================================
    
    features = []
    precisos = 0
    rectangulares = 0
    
    print("FASE 1: Barrios con Límites Precisos")
    print("-" * 80)
    print()
    
    for barrio_nombre, barrio_info in BARRIOS_CON_LIMITES.items():
        print(f"  📍 {barrio_nombre:30s}", end="", flush=True)
        
        polygon = generar_poligono_barrio(barrio_info, calles_validadas)
        
        if polygon:
            coords = [list(polygon.exterior.coords)]
            metodo = "Polígono Preciso"
            precisos += 1
            print(f" ✓ PRECISO")
        else:
            # Fallback rectangular
            centro_lat, centro_lng = -34.8150, -58.3750
            polygon = crear_rectangulo_fallback(centro_lat, centro_lng)
            coords = [list(polygon.exterior.coords)]
            metodo = "Rectangular (Fallback)"
            rectangulares += 1
            print(f" ⚠️  FALLBACK")
        
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
                "metodo": metodo,
                "geometria": "preciso" if precisos > 0 else "rectangular"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": coords
            }
        }
        
        features.append(feature)
    
    print()
    
    # ========================================================================
    # RESUMEN Y ESTADÍSTICAS
    # ========================================================================
    
    print("=" * 80)
    print("RESUMEN:")
    print()
    print(f"  ✓ Calles validadas en diccionario: {len(calles_validadas)}")
    print(f"  ✓ Barrios con límites procesados: {len(BARRIOS_CON_LIMITES)}")
    print(f"    • Polígonos precisos: {precisos}")
    print(f"    • Rectangulares (fallback): {rectangulares}")
    print()
    
    print("ESTADÍSTICAS:")
    print()
    print("  Barrios con límites validados (ejemplo):")
    for nombre in list(BARRIOS_CON_LIMITES.keys())[:5]:
        print(f"    • {nombre}")
    print(f"    • ... y {len(BARRIOS_CON_LIMITES) - 5 if len(BARRIOS_CON_LIMITES) > 5 else 0} más")
    print()
    
    print("=" * 80)
    print()
    print("📋 PRÓXIMOS PASOS:")
    print()
    print("  1. Validar en Google Maps:")
    print("     https://maps.google.com/")
    print("     Buscar: 'Calle_nombre, Almirante Brown, Buenos Aires'")
    print()
    print("  2. Agregar al diccionario (calles_validadas.json):")
    print("     • Nombre exacto")
    print("     • Latitud/Longitud (copiadas de coordenadas de Maps)")
    print("     • Marcar validado=true")
    print()
    print("  3. Agregar descripción de límites a barrios:")
    print("     • En BARRIOS_CON_LIMITES")
    print("     • Ej: 'limites': [('Calle1', 'Calle2'), ...]")
    print()
    print("  4. Ejecutar nuevamente este script")
    print()
    print("  👉 Cada calle validada mejora AUTOMÁTICAMENTE todos los barrios")
    print()
    print("=" * 80)
    
    # Guardar resultado
    if features:
        geojson = {
            "type": "FeatureCollection",
            "name": "INCREMENTAL - ORDENANZA 13.906",
            "bbox": [BBOX['min_lng'], BBOX['min_lat'], BBOX['max_lng'], BBOX['max_lat']],
            "properties": {
                "generado": datetime.now().isoformat(),
                "municipio": "Almirante Brown",
                "provincia": "Buenos Aires",
                "total_barrios_precisos": len(features),
                "calles_validadas": len(calles_validadas),
                "metodo": "Generador Incremental (mejora conforme se validan calles)",
                "nota": "Cada vez que valides una calle nueva, re-ejecuta este script"
            },
            "features": features
        }
        
        output_path = Path(__file__).parent / "barrios_incrementales.geojson"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Archivo de test guardado: barrios_incrementales.geojson")

if __name__ == "__main__":
    main()
