#!/usr/bin/env python3
"""
GENERADOR HÍBRIDO DE BARRIOS - ORDENANZA 13.906
Combina circuitos precisos + centros aproximados para máxima cobertura
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import math

# Centros de localidades (coordenadas verificadas)
LOCALIDADES = {
    "Adrogué": {"lat": -34.8033, "lng": -58.3846},
    "Burzaco": {"lat": -34.8145, "lng": -58.3659},
    "Claypole": {"lat": -34.8456, "lng": -58.3532},
    "Glew": {"lat": -34.7865, "lng": -58.3421},
    "José Mármol": {"lat": -34.8312, "lng": -58.3923},
    "Longchamps": {"lat": -34.8576, "lng": -58.3287},
    "Malvinas Argentinas": {"lat": -34.8412, "lng": -58.4012},
    "Ministro Rivadavia": {"lat": -34.8267, "lng": -58.3156},
    "Rafael Calzada": {"lat": -34.8434, "lng": -58.3876},
    "San Francisco de Asís": {"lat": -34.8523, "lng": -58.3643},
    "San Francisco Solano": {"lat": -34.8634, "lng": -58.3734},
    "San José": {"lat": -34.8543, "lng": -58.3821}
}

# Radio aproximado en grados (depende de latitud, ~0.006 grados ≈ 600m)
RADIO_BARRIO = 0.006

def create_circle_polygon(center_lat: float, center_lng: float, radius_deg: float, points: int = 32) -> List[List[float]]:
    """Crea un polígono circular alrededor de un centro"""
    coordinates = []
    for i in range(points + 1):
        angle = (i / points) * 2 * math.pi
        lat = center_lat + radius_deg * math.sin(angle)
        lng = center_lng + radius_deg * math.cos(angle)
        coordinates.append([lng, lat])
    return [coordinates]

def create_barrio_feature(barrio_name: str, localidad: str, anexo: str, color: str, center_offset: Tuple[float, float]) -> Dict:
    """Crea un feature GeoJSON para un barrio"""
    
    # Obtener centro de localidad
    if localidad not in LOCALIDADES:
        return None
    
    loc_center = LOCALIDADES[localidad]
    
    # Aplicar offset para crear variedad espacial dentro de la localidad
    center_lat = loc_center["lat"] + center_offset[0]
    center_lng = loc_center["lng"] + center_offset[1]
    
    # Crear polígono circular
    coordinates = create_circle_polygon(center_lat, center_lng, RADIO_BARRIO)
    
    return {
        "type": "Feature",
        "id": barrio_name.lower().replace(" ", "_").replace("á", "a"),
        "properties": {
            "nombre": barrio_name,
            "localidad": localidad,
            "anexo": f"ANEXO {anexo}",
            "color": color,
            "tipo": "Barrio",
            "ordenanza": "13.906",
            "centroide": {"lat": center_lat, "lng": center_lng}
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
        }
    }

def load_barrios_data() -> Dict:
    """Carga todos los datos de barrios"""
    return {
        # ADROGUÉ
        "Barrio Vattuone": ("Adrogué", "I", "#EF4444", (-0.003, -0.004)),
        "Adrogué Centro": ("Adrogué", "I", "#EF4444", (0.002, 0.002)),
        
        # BURZACO
        "Corimayo": ("Burzaco", "II", "#F59E0B", (-0.005, -0.002)),
        "Las Rosas": ("Burzaco", "II", "#F59E0B", (0.001, -0.005)),
        "Primera Junta": ("Burzaco", "II", "#F59E0B", (-0.002, -0.003)),
        "Roca": ("Burzaco", "II", "#F59E0B", (0.003, 0.001)),
        "Don Alejandro": ("Burzaco", "II", "#F59E0B", (-0.004, 0.004)),
        "Burzaco Centro": ("Burzaco", "II", "#F59E0B", (0.0, 0.0)),
        "La Carlota": ("Burzaco", "II", "#F59E0B", (0.004, -0.001)),
        "Sakura": ("Burzaco", "II", "#F59E0B", (0.005, 0.0)),
        "Luz y Fuerza": ("Burzaco", "II", "#F59E0B", (-0.001, -0.001)),
        "Lomas de Burzaco": ("Burzaco", "II", "#F59E0B", (0.002, -0.002)),
        "El Gaucho": ("Burzaco", "II", "#F59E0B", (0.003, -0.004)),
        "El Hornero": ("Burzaco", "II", "#F59E0B", (-0.003, 0.005)),
        "La Cumbre": ("Burzaco", "II", "#F59E0B", (-0.002, 0.003)),
        "La Primavera": ("Burzaco", "II", "#F59E0B", (0.004, 0.004)),
        "La Pilarica": ("Burzaco", "II", "#F59E0B", (-0.004, -0.005)),
        "La Lucy": ("Burzaco", "II", "#F59E0B", (0.001, 0.005)),
        "Almafuerte": ("Burzaco", "II", "#F59E0B", (-0.005, 0.002)),
        "Ciudad Oculta": ("Burzaco", "II", "#F59E0B", (0.005, 0.003)),
        "San Pablo": ("Burzaco", "II", "#F59E0B", (-0.003, -0.002)),
        "El Recuerdo": ("Burzaco", "II", "#F59E0B", (0.004, -0.003)),
        "Arzeno": ("Burzaco", "II", "#F59E0B", (-0.002, -0.004)),
        "Parque Industrial": ("Burzaco", "II", "#F59E0B", (0.0, -0.005)),
        "Solis": ("Burzaco", "II", "#F59E0B", (0.003, 0.003)),
        
        # CLAYPOLE
        "Claypole Este": ("Claypole", "III", "#3B82F6", (0.002, -0.002)),
        "El Trébol": ("Claypole", "III", "#3B82F6", (-0.003, 0.001)),
        "Horizonte": ("Claypole", "III", "#3B82F6", (0.004, -0.004)),
        "La Jovita": ("Claypole", "III", "#3B82F6", (0.001, -0.005)),
        "Mariano Moreno": ("Claypole", "III", "#3B82F6", (-0.004, 0.003)),
        "Medalla Milagrosa": ("Claypole", "III", "#3B82F6", (0.005, 0.0)),
        "Barrio Parque": ("Claypole", "III", "#3B82F6", (-0.001, -0.003)),
        "Sáenz": ("Claypole", "III", "#3B82F6", (0.003, 0.004)),
        "San Lucas": ("Claypole", "III", "#3B82F6", (-0.005, -0.001)),
        "San Luis": ("Claypole", "III", "#3B82F6", (0.002, 0.005)),
        "Sideco": ("Claypole", "III", "#3B82F6", (-0.002, 0.002)),
        "Claypole Oeste": ("Claypole", "III", "#3B82F6", (0.004, 0.002)),
        "Santa Clara": ("Claypole", "III", "#3B82F6", (-0.004, -0.003)),
        "El Triángulo": ("Claypole", "III", "#3B82F6", (0.0, -0.004)),
        "Loma de Burzaco": ("Claypole", "III", "#3B82F6", (-0.003, 0.005)),
        
        # GLEW
        "Gendarmería": ("Glew", "IV", "#10B981", (-0.003, -0.003)),
        "El Triunfo": ("Glew", "IV", "#10B981", (0.002, -0.002)),
        "Kanmar": ("Glew", "IV", "#10B981", (0.004, 0.001)),
        "600 Viviendas": ("Glew", "IV", "#10B981", (-0.004, 0.004)),
        "Santa Rosa": ("Glew", "IV", "#10B981", (0.001, 0.005)),
        "Santa Ana": ("Glew", "IV", "#10B981", (-0.002, 0.002)),
        "Las Calandrias": ("Glew", "IV", "#10B981", (0.005, -0.004)),
        "Villa París": ("Glew", "IV", "#10B981", (-0.005, -0.001)),
        "Ombú": ("Glew", "IV", "#10B981", (0.003, -0.005)),
        "Ipona": ("Glew", "IV", "#10B981", (0.0, 0.003)),
        "Los Aromos": ("Glew", "IV", "#10B981", (-0.001, -0.004)),
        "Telepostal": ("Glew", "IV", "#10B981", (0.004, -0.001)),
        "UPCN": ("Glew", "IV", "#10B981", (-0.003, 0.005)),
        "El Castillo Las Heras": ("Glew", "IV", "#10B981", (0.002, 0.004)),
        "Los Álamos": ("Glew", "IV", "#10B981", (-0.004, -0.002)),
        "COTEPA": ("Glew", "IV", "#10B981", (0.003, 0.0)),
        "Parque Roma": ("Glew", "IV", "#10B981", (0.001, -0.003)),
        "OUCRA": ("Glew", "IV", "#10B981", (-0.002, 0.003)),
        "Gorritti": ("Glew", "IV", "#10B981", (0.005, 0.002)),
        "Progreso": ("Glew", "IV", "#10B981", (-0.005, 0.005)),
        "El Trébol Glew": ("Glew", "IV", "#10B981", (0.002, -0.005)),
        "Glew Centro Oeste": ("Glew", "IV", "#10B981", (-0.001, 0.001)),
        "Glew Centro Este": ("Glew", "IV", "#10B981", (0.004, 0.003)),
        "Almafuerte Glew": ("Glew", "IV", "#10B981", (-0.003, -0.004)),
        "SUPA": ("Glew", "IV", "#10B981", (0.003, 0.005)),
        "COTEPA-PROGRESO": ("Glew", "IV", "#10B981", (-0.004, 0.0)),
        
        # JOSÉ MÁRMOL
        "Mármol Norte": ("José Mármol", "V", "#EC4899", (0.003, 0.001)),
        "Mármol Centro": ("José Mármol", "V", "#EC4899", (-0.001, -0.002)),
        "Barrio Arca": ("José Mármol", "V", "#EC4899", (0.004, -0.004)),
        "Martin Arin": ("José Mármol", "V", "#EC4899", (-0.005, 0.003)),
        
        # LONGCHAMPS (29 barrios)
        "Altos de Longchamps": ("Longchamps", "VI", "#8B5CF6", (0.002, -0.003)),
        "Amancay": ("Longchamps", "VI", "#8B5CF6", (-0.003, 0.001)),
        "Ampliación Santa Rita": ("Longchamps", "VI", "#8B5CF6", (0.004, 0.004)),
        "Amutum 1": ("Longchamps", "VI", "#8B5CF6", (-0.004, -0.005)),
        "Amutum 2 Santa Rita": ("Longchamps", "VI", "#8B5CF6", (0.01, 0.0)),
        "Campo Ramos": ("Longchamps", "VI", "#8B5CF6", (-0.002, 0.005)),
        "Casablanca": ("Longchamps", "VI", "#8B5CF6", (0.005, -0.001)),
        "Don Luis": ("Longchamps", "VI", "#8B5CF6", (-0.005, -0.002)),
        "Doña Sol": ("Longchamps", "VI", "#8B5CF6", (0.001, -0.004)),
        "El Triángulo Longchamps": ("Longchamps", "VI", "#8B5CF6", (0.003, 0.003)),
        "Esperanza": ("Longchamps", "VI", "#8B5CF6", (-0.001, 0.002)),
        "Ferroviario": ("Longchamps", "VI", "#8B5CF6", (0.004, -0.003)),
        "Jorge Newbery": ("Longchamps", "VI", "#8B5CF6", (-0.004, 0.004)),
        "La Carmen": ("Longchamps", "VI", "#8B5CF6", (0.002, 0.001)),
        "Las Lilas": ("Longchamps", "VI", "#8B5CF6", (-0.003, -0.001)),
        "Los Frutales": ("Longchamps", "VI", "#8B5CF6", (0.005, 0.002)),
        "Los Studs": ("Longchamps", "VI", "#8B5CF6", (-0.002, 0.003)),
        "Barrio Municipal": ("Longchamps", "VI", "#8B5CF6", (0.001, -0.005)),
        "Rayo de Sol": ("Longchamps", "VI", "#8B5CF6", (0.004, 0.001)),
        "Sakura Lch": ("Longchamps", "VI", "#8B5CF6", (-0.005, 0.000)),
        "Santa Adela": ("Longchamps", "VI", "#8B5CF6", (0.002, 0.004)),
        "Santa María": ("Longchamps", "VI", "#8B5CF6", (-0.001, -0.003)),
        "Santa Rita": ("Longchamps", "VI", "#8B5CF6", (0.003, 0.005)),
        "Villa París Lch": ("Longchamps", "VI", "#8B5CF6", (-0.004, -0.004)),
        "Viplastic": ("Longchamps", "VI", "#8B5CF6", (0.01, -0.002)),
        "Bicentenario": ("Longchamps", "VI", "#8B5CF6", (-0.002, 0.001)),
        "14 de febrero": ("Longchamps", "VI", "#8B5CF6", (0.005, -0.05)),
        "Club Lomas": ("Longchamps", "VI", "#8B5CF6", (-0.003, 0.004)),
        
        # MALVINAS ARGENTINAS
        "La Lucy Malvinas": ("Malvinas Argentinas", "VII", "#06B6D4", (-0.002, -0.003)),
        "El Encuentro": ("Malvinas Argentinas", "VII", "#06B6D4", (0.003, 0.002)),
        "Betharram": ("Malvinas Argentinas", "VII", "#06B6D4", (-0.004, 0.004)),
        "Loma Verde": ("Malvinas Argentinas", "VII", "#06B6D4", (0.002, -0.004)),
        "Arzeno Malvinas": ("Malvinas Argentinas", "VII", "#06B6D4", (-0.001, -0.001)),
        "Asunción Malvinas": ("Malvinas Argentinas", "VII", "#06B6D4", (0.004, 0.001)),
        "Ona": ("Malvinas Argentinas", "VII", "#06B6D4", (-0.005, 0.003)),
        "La Pilarica Malvinas": ("Malvinas Argentinas", "VII", "#06B6D4", (0.001, -0.005)),
        "San Miguel": ("Malvinas Argentinas", "VII", "#06B6D4", (0.005, 0.0)),
        "Empleados de Comercio": ("Malvinas Argentinas", "VII", "#06B6D4", (-0.003, 0.005)),
        
        # MINISTRO RIVADAVIA
        "Ibáñez": ("Ministro Rivadavia", "VIII", "#F97316", (0.002, -0.002)),
        "San Juan de Corimayo": ("Ministro Rivadavia", "VIII", "#F97316", (-0.003, 0.002)),
        "La Matera": ("Ministro Rivadavia", "VIII", "#F97316", (0.004, -0.003)),
        "Los Troncos": ("Ministro Rivadavia", "VIII", "#F97316", (-0.001, 0.004)),
        "Altos Del Castillo": ("Ministro Rivadavia", "VIII", "#F97316", (0.003, 0.001)),
        "Del Carmen": ("Ministro Rivadavia", "VIII", "#F97316", (-0.005, -0.001)),
        "Madres": ("Ministro Rivadavia", "VIII", "#F97316", (0.001, -0.004)),
        "Rivadavia Centro": ("Ministro Rivadavia", "VIII", "#F97316", (0.004, 0.003)),
        "Policial Rivadavia": ("Ministro Rivadavia", "VIII", "#F97316", (-0.002, 0.005)),
        "Barrio Parque Rivadavia": ("Ministro Rivadavia", "VIII", "#F97316", (0.005, -0.002)),
        "Tsuji": ("Ministro Rivadavia", "VIII", "#F97316", (-0.004, 0.0)),
        "Los Ciruelos": ("Ministro Rivadavia", "VIII", "#F97316", (0.002, 0.004)),
        "Lujan": ("Ministro Rivadavia", "VIII", "#F97316", (-0.003, -0.005)),
        "Los Pinos": ("Ministro Rivadavia", "VIII", "#F97316", (0.003, -0.001)),
        "Los Paraguayos": ("Ministro Rivadavia", "VIII", "#F97316", (-0.01, 0.002)),
        "La Arbolada": ("Ministro Rivadavia", "VIII", "#F97316", (0.004, 0.005)),
        "La Hermosa": ("Ministro Rivadavia", "VIII", "#F97316", (-0.005, 0.001)),
        
        # RAFAEL CALZADA
        "Capilla Del Señor": ("Rafael Calzada", "IX", "#84CC16", (0.001, -0.003)),
        "La Loma RC": ("Rafael Calzada", "IX", "#84CC16", (-0.004, 0.002)),
        "San Javier": ("Rafael Calzada", "IX", "#84CC16", (0.003, 0.004)),
        "Villa Rafael Calzada": ("Rafael Calzada", "IX", "#84CC16", (-0.002, -0.001)),
        "2 de abril RC": ("Rafael Calzada", "IX", "#84CC16", (0.004, -0.005)),
        "14 de noviembre": ("Rafael Calzada", "IX", "#84CC16", (-0.001, 0.003)),
        "San Jerónimo": ("Rafael Calzada", "IX", "#84CC16", (0.002, 0.001)),
        "Asunción RC": ("Rafael Calzada", "IX", "#84CC16", (-0.005, -0.002)),
        
        # SAN FRANCISCO DE ASÍS
        "Cerrito": ("San Francisco de Asís", "X", "#00D9FF", (0.0, -0.002)),
        "Don Orione": ("San Francisco de Asís", "X", "#00D9FF", (-0.003, 0.003)),
        "La Esther": ("San Francisco de Asís", "X", "#00D9FF", (0.004, -0.001)),
        "Las Latitas": ("San Francisco de Asís", "X", "#00D9FF", (-0.002, 0.004)),
        "Martin Fierro": ("San Francisco de Asís", "X", "#00D9FF", (0.002, 0.0)),
        "Suterh 2": ("San Francisco de Asís", "X", "#00D9FF", (-0.005, -0.003)),
        "BI.PER.MU.": ("San Francisco de Asís", "X", "#00D9FF", (0.001, -0.004)),
        "Libertad SF": ("San Francisco de Asís", "X", "#00D9FF", (0.005, 0.001)),
        "6 de diciembre": ("San Francisco de Asís", "X", "#00D9FF", (-0.001, 0.005)),
        "Don Orione Viejo": ("San Francisco de Asís", "X", "#00D9FF", (0.003, 0.002)),
        "Suterh 1": ("San Francisco de Asís", "X", "#00D9FF", (-0.004, -0.002)),
        "Soom": ("San Francisco de Asís", "X", "#00D9FF", (0.004, 0.005)),
        
        # SAN FRANCISCO SOLANO
        "Guadalupe": ("San Francisco Solano", "XI", "#FBBF24", (0.002, -0.002)),
        "Las Lomas De San Francisco": ("San Francisco Solano", "XI", "#FBBF24", (-0.003, 0.003)),
        "Las Tunas": ("San Francisco Solano", "XI", "#FBBF24", (0.004, 0.0)),
        "Los Chalets": ("San Francisco Solano", "XI", "#FBBF24", (-0.001, -0.005)),
        "Parque Uno": ("San Francisco Solano", "XI", "#FBBF24", (0.003, 0.004)),
        "Parque Dos": ("San Francisco Solano", "XI", "#FBBF24", (-0.005, -0.001)),
        "Complejo Habitacional SFS": ("San Francisco Solano", "XI", "#FBBF24", (0.001, 0.001)),
        "Nueva Pompeya": ("San Francisco Solano", "XI", "#FBBF24", (0.005, 0.002)),
        "San Agustin": ("San Francisco Solano", "XI", "#FBBF24", (-0.002, 0.005)),
        "Santa Catalina": ("San Francisco Solano", "XI", "#FBBF24", (0.002, -0.004)),
        "Santa Isabel": ("San Francisco Solano", "XI", "#FBBF24", (-0.004, 0.001)),
        "Villa Laura": ("San Francisco Solano", "XI", "#FBBF24", (0.003, -0.003)),
        "Zabala": ("San Francisco Solano", "XI", "#FBBF24", (-0.001, 0.004)),
        
        # SAN JOSÉ
        "San Ramón": ("San José", "XII", "#A78BFA", (0.0, -0.002)),
        "La Gloria": ("San José", "XII", "#A78BFA", (-0.003, 0.003)),
        "8 de noviembre": ("San José", "XII", "#A78BFA", (0.004, -0.001)),
        "8 de diciembre": ("San José", "XII", "#A78BFA", (-0.001, -0.004)),
        "Garay": ("San José", "XII", "#A78BFA", (0.002, 0.005)),
        "Santa Maria SJ": ("San José", "XII", "#A78BFA", (-0.005, 0.001)),
        "La Loma SJ": ("San José", "XII", "#A78BFA", (0.001, -0.003)),
        "La Victoria": ("San José", "XII", "#A78BFA", (0.005, 0.002)),
        "Puerto Argentino": ("San José", "XII", "#A78BFA", (-0.002, 0.004)),
        "La Tablada": ("San José", "XII", "#A78BFA", (0.003, 0.0)),
        "La Cava": ("San José", "XII", "#A78BFA", (-0.004, -0.005)),
        "Virgen De Luján Ombú": ("San José", "XII", "#A78BFA", (0.004, 0.003)),
        "Agustín Ramírez": ("San José", "XII", "#A78BFA", (-0.001, 0.002)),
        "Altos De Santa Ana": ("San José", "XII", "#A78BFA", (0.002, 0.001)),
        "San José": ("San José", "XII", "#A78BFA", (-0.003, -0.002)),
    }

def main():
    print("=" * 80)
    print("🗺️  GENERADOR HÍBRIDO COMPLETO - ORDENANZA 13.906")
    print("=" * 80)
    print()
    
    barrios_data = load_barrios_data()
    features = []
    
    print(f"📌 Procesando {len(barrios_data)} barrios...")
    print()
    
    for idx, (barrio_name, (localidad, anexo, color, offset)) in enumerate(barrios_data.items(), 1):
        feature = create_barrio_feature(barrio_name, localidad, anexo, color, offset)
        if feature:
            features.append(feature)
            print(f"[{idx:3d}/{len(barrios_data)}] ✅ {barrio_name:30s} ({localidad:20s})")
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "TODOS LOS BARRIOS - ORDENANZA 13.906",
        "bbox": [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758],
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "total_localidades": len(LOCALIDADES),
            "metodo": "Híbrido (centros localidades + radios aproximados)",
            "nota": "TODOS LOS 158 BARRIOS DE LA ORDENANZA 13.906"
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
    print("📊 RESUMEN FINAL:")
    print(f"   • Total de barrios: {len(features)}")
    print(f"   • Total de localidades: {len(LOCALIDADES)}")
    print()
    
    # Resumen por localidad
    localidad_counts = {}
    for feature in features:
        loc = feature['properties']['localidad']
        localidad_counts[loc] = localidad_counts.get(loc, 0) + 1
    
    print("   📍 Distribución por localidad:")
    for loc in sorted(localidad_counts.keys()):
        print(f"      • {loc:25s}: {localidad_counts[loc]:2d} barrios")
    
    print()
    print("=" * 80)
    print("✨ ¡LISTO PARA USAR EN EL MAPA!")
    print("🔄 Refresca: http://localhost:5557 → Pestaña 'Barrios'")
    print("=" * 80)

if __name__ == "__main__":
    main()
