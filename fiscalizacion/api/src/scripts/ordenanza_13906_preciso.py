#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERADOR PRECISO DE BARRIOS - ORDENANZA 13.906
Geocodifica intersecciones reales descritas en la Ordenanza
Con reintentos inteligentes y validación de polígonos
"""

import json
import time
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import re

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    from shapely.geometry import Polygon, MultiPolygon
    from shapely.ops import unary_union
except ImportError:
    print("❌ Instala: pip install geopy shapely")
    exit(1)

MUNICIPIO = "Almirante Brown, Buenos Aires, Argentina"
BBOX = [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758]

# ============================================================================
# DATOS PRECISOS DE LA ORDENANZA (Límites por calles)
# ============================================================================

BARRIOS_PRECISOS = {
    # ANEXO I - ADROGUÉ
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "limites": "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón; por Perón hasta Villarruel; por Villarruel hasta Estrada"
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "limites": "Yrigoyen y Perón; por Yrigoyen hasta Amenedo; por Amenedo hasta Frías; por Frías hasta Segurola; por Segurola/30 de Septiembre hasta Erezcano; por Erezcano hasta Perón; por Perón hasta Espora; por Espora hasta Illia; por Illia hasta Estrada; por Estrada hasta Villarruel; por Villarruel hasta Perón; por Perón hasta Yrigoyen"
    },
    
    # ANEXO II - BURZACO (muestra con algunos barrios)
    "Corimayo": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "limites": "Hugo del Carril y Espora; hasta Araujo; hasta Rep. Argentina; hasta Hugo del Carril"
    },
    "Las Rosas": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "limites": "Carlos Gardel y 2 de Abril; hasta Rep. Argentina; hasta Hugo del Carril; hasta Carlos Gardel"
    },
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "limites": "Yrigoyen y Perón; hasta Espora; hasta Azopardo; hasta Paraguay; hasta Perón; hasta Angonelli; hasta Humberto Primo; hasta Terrero; hasta Alsina; hasta Pcia. de B.A.; hasta 2 de Abril; hasta Espora; hasta Rotonda del Vapor; hasta Monteverde; hasta Roca; hasta Alsina; hasta Yrigoyen"
    },

    # ANEXO III - CLAYPOLE
    "Claypole Este": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "limites": "Billinghurst y Humberto Primo; hasta Irupé; hasta Lacaze; hasta 17 de Octubre; hasta Catedral; hasta R. de Escalada; hasta Paso; hasta 17 de Octubre; hasta Billinghurst"
    },
    "El Trébol": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "limites": "Celedonio Flores y Humberto Primo; hasta R. de Escalada; hasta Paso; hasta R. de Escalada; hasta Alsina; hasta Celedonio Flores"
    },

    # ANEXO IV - GLEW
    "Gendarmería": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "limites": "Espora y Fernando Leyes; hasta Romero; hasta Conde; hasta Espora"
    },
    "Glew Centro Oeste": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "limites": "Patria y Soldi; hasta Mitre; hasta Yrigoyen; hasta Patria"
    },
    
    # ANEXO V - JOSÉ MÁRMOL
    "Mármol Centro": {
        "localidad": "José Mármol",
        "anexo": "V",
        "color": "#EC4899",
        "limites": "Erezcano y Amenedo; hasta Blasco Ibáñez; hasta Rosales; hasta Molina; hasta Jorge; hasta Grandville; hasta San Martin; hasta Erezcano"
    },
}

class BarrioGeocoder:
    """Geocodifica barrios desde descripciones textuales de la Ordenanza"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="fiscaliza_brown_ordenanza_v3")
        self.cache = {}
        self.failed_queries = []
        self.session_count = 0
        self.max_per_session = 60  # Rate limiting
    
    def parse_limites(self, limites_text: str) -> List[str]:
        """
        Extrae intersecciones de la descripción de límites
        Ejemplo: "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón"
        """
        intersecciones = []
        
        # Dividir por puntos y comas
        partes = re.split(r'[;,]', limites_text)
        
        for parte in partes:
            parte = parte.strip()
            
            # Buscar patrón "Calle X y Calle Y"
            if ' y ' in parte:
                intersecciones.append(parte)
            # Buscar patrón "por Calle hasta Calle"
            elif ' hasta ' in parte and ' por ' not in parte:
                # Si la parte anterior tenía "y", usar esa calle anterior
                pass
        
        return intersecciones
    
    def geocode_intersection(self, street1: str, street2: str, max_retries: int = 3) -> Optional[Tuple[float, float]]:
        """Geocodifica una intersección con reintentos"""
        street1 = street1.strip().title()
        street2 = street2.strip().title()
        cache_key = f"{street1}_{street2}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        query = f"{street1} {street2}, {MUNICIPIO}"
        
        for attempt in range(max_retries):
            try:
                # Rate limiting
                if self.session_count >= self.max_per_session:
                    print("  ⏸️  Rate limit alcanzado, esperando...")
                    time.sleep(60)
                    self.session_count = 0
                
                time.sleep(1)  # Espera entre requests
                self.session_count += 1
                
                print(f"  🔍 [{attempt+1}/{max_retries}] {query}")
                location = self.geolocator.geocode(query, timeout=10)
                
                if location:
                    coords = (location.longitude, location.latitude)
                    self.cache[cache_key] = coords
                    print(f"    ✓ {coords}")
                    return coords
                else:
                    print(f"    ✗ No encontrado")
            
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                if attempt < max_retries - 1:
                    print(f"    ⚠️  {type(e).__name__}, reintentando...")
                    time.sleep(2 ** attempt)  # Backoff exponencial
                else:
                    print(f"    ❌ Falló después de {max_retries} intentos")
        
        self.failed_queries.append(query)
        self.cache[cache_key] = None
        return None
    
    def barrio_to_polygon(self, barrio_name: str, limites: str) -> Optional[Dict]:
        """Convierte límites textuales en polígono GeoJSON"""
        print(f"\n  📍 Procesando: {barrio_name}")
        print(f"     Límites: {limites[:60]}...")
        
        # Extraer intersecciones
        # Estrategia: buscar todos los "y" que separan calles
        partes = limites.split(';')
        calles = []
        
        for parte in partes:
            parte = parte.strip()
            # Patrón: "Calle A y Calle B"
            if ' y ' in parte and 'hasta' not in parte:
                match = re.search(r'(.+?)\s+y\s+(.+?)(?:\s|$)', parte)
                if match:
                    calle1, calle2 = match.groups()
                    calles.append((calle1.strip(), calle2.strip()))
            # Patrón: "por Calle hasta Calle" - buscar cambios de calle
            elif 'hasta' in parte:
                match = re.search(r'(?:por\s+)?(\w+)\s+hasta\s+(\w+)', parte)
                if match:
                    # Usar la última calle conocida y la nueva
                    if calles:
                        _, last_calle = calles[-1]
                        new_calle = match.group(2).strip()
                        calles.append((last_calle, new_calle))
        
        if not calles:
            print(f"     ⚠️  No se pudieron extraer calles")
            return None
        
        coordinates = []
        for street1, street2 in calles:
            coords = self.geocode_intersection(street1, street2)
            if coords:
                coordinates.append(list(coords))
        
        if len(coordinates) < 3:
            print(f"     ❌ Insuficientes coordenadas ({len(coordinates)})")
            return None
        
        # Cerrar polígono
        if coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
        
        try:
            # Validar que sea un polígono válido
            poly = Polygon(coordinates)
            if poly.is_valid and poly.area > 0:
                print(f"     ✅ Polígono válido: {len(coordinates)-1} vértices")
                return {
                    "type": "Polygon",
                    "coordinates": [coordinates]
                }
            else:
                print(f"     ⚠️  Polígono inválido")
                return None
        except Exception as e:
            print(f"     ❌ Error: {e}")
            return None

