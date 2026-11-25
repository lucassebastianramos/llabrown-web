#!/usr/bin/env python3
"""
GENERADOR HÍBRIDO MEJORADO - ORDENANZA 13.906
Combina 9 barrios con geometría REAL (circuitos) + resto con rectángulos territoriales
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import math

# Centros y radio de localidades verificadas
LOCALIDADES_GRID = {
    "Adrogué": {
        "center": [-34.8033, -58.3846],
        "radius": 0.015,  # ~1.5 km
        "grid_size": 2
    },
    "Burzaco": {
        "center": [-34.8145, -58.3659],
        "radius": 0.02,
        "grid_size": 3
    },
    "Claypole": {
        "center": [-34.8456, -58.3532],
        "radius": 0.018,
        "grid_size": 3
    },
    "Glew": {
        "center": [-34.7865, -58.3421],
        "radius": 0.022,
        "grid_size": 4
    },
    "José Mármol": {
        "center": [-34.8312, -58.3923],
        "radius": 0.012,
        "grid_size": 2
    },
    "Longchamps": {
        "center": [-34.8576, -58.3287],
        "radius": 0.028,
        "grid_size": 5
    },
    "Malvinas Argentinas": {
        "center": [-34.8412, -58.4012],
        "radius": 0.016,
        "grid_size": 2
    },
    "Ministro Rivadavia": {
        "center": [-34.8267, -58.3156],
        "radius": 0.024,
        "grid_size": 3
    },
    "Rafael Calzada": {
        "center": [-34.8434, -58.3876],
        "radius": 0.014,
        "grid_size": 2
    },
    "San Francisco de Asís": {
        "center": [-34.8523, -58.3643],
        "radius": 0.018,
        "grid_size": 3
    },
    "San Francisco Solano": {
        "center": [-34.8634, -58.3734],
        "radius": 0.020,
        "grid_size": 2
    },
    "San José": {
        "center": [-34.8543, -58.3821],
        "radius": 0.022,
        "grid_size": 3
    }
}

def create_rectangular_barrio(
    center_lat: float,
    center_lng: float,
    width: float,
    height: float
) -> List[List[List[float]]]:
    """Crea un polígono rectangular"""
    half_width = width / 2
    half_height = height / 2
    
    # Rectángulo: [lng, lat]
    coords = [
        [center_lng - half_width, center_lat - half_height],  # SW
        [center_lng + half_width, center_lat - half_height],  # SE
        [center_lng + half_width, center_lat + half_height],  # NE
        [center_lng - half_width, center_lat + half_height],  # NW
        [center_lng - half_width, center_lat - half_height],  # Cierre
    ]
    
    return [coords]

def create_barrio_grid(
    localidad: str,
    localidad_config: Dict,
    barrios_en_localidad: int
) -> List[Dict]:
    """Crea grid de barrios rectangulares para una localidad"""
    
    features = []
    center_lat, center_lng = localidad_config["center"]
    radius = localidad_config["radius"]
    grid_size = min(localidad_config["grid_size"], math.ceil(math.sqrt(barrios_en_localidad)))
    
    # Tamaño de cada celda en el grid
    cell_width = (radius * 2) / grid_size
    cell_height = (radius * 2) / grid_size
    
    # Generar polígonos para cada barrio
    idx = 0
    created = 0
    
    for row in range(grid_size):
        for col in range(grid_size):
            if created >= barrios_en_localidad:
                break
            
            # Centro de la celda
            cell_center_lat = center_lat - radius + (row + 0.5) * cell_height
            cell_center_lng = center_lng - radius + (col + 0.5) * cell_width
            
            coords = create_rectangular_barrio(
                cell_center_lat,
                cell_center_lng,
                cell_width * 0.95,  # Pequeño margen
                cell_height * 0.95
            )
            
            idx += 1
            created += 1
            
            yield {
                "localidad": localidad,
                "coordinates": coords,
                "order": idx,
                "row": row,
                "col": col
            }

def load_circuito_barrios() -> Dict[str, Dict]:
    """Carga los 9 barrios que ya tienen geometría de circuitos"""
    circuitos_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown.geojson"
    
    if not circuitos_path.exists():
        return {}
    
    with open(circuitos_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    barrios_dict = {}
    for feature in data.get('features', []):
        barrio_name = feature['properties']['nombre']
        barrios_dict[barrio_name] = feature
    
    return barrios_dict

def main():
    print("=" * 80)
    print("🗺️  GENERADOR HÍBRIDO MEJORADO - ORDENANZA 13.906")
    print("=" * 80)
    print()
    
    # Cargar barrios con geometría REAL
    barrios_reales = load_circuito_barrios()
    print(f"📌 Barrios con geometría REAL (de circuitos): {len(barrios_reales)}")
    
    if barrios_reales:
        for nombre in barrios_reales.keys():
            print(f"   ✅ {nombre}")
    print()
    
    # Definir todos los barrios por localidad (del script anterior)
    barrios_por_localidad = {
        "Adrogué": ["Barrio Vattuone", "Adrogué Centro"],
        "Burzaco": [
            "Corimayo", "Las Rosas", "Primera Junta", "Roca", "Don Alejandro",
            "Burzaco Centro", "La Carlota", "Sakura", "Luz y Fuerza",
            "Lomas de Burzaco", "El Gaucho", "El Hornero", "La Cumbre",
            "La Primavera", "La Pilarica", "La Lucy", "Almafuerte",
            "Ciudad Oculta", "San Pablo", "El Recuerdo", "Arzeno",
            "Parque Industrial", "Solis"
        ],
        "Claypole": [
            "Claypole Este", "El Trébol", "Horizonte", "La Jovita",
            "Mariano Moreno", "Medalla Milagrosa", "Barrio Parque", "Sáenz",
            "San Lucas", "San Luis", "Sideco", "Claypole Oeste", "Santa Clara",
            "El Triángulo", "Loma de Burzaco"
        ],
        "Glew": [
            "Gendarmería", "El Triunfo", "Kanmar", "600 Viviendas", "Santa Rosa",
            "Santa Ana", "Las Calandrias", "Villa París", "Ombú", "Ipona",
            "Los Aromos", "Telepostal", "UPCN", "El Castillo Las Heras",
            "Los Álamos", "COTEPA", "Parque Roma", "OUCRA", "Gorritti",
            "Progreso", "El Trébol Glew", "Glew Centro Oeste", "Glew Centro Este",
            "Almafuerte Glew", "SUPA", "COTEPA-PROGRESO"
        ],
        "José Mármol": ["Mármol Norte", "Mármol Centro", "Barrio Arca", "Martin Arin"],
        "Longchamps": [
            "Altos de Longchamps", "Amancay", "Ampliación Santa Rita", "Amutum 1",
            "Amutum 2 Santa Rita", "Campo Ramos", "Casablanca", "Don Luis",
            "Doña Sol", "El Triángulo Longchamps", "Esperanza", "Ferroviario",
            "Jorge Newbery", "La Carmen", "Las Lilas", "Los Frutales", "Los Studs",
            "Barrio Municipal", "Rayo de Sol", "Sakura Lch", "Santa Adela",
            "Santa María", "Santa Rita", "Villa París Lch", "Viplastic",
            "Bicentenario", "14 de febrero", "Club Lomas"
        ],
        "Malvinas Argentinas": [
            "La Lucy Malvinas", "El Encuentro", "Betharram", "Loma Verde",
            "Arzeno Malvinas", "Ona", "La Pilarica Malvinas", "San Miguel",
            "Policial", "Lindo 1 y 2", "Empleados de Comercio", "Canario"
        ],
        "Ministro Rivadavia": [
            "Ibáñez", "San Juan de Corimayo", "La Matera", "Los Troncos",
            "Altos Del Castillo", "Del Carmen", "Madres", "Rivadavia Centro",
            "Policial Rivadavia", "Barrio Parque Rivadavia", "Tsuji", "Los Ciruelos",
            "Lujan", "Los Pinos", "Los Paraguayos", "La Arbolada", "La Hermosa"
        ],
        "Rafael Calzada": [
            "Capilla Del Señor", "La Loma RC", "San Javier",
            "Villa Rafael Calzada", "2 de abril RC", "14 de noviembre",
            "San Jerónimo", "Asunción RC"
        ],
        "San Francisco de Asís": [
            "Cerrito", "Don Orione", "La Esther", "Las Latitas", "Martin Fierro",
            "Suterh 2", "BI.PER.MU.", "Libertad SF", "6 de diciembre",
            "Don Orione Viejo", "Suterh 1", "Soom"
        ],
        "San Francisco Solano": [
            "Guadalupe", "Las Lomas De San Francisco", "Las Tunas", "Los Chalets",
            "Parque Uno", "Parque Dos", "Complejo Habitacional SFS", "Nueva Pompeya",
            "San Agustin", "Santa Catalina", "Santa Isabel", "Villa Laura", "Zabala"
        ],
        "San José": [
            "San Ramón", "La Gloria", "8 de noviembre", "8 de diciembre", "Garay",
            "Santa Maria SJ", "La Loma SJ", "La Victoria", "Puerto Argentino",
            "La Tablada", "La Cava", "Virgen De Luján Ombú", "Agustín Ramírez",
            "Altos De Santa Ana", "San José"
        ]
    }
    
    # Colores por localidad
    colores = {
        "Adrogué": "#EF4444",
        "Burzaco": "#F59E0B",
        "Claypole": "#3B82F6",
        "Glew": "#10B981",
        "José Mármol": "#EC4899",
        "Longchamps": "#8B5CF6",
        "Malvinas Argentinas": "#06B6D4",
        "Ministro Rivadavia": "#F97316",
        "Rafael Calzada": "#84CC16",
        "San Francisco de Asís": "#00D9FF",
        "San Francisco Solano": "#FBBF24",
        "San José": "#A78BFA",
    }
    
    features = []
    
    # Procesar cada localidad
    for localidad, barrios_list in barrios_por_localidad.items():
        print(f"📍 {localidad}: {len(barrios_list)} barrios")
        localidad_config = LOCALIDADES_GRID[localidad]
        color = colores[localidad]
        
        # Generar grid de barrios
        grid_barrios = list(create_barrio_grid(localidad, localidad_config, len(barrios_list)))
        
        for idx, barrio_name in enumerate(barrios_list):
            # Usar geometría REAL si existe
            if barrio_name in barrios_reales:
                feature = barrios_reales[barrio_name].copy()
                print(f"   ✅ {barrio_name:35s} [REAL]")
            else:
                # Crear geometría rectangular
                grid_data = grid_barrios[idx] if idx < len(grid_barrios) else grid_barrios[0]
                
                feature = {
                    "type": "Feature",
                    "id": barrio_name.lower().replace(" ", "_").replace("á", "a"),
                    "properties": {
                        "nombre": barrio_name,
                        "localidad": localidad,
                        "color": color,
                        "tipo": "Barrio",
                        "ordenanza": "13.906",
                        "metodo": "Aproximado"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": grid_data["coordinates"]
                    }
                }
                print(f"   📦 {barrio_name:35s} [APROXIMADO]")
            
            features.append(feature)
    
    # Crear FeatureCollection
    total_barrios = sum(len(b) for b in barrios_por_localidad.values())
    
    geojson = {
        "type": "FeatureCollection",
        "name": "BARRIOS COMPLETOS - ORDENANZA 13.906 (Híbrido Mejorado)",
        "bbox": [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758],
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "barrios_con_geometria_real": len(barrios_reales),
            "barrios_aproximados": len(features) - len(barrios_reales),
            "metodo": "Híbrido: Geometrías REALES de circuitos + Polígonos rectangulares territoriales",
        },
        "features": features
    }
    
    # Guardar
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_completo.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print()
    print("=" * 80)
    print(f"✅ ARCHIVO GENERADO: {output_path}")
    print()
    print("📊 RESUMEN HÍBRIDO:")
    print(f"   • Total de barrios: {len(features)}")
    print(f"   • Con geometría REAL (circuitos): {len(barrios_reales)}")
    print(f"   • Polígonos territoriales: {len(features) - len(barrios_reales)}")
    print()
    
    localidad_counts = {}
    for feature in features:
        loc = feature['properties']['localidad']
        localidad_counts[loc] = localidad_counts.get(loc, 0) + 1
    
    print("   📍 Por localidad:")
    for loc in sorted(localidad_counts.keys()):
        print(f"      • {loc:25s}: {localidad_counts[loc]:2d} barrios")
    
    print()
    print("=" * 80)
    print("✨ ¡FORMA DE ALMIRANTE BROWN RESTAURADA!")
    print("🔄 Refresca: http://localhost:5557/barrios")
    print("=" * 80)

if __name__ == "__main__":
    main()
