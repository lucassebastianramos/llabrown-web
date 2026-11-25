#!/usr/bin/env python3
"""
Script para generar limites_barrios_brown.geojson basado en la Ordenanza N° 13.906
de Almirante Brown, Buenos Aires.

Convierte descripciones textuales de límites de barrios en polígonos GeoJSON
utilizando geocodificación desde OpenStreetMap (Nominatim).

Requisitos previos:
    pip install geopy geojson
"""

import json
import re
import time
from typing import List, Dict, Tuple, Optional
from pathlib import Path
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError


# Configuración
MUNICIPALITY = "Almirante Brown, Buenos Aires, Argentina"
OUTPUT_FILE = Path(__file__).parent.parent.parent.parent / "limites_barrios_brown.geojson"
CACHE_FILE = Path(__file__).parent / "geocode_cache.json"
NOMINATIM_USER_AGENT = "barrios-brown-geocoder/1.0"
DELAY_BETWEEN_REQUESTS = 1  # segundos (respetar TOS de Nominatim)


class BarrioDefinition:
    """Define un barrio con su nombre, localidad y descripción de límites."""
    
    def __init__(self, nombre: str, localidad: str, descripcion: str):
        self.nombre = nombre
        self.localidad = localidad
        self.descripcion = descripcion


class GeocodeCache:
    """Cache simple para evitar re-geocodificar las mismas calles."""
    
    def __init__(self, cache_file: Path):
        self.cache_file = cache_file
        self.data = self._load()
    
    def _load(self) -> Dict:
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def save(self):
        """Persiste el cache a disco."""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def get(self, key: str) -> Optional[Dict]:
        return self.data.get(key)
    
    def set(self, key: str, value: Dict):
        self.data[key] = value
        self.save()


