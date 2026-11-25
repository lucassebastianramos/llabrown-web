#!/usr/bin/env python3
"""
Script para crear un mapa interactivo con los barrios de Almirante Brown.
Requiere: pip install folium

Uso:
    python api/src/scripts/visualize_barrios_map.py
    
Genera un archivo: barrios_map.html que puedes abrir en el navegador.
"""

import json
import sys
from pathlib import Path

try:
    import folium
    from folium import plugins
except ImportError:
    print("❌ Error: folium no está instalado")
    print("Instálalo con: pip install folium")
    sys.exit(1)


def load_geojson(filepath: str | Path) -> dict | None:
    """Carga el archivo GeoJSON."""
    filepath = Path(filepath)
    
    if not filepath.exists():
        print(f"❌ No se encontró: {filepath}")
        return None
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error al leer {filepath}: {e}")
        return None


def get_geojson_center(geojson_data: dict) -> tuple[float, float]:
    """Calcula el centro del mapa a partir del bbox del GeoJSON."""
    if 'bbox' in geojson_data:
        lon_min, lat_min, lon_max, lat_max = geojson_data['bbox']
        center_lat = (lat_min + lat_max) / 2
        center_lon = (lon_min + lon_max) / 2
        return [center_lat, center_lon]
    
    # Fallback: si no hay bbox, estimar coordenadas de Almirante Brown
    return [-34.79, -58.38]


def create_map(geojson_data: dict, output_file: str | Path = "barrios_map.html"):
    """Crea un mapa interactivo con folium."""
    output_file = Path(output_file)
    
    center = get_geojson_center(geojson_data)
    
    print(f"📍 Centro del mapa: {center}")
    
    # Crear mapa base
    m = folium.Map(
        location=center,
        zoom_start=13,
        tiles='OpenStreetMap'
    )
    
    # Colores para diferentes localidades
    colors = {
        'Adrogué': '#FF6B6B',          # Rojo
        'Burzaco': '#4ECDC4',          # Turquesa
        'Claypole': '#45B7D1',         # Azul claro
        'Glew': '#FFA07A',             # Salmon
        'Isidro Casanova': '#98D8C8',  # Verde menta
        'Longchamps': '#F7DC6F',       # Amarillo
        'Lomas del Mirador': '#BB8FCE', # Púrpura
        'Pérez Millán': '#85C1E9',     # Azul
        'Pte. de la Noria': '#F8B88B', # Naranja
        'Temperley': '#BDC3C7',        # Gris
    }
    
    # Agregar las features (barrios)
    features = geojson_data.get('features', [])
    print(f"\n🏘️  Agregando {len(features)} barrios al mapa...")
    
    for idx, feature in enumerate(features):
        props = feature.get('properties', {})
        nombre = props.get('nombre', 'Sin nombre')
        localidad = props.get('localidad', 'Desconocida')
        
        # Seleccionar color según localidad
        color = colors.get(localidad, '#888888')
        
        # Agregar el polígono
        folium.GeoJson(
            feature,
            style_function=lambda x, c=color: {
                'fillColor': c,
                'color': 'black',
                'weight': 2,
                'opacity': 0.8,
                'fillOpacity': 0.6,
            },
            popup=folium.Popup(
                f"<b>{nombre}</b><br><i>{localidad}</i>",
                max_width=300
            ),
            tooltip=f"{nombre} ({localidad})"
        ).add_to(m)
    
    # Agregar título
    title_html = '''
    <div style="position: fixed; 
        top: 10px; left: 50px; width: 300px; height: 100px; 
        background-color: white; border:2px solid grey; z-index:9999; 
        font-size:16px; padding: 10px; border-radius: 5px;">
        <b>🗺️ Barrios de Almirante Brown</b><br>
        <small>Ordenanza N° 13.906</small><br>
        <small style="color: #888;">Localidades: {0}</small>
    </div>
    '''.format(', '.join(sorted(set(f.get('properties', {}).get('localidad', '') for f in features))))
    m.get_root().html.add_child(folium.Element(title_html))
    
    # Agregar leyenda de localidades
    legend_html = '''
    <div style="position: fixed; 
        bottom: 50px; right: 10px; width: 200px; 
        background-color: white; border:2px solid grey; z-index:9999; 
        font-size:12px; padding: 10px; border-radius: 5px;">
        <b>Localidades</b><br>
    '''
    
    for localidad, color in sorted(colors.items()):
        legend_html += f'<i style="background:{color}; width: 15px; height: 15px; float: left; margin-right: 8px; border: 1px solid #333;"></i>{localidad}<br>'
    
    legend_html += '</div>'
    m.get_root().html.add_child(folium.Element(legend_html))
    
    # Guardar
    m.save(output_file)
    print(f"\n✅ Mapa guardado en: {output_file}")
    print(f"   Abre este archivo en tu navegador web para visualizar")


def main():
    """Función principal."""
    print("="*70)
    print("🗺️  Visualizador de Barrios - Almirante Brown")
    print("="*70)
    
    # Buscar el archivo GeoJSON
    possible_paths = [
        Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson",
        Path.cwd() / "limites_barrios_brown.geojson",
        Path.cwd() / "api" / "data" / "limites_barrios_brown.geojson",
    ]
    
    geojson_file = None
    for path in possible_paths:
        if path.exists():
            geojson_file = path
            break
    
    if not geojson_file:
        print("\n❌ No se encontró limites_barrios_brown.geojson")
        print("\nUbicaciones buscadas:")
        for path in possible_paths:
            print(f"   - {path}")
        print("\n⚠️  Primero debes ejecutar: generate_barrios_geojson.py")
        return
    
    print(f"\n📂 Cargando: {geojson_file}\n")
    
    # Cargar GeoJSON
    geojson_data = load_geojson(geojson_file)
    if not geojson_data:
        return
    
    # Crear mapa
    output_path = Path(__file__).parent.parent.parent.parent / "barrios_map.html"
    create_map(geojson_data, output_path)
    
    print("\n" + "="*70)
    print("¡Mapa generado exitosamente! 🎉")
    print("="*70)


if __name__ == "__main__":
    main()
