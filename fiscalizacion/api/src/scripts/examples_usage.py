#!/usr/bin/env python3
"""
Script de ejemplo: Cómo usar los datos generados
Demuestra cómo procesar y utilizar el GeoJSON en diferentes contextos.
"""

import json
from pathlib import Path
from typing import List, Dict, Any


def example_1_load_geojson():
    """Ejemplo 1: Cargar y listar todos los barrios."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 1: Cargar y listar barrios")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado. Ejecuta generate_barrios_geojson.py primero.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    print(f"\n✅ Archivo cargado: {geojson_path.name}")
    print(f"Total de barrios: {len(geojson_data['features'])}\n")
    
    # Agrupar por localidad
    barrios_por_localidad = {}
    for feature in geojson_data['features']:
        props = feature['properties']
        localidad = props.get('localidad', 'Desconocida')
        nombre = props.get('nombre')
        
        if localidad not in barrios_por_localidad:
            barrios_por_localidad[localidad] = []
        
        barrios_por_localidad[localidad].append(nombre)
    
    # Mostrar
    for localidad in sorted(barrios_por_localidad.keys()):
        barrios = barrios_por_localidad[localidad]
        print(f"🏘️  {localidad} ({len(barrios)}):")
        for barrio in barrios:
            print(f"      • {barrio}")
    
    print()


def example_2_extract_coordinates():
    """Ejemplo 2: Extraer coordenadas de un barrio específico."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 2: Extraer coordenadas de un barrio")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Buscar un barrio específico
    barrio_nombre = "Adrogué Centro"
    feature = next(
        (f for f in geojson_data['features'] 
         if f['properties'].get('nombre') == barrio_nombre),
        None
    )
    
    if not feature:
        print(f"❌ Barrio '{barrio_nombre}' no encontrado")
        return
    
    coords = feature['geometry']['coordinates'][0]  # Primera ring del polígono
    
    print(f"\n✅ Barrio encontrado: {barrio_nombre}")
    print(f"Coordenadas del polígono (primeros 5 puntos):\n")
    
    for idx, (lon, lat) in enumerate(coords[:5]):
        print(f"  Punto {idx + 1}: ({lat:.6f}, {lon:.6f})")
    
    print(f"\n  ... ({len(coords)} puntos totales)\n")


def example_3_filter_by_locality():
    """Ejemplo 3: Filtrar barrios por localidad."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 3: Filtrar barrios por localidad")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Filtrar por localidad
    localidad_filtro = "Burzaco"
    barrios_filtrados = [
        f for f in geojson_data['features']
        if f['properties'].get('localidad') == localidad_filtro
    ]
    
    print(f"\n✅ Barrios en {localidad_filtro}:\n")
    
    for feature in barrios_filtrados:
        props = feature['properties']
        coords_count = len(feature['geometry']['coordinates'][0]) - 1  # Excluir cierre
        print(f"  • {props.get('nombre')}")
        print(f"    Puntos: {coords_count}")
        print()


def example_4_calculate_centroid():
    """Ejemplo 4: Calcular el centroide (centro) de un barrio."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 4: Calcular centroide de un barrio")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    def calculate_centroid(coords: List[List[float]]) -> tuple:
        """Calcula el centroide de un conjunto de coordenadas."""
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        return (sum(lats) / len(lats), sum(lons) / len(lons))
    
    print(f"\n✅ Centroides de barrios:\n")
    
    for feature in geojson_data['features'][:5]:  # Primeros 5
        props = feature['properties']
        coords = feature['geometry']['coordinates'][0]
        centroid_lat, centroid_lon = calculate_centroid(coords)
        
        print(f"  {props.get('nombre')} ({props.get('localidad')})")
        print(f"    Centro: ({centroid_lat:.6f}, {centroid_lon:.6f})\n")


def example_5_export_geojson_subset():
    """Ejemplo 5: Exportar un subset de barrios a nuevo GeoJSON."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 5: Exportar subset de barrios")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Filtrar solo Adrogué
    features_adrogué = [
        f for f in geojson_data['features']
        if f['properties'].get('localidad') == 'Adrogué'
    ]
    
    # Crear nuevo FeatureCollection
    subset_geojson = {
        "type": "FeatureCollection",
        "name": "Barrios - Adrogué",
        "features": features_adrogué
    }
    
    # Guardar
    output_path = Path(__file__).parent.parent.parent.parent / "barrios_adroguee_subset.geojson"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(subset_geojson, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Subset exportado a: barrios_adroguee_subset.geojson")
    print(f"   Total de barrios: {len(features_adrogué)}\n")


def example_6_convert_to_geojsonl():
    """Ejemplo 6: Convertir a GeoJSON Lines (GEOJSONL)."""
    print("\n" + "="*70)
    print("📖 EJEMPLO 6: Convertir a GeoJSON Lines (GEOJSONL)")
    print("="*70)
    
    geojson_path = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
    
    if not geojson_path.exists():
        print("❌ Archivo no encontrado.")
        return
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Convertir a GEOJSONL (una Feature por línea)
    output_path = Path(__file__).parent.parent.parent.parent / "barrios.geojsonl"
    with open(output_path, 'w', encoding='utf-8') as f:
        for feature in geojson_data['features']:
            f.write(json.dumps(feature, ensure_ascii=False) + '\n')
    
    print(f"\n✅ Convertido a GEOJSONL: barrios.geojsonl")
    print(f"   Líneas: {len(geojson_data['features'])}\n")


def main():
    """Función principal."""
    print("\n" + "="*70)
    print("📚 EJEMPLOS DE USO - Generador de Barrios GeoJSON")
    print("="*70)
    
    examples = [
        ("Cargar y listar barrios", example_1_load_geojson),
        ("Extraer coordenadas", example_2_extract_coordinates),
        ("Filtrar por localidad", example_3_filter_by_locality),
        ("Calcular centroides", example_4_calculate_centroid),
        ("Exportar subset", example_5_export_geojson_subset),
        ("Convertir a GEOJSONL", example_6_convert_to_geojsonl),
    ]
    
    # Ejecutar todos los ejemplos
    for title, func in examples:
        try:
            func()
        except Exception as e:
            print(f"\n❌ Error en {title}: {e}")
    
    print("\n" + "="*70)
    print("✅ Ejemplos completados")
    print("="*70)


if __name__ == "__main__":
    main()