class BarrioGeocoder:
    """Convierte descripciones textuales de barrios en polígonos GeoJSON."""
    
    def __init__(self, user_agent: str = NOMINATIM_USER_AGENT):
        self.geocoder = Nominatim(user_agent=user_agent)
        self.cache = GeocodeCache(CACHE_FILE)
        self.features = []
        self.errors = []
    
    def geocode_intersection(self, street1: str, street2: str) -> Optional[Tuple[float, float]]:
        """
        Geocodifica una intersección de dos calles.
        
        Por limitaciones de OSM, buscamos un punto que represente la intersección
        usando una query combinada.
        
        Args:
            street1: Primera calle
            street2: Segunda calle
        
        Returns:
            Tupla (latitude, longitude) o None si falla la geocodificación
        """
        # Normalizar nombres
        street1 = street1.strip()
        street2 = street2.strip()
        
        # Cache key
        cache_key = f"{street1} & {street2}"
        cached = self.cache.get(cache_key)
        if cached:
            return tuple(cached) if cached else None
        
        try:
            # Query: tratar como "y" = intersección
            query = f"{street1} y {street2}, {MUNICIPALITY}"
            print(f"  📍 Geocodificando: {query}")
            
            location = self.geocoder.geocode(
                query,
                timeout=10,
                exactly_one=True,
                language='es'
            )
            
            if location:
                coords = (location.latitude, location.longitude)
                self.cache.set(cache_key, list(coords))
                print(f"     ✓ Encontrado en ({location.latitude:.6f}, {location.longitude:.6f})")
                return coords
            else:
                print(f"     ✗ No encontrado")
                self.errors.append(f"No se geocodificó: {query}")
                return None
        
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            msg = f"Error de geocodificación para '{cache_key}': {str(e)}"
            print(f"     ✗ {msg}")
            self.errors.append(msg)
            return None
        finally:
            time.sleep(DELAY_BETWEEN_REQUESTS)
    
    def parse_barrio_description(self, descripcion: str) -> List[str]:
        """
        Extrae pares de calles de la descripción del barrio.
        
        Ejemplo de input:
            "Juan Manuel Estrada y Pte. Arturo Illia; por Illia hasta Av. Tomás Espora; 
             por Espora hasta Pte. Juan Domingo Perón; ..."
        
        Returns:
            Lista de tuplas (calle1, calle2) que representan intersecciones
        """
        # Limpiar la descripción
        descripcion = descripcion.replace('\n', ' ').strip()
        
        # Expresión regular para encontrar pares: "X y Y" o después de "por X hasta Y"
        pairs = []
        
        # Primer par: "CALLE1 y CALLE2"
        match_inicio = re.search(r'^([^;]+?)\s+y\s+([^;]+?);', descripcion)
        if match_inicio:
            calle1 = match_inicio.group(1).strip()
            calle2 = match_inicio.group(2).strip()
            pairs.append((calle1, calle2))
        
        # Pares subsecuentes: "por CALLEX hasta CALLEY"
        pattern = r'por\s+([^;]+?)\s+hasta\s+([^;]+?)(?:;|$)'
        matches = re.finditer(pattern, descripcion)
        
        for match in matches:
            calle_from = match.group(1).strip()
            calle_to = match.group(2).strip()
            pairs.append((calle_from, calle_to))
        
        return pairs
    
    def generate_barrio_polygon(self, barrio: BarrioDefinition) -> Optional[Dict]:
        """
        Genera los puntos de un polígono para un barrio.
        
        Args:
            barrio: Instancia de BarrioDefinition
        
        Returns:
            Dict con Feature GeoJSON o None si hay error
        """
        print(f"\n🏘️  Procesando: {barrio.nombre} ({barrio.localidad})")
        print(f"    Descripción: {barrio.descripcion[:80]}...")
        
        # Extraer pares de calles
        pairs = self.parse_barrio_description(barrio.descripcion)
        if not pairs:
            msg = f"No se pudieron extraer pares de calles para {barrio.nombre}"
            print(f"    ✗ {msg}")
            self.errors.append(msg)
            return None
        
        print(f"    Pares encontrados: {len(pairs)}")
        
        # Geocodificar cada intersección
        coordinates = []
        for street1, street2 in pairs:
            coords = self.geocode_intersection(street1, street2)
            if coords:
                # GeoJSON usa [longitude, latitude]
                coordinates.append([coords[1], coords[0]])
        
        if not coordinates:
            msg = f"No se geocodificó ninguna intersección para {barrio.nombre}"
            print(f"    ✗ {msg}")
            self.errors.append(msg)
            return None
        
        # Cerrar el polígono (primer punto = último punto)
        if coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
        
        print(f"    ✓ Polígono generado con {len(coordinates) - 1} puntos")
        
        # Crear Feature GeoJSON
        feature = {
            "type": "Feature",
            "properties": {
                "nombre": barrio.nombre,
                "localidad": barrio.localidad,
                "descripcion": barrio.descripcion
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coordinates]
            }
        }
        
        return feature
    
    def generate_geojson(self, barrios: List[BarrioDefinition]) -> Dict:
        """
        Genera un FeatureCollection GeoJSON con todos los barrios.
        
        Args:
            barrios: Lista de BarrioDefinition
        
        Returns:
            FeatureCollection GeoJSON
        """
        self.features = []
        self.errors = []
        
        for barrio in barrios:
            feature = self.generate_barrio_polygon(barrio)
            if feature:
                self.features.append(feature)
        
        # Construir FeatureCollection
        feature_collection = {
            "type": "FeatureCollection",
            "name": "Barrios - Almirante Brown (Ordenanza N° 13.906)",
            "features": self.features
        }
        
        # Agregar bbox si hay features
        if self.features:
            lats = []
            lons = []
            for feature in self.features:
                coords = feature['geometry']['coordinates'][0]
                for lon, lat in coords:
                    lats.append(lat)
                    lons.append(lon)
            
            feature_collection['bbox'] = [
                min(lons), min(lats), max(lons), max(lats)
            ]
        
        return feature_collection
    
    def save_geojson(self, geojson: Dict, output_file: Path):
        """Guarda el GeoJSON a archivo."""
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Archivo guardado: {output_file}")
    
    def report_errors(self):
        """Imprime informe de errores."""
        if self.errors:
            print(f"\n⚠️  Se encontraron {len(self.errors)} errores:")
            for error in self.errors:
                print(f"   - {error}")
        else:
            print("\n✅ Sin errores de geocodificación")


# ============================================================================
# DATOS SEGÚN ORDENANZA N° 13.906
# ============================================================================

BARRIOS_ANEXO_I_ADROGUÉ = [
    BarrioDefinition(
        nombre="Barrio Vattuone",
        localidad="Adrogué",
        descripcion="Juan Manuel Estrada y Pte. Arturo Illia; por Illia hasta Av. Tomás Espora; por Espora hasta Pte. Juan Domingo Perón; por Perón hasta Diego de Villarruel; por Villarruel hasta Juan Manuel Estrada."
    ),
    BarrioDefinition(
        nombre="Adrogué Centro",
        localidad="Adrogué",
        descripcion="Av. Hipólito Yrigoyen y Pte. Perón; por Yrigoyen hasta Amenedo; por Amenedo hasta Gral. Frías; por Frías hasta Av. Segurola; por Segurola hasta Erezcano; por Erezcano hasta Pte. Perón; por Perón hasta Av. Espora; por Espora hasta Arturo Illia; por Illia hasta Estrada; por Estrada hasta Villarruel; por Villarruel hasta Pte. Perón; por Perón hasta Yrigoyen."
    ),
]