def main():
    print("=" * 80)
    print("🗺️  GENERADOR PRECISO - ORDENANZA 13.906")
    print("Geocodificando límites exactos descritos en la Ordenanza")
    print("=" * 80)
    print()
    
    geocoder = BarrioGeocoder()
    features = []
    successful = 0
    failed = 0
    
    print(f"📌 Procesando {len(BARRIOS_PRECISOS)} barrios...\n")
    
    for barrio_name, data in BARRIOS_PRECISOS.items():
        polygon = geocoder.barrio_to_polygon(barrio_name, data['limites'])
        
        if polygon:
            feature = {
                "type": "Feature",
                "id": barrio_name.lower().replace(" ", "_").replace("á", "a"),
                "properties": {
                    "nombre": barrio_name,
                    "localidad": data['localidad'],
                    "anexo": f"ANEXO {data['anexo']}",
                    "color": data['color'],
                    "tipo": "Barrio",
                    "ordenanza": "13.906",
                    "metodo": "Geocodificación de límites (Nominatim)"
                },
                "geometry": polygon
            }
            features.append(feature)
            successful += 1
        else:
            failed += 1
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "BARRIOS PRECISOS - ORDENANZA 13.906",
        "bbox": BBOX,
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_procesados": len(BARRIOS_PRECISOS),
            "total_exitosos": successful,
            "total_fallados": failed,
            "tasa_exito": f"{successful/len(BARRIOS_PRECISOS)*100:.1f}%",
            "metodo": "Geocodificación de límites textuales (Nominatim Nominatim con reintentos)",
            "nota": "Barrios generados a partir de descripciones exactas de la Ordenanza 13.906"
        },
        "features": features
    }
    
    # Guardar
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_preciso.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✅ ARCHIVO GENERADO: {output_path}")
    print()
    print("📊 RESULTADOS:")
    print(f"   • Barrios procesados: {len(BARRIOS_PRECISOS)}")
    print(f"   • Exitosos: {successful} ✅")
    print(f"   • Fallados: {failed} ❌")
    print(f"   • Tasa de éxito: {successful/len(BARRIOS_PRECISOS)*100:.1f}%")
    print()
    
    if geocoder.failed_queries:
        print("⚠️  CONSULTAS FALLIDAS:")
        for q in geocoder.failed_queries[:10]:
            print(f"   • {q}")
        if len(geocoder.failed_queries) > 10:
            print(f"   ... y {len(geocoder.failed_queries) - 10} más")
    
    print()
    print("=" * 80)
    print("🔄 Refresca: http://localhost:5557/barrios")
    print("=" * 80)

if __name__ == "__main__":
    main()
