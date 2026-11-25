#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEOLOCALIZADOR ESTRATÉGICO - FASE 1 (OpenCage Bounding Boxes)
Este script implementa la intersección matemática de cajas envolventes (Bounding Boxes)
para hallar esquinas de calles sin necesidad de que el geocodificador entienda intersecciones.
"""

import sys
import time
import math
import os
from typing import Dict, List, Tuple, Optional
try:
    from geopy.geocoders import OpenCage
    import osmnx as ox
    import networkx as nx
except ImportError:
    print("Por favor instala: pip install geopy shapely osmnx")
    exit(1)

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_KEY = "c79b0067911a4855adcff309fb6eec19"
MUNICIPIO = "Almirante Brown"
PROVINCIA = "Buenos Aires"
PAIS = "Argentina"

BBOX_BROWN = {
    "min_lat": -34.909867, "max_lat": -34.754280,
    "min_lng": -58.447793, "max_lng": -58.292393
}

class GeolocalizadorEstrategico:
    def __init__(self, api_key: str):
        self.geocoder = OpenCage(api_key)
        self.cache_bounds = {}
        
        # OSMnx (Fase 2)
        self.G = None
        self.edges_gdf = None
        self.nodes_gdf = None
        self.usar_osmnx = True
        self.init_osmnx()

    def init_osmnx(self):
        graph_file = "brown_graph.graphml"
        print("Inicializando motor local OSMnx...")
        ox.settings.log_console = False
        ox.settings.use_cache = True
        
        try:
            if not os.path.exists(graph_file):
                print("  Descargando mapa de calles (esto tomará ~30 segs, solo la primera vez)...")
                self.G = ox.graph_from_place("Partido de Almirante Brown, Buenos Aires, Argentina", network_type='drive')
                ox.save_graphml(self.G, graph_file)
            else:
                self.G = ox.load_graphml(graph_file)
                
            # Extraer gdfs para búsquedas rápidas
            self.nodes_gdf, self.edges_gdf = ox.graph_to_gdfs(self.G)
            print(f"  [✓] Red cargada: {len(self.G.nodes)} nodos, {len(self.G.edges)} calles.")
        except Exception as e:
            print(f"  [!] Error cargando OSMnx: {e}")
            self.usar_osmnx = False

    def geocode_street(self, calle: str) -> Optional[Dict]:
        """Geocodifica una calle y devuelve su Bounding Box"""
        calle = calle.strip()
        if calle in self.cache_bounds:
            return self.cache_bounds[calle]
        
        query = f"{calle}, {MUNICIPIO}, {PROVINCIA}, {PAIS}"
        
        try:
            # Usar countrycode='ar' o no limitations directas, geopy pasa query al motor
            result = self.geocoder.geocode(query)
            
            if result and 'bounds' in result.raw:
                b = result.raw['bounds']
                # Construimos nuestro formato interno
                bbox = {
                    'min_lat': b['southwest']['lat'],
                    'max_lat': b['northeast']['lat'],
                    'min_lng': b['southwest']['lng'],
                    'max_lng': b['northeast']['lng']
                }
                
                # Expandimos minimamente (buffer de ~50m) porque a veces OpenCage 
                # devuelve bounding boxes muy estrictos que no se tocan por poco.
                # 0.0005 grados son aprox 55 metros.
                bbox['min_lat'] -= 0.0005
                bbox['max_lat'] += 0.0005
                bbox['min_lng'] -= 0.0005
                bbox['max_lng'] += 0.0005

                self.cache_bounds[calle] = bbox
                return bbox
            elif result and 'geometry' in result.raw:
                # Si solo devuelve un punto sin bounds, le creamos un buffer (~100m)
                lat = result.raw['geometry']['lat']
                lng = result.raw['geometry']['lng']
                bbox = {
                    'min_lat': lat - 0.001,
                    'max_lat': lat + 0.001,
                    'min_lng': lng - 0.001,
                    'max_lng': lng + 0.001
                }
                self.cache_bounds[calle] = bbox
                return bbox

        except Exception as e:
            print(f"Error OpenCage en {calle}: {e}")
            
        self.cache_bounds[calle] = None
        return None

    def clean_street_name(self, calle: str) -> List[str]:
        """Extrae las palabras clave más significativas del nombre de una calle"""
        ignore = ["presidente", "dr", "doctor", "gral", "general", "tte", "teniente", "av", "avenida", "calle", "pte", "arturo", "don", "san", "santa"]
        words = calle.lower().replace('.', '').split()
        keywords = [w for w in words if w not in ignore and len(w) > 2]
        return keywords if keywords else words # Si filtró todo, devuelve original

    def geocode_intersection_osmnx(self, calle1: str, calle2: str) -> Optional[Tuple[float, float]]:
        if not self.usar_osmnx or self.edges_gdf is None:
            return None
            
        k1 = self.clean_street_name(calle1)
        k2 = self.clean_street_name(calle2)
        
        def match_keywords(name, keywords):
            if not isinstance(name, str):
                if isinstance(name, list):
                    return any(all(k in str(n).lower() for k in keywords) for n in name)
                return False
            name_lower = name.lower()
            return all(k in name_lower for k in keywords)

        edges1 = self.edges_gdf[self.edges_gdf['name'].fillna('').apply(lambda n: match_keywords(n, k1))]
        edges2 = self.edges_gdf[self.edges_gdf['name'].fillna('').apply(lambda n: match_keywords(n, k2))]
        
        if edges1.empty or edges2.empty:
            return None
            
        nodes1 = set(edges1.index.get_level_values('u')).union(set(edges1.index.get_level_values('v')))
        nodes2 = set(edges2.index.get_level_values('u')).union(set(edges2.index.get_level_values('v')))
        
        common = nodes1.intersection(nodes2)
        if not common:
            return None
            
        node_id = list(common)[0]
        point = self.nodes_gdf.loc[node_id]
        return (point.y, point.x)

    def geocode_intersection(self, calle1: str, calle2: str) -> Optional[Tuple[float, float]]:
        """Calcula punto donde se cruzan dos Bounding Boxes, o usa OSMnx"""
        
        # Primero intentamos con precisión 100% (OSMnx)
        if self.usar_osmnx:
            res = self.geocode_intersection_osmnx(calle1, calle2)
            if res:
                print("      [Motor: OSMnx - Precisión Exacta]")
                return res
        
        b1 = self.geocode_street(calle1)
        b2 = self.geocode_street(calle2)
        
        if not b1 or not b2:
            return None
            
        # Calcular intersección de los dos rectángulos
        inter_min_lat = max(b1['min_lat'], b2['min_lat'])
        inter_max_lat = min(b1['max_lat'], b2['max_lat'])
        inter_min_lng = max(b1['min_lng'], b2['min_lng'])
        inter_max_lng = min(b1['max_lng'], b2['max_lng'])
        
        # Verificamos si se solapan o hay una diferencia aceptable (fuzzy math)
        if inter_min_lat <= inter_max_lat and inter_min_lng <= inter_max_lng:
            # ¡Se intersectan! Devolvemos el centro geográfico del área de intersección
            lat = (inter_min_lat + inter_max_lat) / 2.0
            lng = (inter_min_lng + inter_max_lng) / 2.0
            print("      [Motor: OpenCage - Aproximación por Bounding Box]")
            return (lat, lng)
            
        return None

def main():
    print("=" * 80)
    print("★ GEOCODIFICADOR ESTRATÉGICO - FASE 1 ★")
    print("  Usando: OpenCage API + Bounding Box Math")
    print("=" * 80)
    print()
    
    geo = GeolocalizadorEstrategico(api_key=API_KEY)
    
    # Extraído de BARRIOS_PRECISOS para demostración
    test_intersections = [
        ("Estrada", "Arturo Illia"),
        ("Roque Sáenz Peña", "Videla"),
        ("Primera Junta", "Roque Sáenz Peña"),
        ("Arturo Illia", "Emilio Mitre"),
        ("Perón", "Espora")
    ]
    
    encontradas = 0
    for c1, c2 in test_intersections:
        print(f"Buscando intersección: {c1} y {c2}...")
        coords = geo.geocode_intersection(c1, c2)
        
        if coords:
            print(f"  [✓] ¡Intersección hallada!: ({coords[0]:.6f}, {coords[1]:.6f})")
            encontradas += 1
        else:
            print(f"  [✗] No se logró solapar las cajas de ambas calles.")
            
    print("\n" + "=" * 80)
    print(f"RESUMEN: {encontradas} de {len(test_intersections)} intersecciones localizadas.")
    print("=" * 80)

if __name__ == "__main__":
    main()