BARRIOS_ANEXO_II_BURZACO = [
    BarrioDefinition(
        nombre="Barrio Corimayo",
        localidad="Burzaco",
        descripcion="Hugo del Carril y Av. Espora; por Espora hasta Araujo; por Araujo hasta Av. Rep. Argentina; por Rep. Argentina hasta Hugo del Carril."
    ),
    BarrioDefinition(
        nombre="Barrio Las Rosas",
        localidad="Burzaco",
        descripcion="Carlos Gardel y Av. 2 de Abril; por 2 de Abril hasta Av. Rep. Argentina; por Rep. Argentina hasta Hugo del Carril; por Hugo del Carril hasta Carlos Gardel."
    ),
    BarrioDefinition(
        nombre="Burzaco Centro",
        localidad="Burzaco",
        descripcion="Av. Hipólito Yrigoyen y Pte. Perón; por Perón hasta Av. Espora; por Espora hasta Juan B. Azopardo; por Azopardo hasta Paraguay; por Paraguay hasta Pte. Perón; por Perón hasta Amelia Angonelli; por Angonelli hasta Humberto Primo; por Humberto Primo hasta Terrero; por Terrero hasta Adolfo Alsina; por Alsina hasta Pcia. de B.A.; por Pcia. de B.A. hasta Av. 2 de Abril; por 2 de Abril hasta Av. Espora; por Espora hasta Rotonda del Vapor; por Av. Monteverde hasta Roca; por Roca hasta Adolfo Alsina; por Alsina hasta Av. Yrigoyen."
    ),
]

BARRIOS_ANEXO_III_CLAYPOLE = [
    BarrioDefinition(
        nombre="Claypole Este",
        localidad="Claypole",
        descripcion="Av. Billinghurst y Humberto Primo; por Humberto Primo hasta Irupé; por Irupé hasta Av. Lacaze; por Lacaze hasta Av. 17 de Octubre; por 17 de Octubre hasta Catedral; por Catedral hasta R. de Escalada; por R. de Escalada hasta Juan José Paso; por Paso hasta Av. 17 de Octubre."
    ),
    BarrioDefinition(
        nombre="Barrio El Trébol",
        localidad="Claypole",
        descripcion="Celedonio Flores y Humberto Primo; por Humberto Primo hasta R. de Escalada; por R. de Escalada hasta Juan José Paso; por Paso hasta R. de Escalada; por R. de Escalada hasta Adolfo Alsina; por Alsina hasta Celedonio Flores."
    ),
]

BARRIOS_ANEXO_IV_GLEW = [
    BarrioDefinition(
        nombre="Barrio Gendarmería",
        localidad="Glew",
        descripcion="Av. Tomás Espora y Sgto. 1ro. Fernando Leyes; por Leyes hasta Gendarme Adolfo Romero; por Romero hasta Coronel Conde; por Conde hasta Av. Espora."
    ),
    BarrioDefinition(
        nombre="Glew Centro Lado Oeste",
        localidad="Glew",
        descripcion="Patria y Raúl Soldi; por Soldi hasta Gral. Mitre; por Mitre hasta Av. Hipólito Yrigoyen; por Yrigoyen hasta Patria."
    ),
]

# TODO: Agregar ANEXOS V-XII según sea necesario
TODOS_LOS_BARRIOS = (
    BARRIOS_ANEXO_I_ADROGUÉ +
    BARRIOS_ANEXO_II_BURZACO +
    BARRIOS_ANEXO_III_CLAYPOLE +
    BARRIOS_ANEXO_IV_GLEW
)


# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    """Función principal."""
    print("="*70)
    print("Generador de Límites de Barrios - Almirante Brown")
    print("Ordenanza Municipal N° 13.906")
    print("="*70)
    
    geocoder = BarrioGeocoder()
    
    print(f"\n📊 Procesando {len(TODOS_LOS_BARRIOS)} barrios...")
    print(f"🗺️  Geocodificador: Nominatim (OpenStreetMap)")
    print(f"📍 Área de búsqueda: {MUNICIPALITY}\n")
    
    # Generar GeoJSON
    geojson = geocoder.generate_geojson(TODOS_LOS_BARRIOS)
    
    # Estadísticas
    print("\n" + "="*70)
    print(f"📈 RESUMEN:")
    print(f"   - Barrios procesados: {len(geocoder.features)}/{len(TODOS_LOS_BARRIOS)}")
    print(f"   - Features en GeoJSON: {len(geojson['features'])}")
    
    # Guarda el archivo
    geocoder.save_geojson(geojson, OUTPUT_FILE)
    
    # Reporte de errores
    geocoder.report_errors()
    print("="*70)


if __name__ == "__main__":
    main()
