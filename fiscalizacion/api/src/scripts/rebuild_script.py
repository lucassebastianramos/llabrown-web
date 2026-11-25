import json
import codecs

with codecs.open('clean_dict.txt', 'r', 'utf-8') as f:
    dict_content = f.read()

logic = """
# ==============================================================================
# MOTOR GEOCODIFICADOR ESTRATÉGICO (OSMnx + OpenCage)
# ==============================================================================

class GeolocalizadorEstrategico:
    def __init__(self, api_key: str):
        self.geocoder = Nominatim(user_agent="brown_geocoder_v2")
        self.cache_bounds = {}
        
        self.G = None
        self.edges_gdf = None
        self.nodes_gdf = None
        self.usar_osmnx = True
        self.municipio_geom = None
        
        self.alias_calles = {
            "san martin": "avenida general san martín",
            "perón": "avenida presidente juan domingo perón",
            "eva perón": "avenida eva perón",
            "héroe de malvinas": "avenida héroes de malvinas",
            "donato álvarez": "avenida donato álvarez",
            "donato alvarez": "avenida donato álvarez",
            "25 de mayo": "calle 25 de mayo",
            "granada nicolás": "nicolás granada",
            "córdoba rufino": "rufino córdoba",
            "30 de septiembre": "30 de septiembre",
            "villarruel": "Villaruel",
            "pcia. de b.a.": "Provincia de Buenos Aires",
            "pcia. de santa fe": "Provincia de Santa Fe",
            "rep. argentina": "República Argentina",
            "av. tomas espora": "Avenida Tomás Espora",
            "r. de escalada": "Remedios de Escalada de San Martín",
            "vías fc": "Vías del Ferrocarril",
            "vías fc roca": "Vías del Ferrocarril General Roca",
            "vías ffcc": "Vías del Ferrocarril",
            "vías ex ffcc": "Vías del Ferrocarril",
            "límite adm. exp. 240": "",
            "depósito cattorini": "Avenida Tomás Espora",
            "cattorini": "Avenida Tomás Espora",
            "17 de octubre": "17 de Octubre",
            "rp 4": "ruta provincial 4",
            "rp 16": "ruta provincial 16",
            "rp 210": "ruta provincial 210",
            "colectora monteverde": "avenida monteverde"
        }
        self.init_osmnx()

    def init_osmnx(self):
        graph_file = "brown_graph.graphml"
        logging.info("Inicializando motor local OSMnx...")
        ox.settings.log_console = False
        
        try:
            self.G = ox.load_graphml(graph_file)
            logging.info(f"Red cargada: {len(self.G.nodes)} nodos, {len(self.G.edges)} calles.")
        except Exception as e:
            logging.error(f"Error cargando el grafo: {e}. Desactivando OSMnx.")
            self.usar_osmnx = False
            return
            
        try:
            self.nodes_gdf, self.edges_gdf = ox.graph_to_gdfs(self.G)
        except Exception as e:
            logging.warning("No se pudo extraer GeoDataFrames.")
            self.usar_osmnx = False

    def remove_accents(self, input_str):
        if not isinstance(input_str, str): return ""
        return unicodedata.normalize('NFKD', input_str).encode('ASCII', 'ignore').decode('utf-8')

    def clean_street_name(self, name: str) -> List[str]:
        name_clean = self.remove_accents(name.lower())
        words = re.findall(r'[a-z0-9]+', name_clean)
        ignore = {'avenida', 'calle', 'pasaje', 'ruta', 'provincial', 'nacional', 'del', 'los', 'las', 'de', 'la', 'el', 'y', 'e', 'desde'}
        keywords = [w for w in words if w not in ignore and len(w) > 2]
        return keywords if keywords else words

    def normalizar_calle(self, calle: str) -> str:
        calle = calle.lower().strip()
        for alias, real in self.alias_calles.items():
            if calle == alias or calle.startswith(alias + " "):
                calle = calle.replace(alias, real)
        return calle

    def geocode_intersection_osmnx(self, calle1: str, calle2: str, prev_coord=None):
        if not self.usar_osmnx or self.edges_gdf is None: return None
        
        calle1 = self.normalizar_calle(calle1)
        calle2 = self.normalizar_calle(calle2)
        
        k1 = self.clean_street_name(calle1)
        k2 = self.clean_street_name(calle2)
        
        def match_keywords(name, keywords):
            if not isinstance(name, str): return False
            n = self.remove_accents(name.lower())
            return any(k in n or n in k for k in keywords)

        e1 = self.edges_gdf[self.edges_gdf['name'].apply(lambda n: match_keywords(n, k1) if isinstance(n, str) else (any(match_keywords(x, k1) for x in n) if isinstance(n, list) else False))]
        e2 = self.edges_gdf[self.edges_gdf['name'].apply(lambda n: match_keywords(n, k2) if isinstance(n, str) else (any(match_keywords(x, k2) for x in n) if isinstance(n, list) else False))]

        nodes1 = set(e1.index.get_level_values('u')).union(set(e1.index.get_level_values('v')))
        nodes2 = set(e2.index.get_level_values('u')).union(set(e2.index.get_level_values('v')))
        intersection = list(nodes1.intersection(nodes2))
        
        if intersection:
            if len(intersection) > 1:
                if prev_coord:
                    best_node = None
                    min_dist = float('inf')
                    for node_id in intersection:
                        point = self.nodes_gdf.loc[node_id]
                        dist = (point.y - prev_coord[0])**2 + (point.x - prev_coord[1])**2
                        if dist < min_dist:
                            min_dist = dist
                            best_node = node_id
                    node_id = best_node
                else:
                    node_id = intersection[0]
            else:
                node_id = intersection[0]
            point = self.nodes_gdf.loc[node_id]
            return (point.y, point.x)
            
        return None

    def geocode_intersection(self, calle1: str, calle2: str, localidad: str = "", prev_coord: Optional[Tuple[float, float]] = None) -> Optional[Tuple[float, float]]:
        res = self.geocode_intersection_osmnx(calle1, calle2, prev_coord)
        if res: return res
        
        calle1 = self.normalizar_calle(calle1)
        calle2 = self.normalizar_calle(calle2)
        
        b1 = self.geocode_street(calle1, localidad)
        b2 = self.geocode_street(calle2, localidad)
        if not b1 or not b2: return None
        
        intersection_bbox = [
            max(b1[0], b2[0]),
            max(b1[1], b2[1]),
            min(b1[2], b2[2]),
            min(b1[3], b2[3])
        ]
        
        if intersection_bbox[0] > intersection_bbox[2] or intersection_bbox[1] > intersection_bbox[3]:
            return None
            
        lat = (intersection_bbox[0] + intersection_bbox[2]) / 2
        lon = (intersection_bbox[1] + intersection_bbox[3]) / 2
        return (lat, lon)

    def geocode_street(self, street: str, localidad: str = "") -> Optional[List[float]]:
        query = f"{street}, {localidad}, {MUNICIPIO}" if localidad else f"{street}, {MUNICIPIO}"
        if query in self.cache_bounds:
            return self.cache_bounds[query]
            
        import time
        time.sleep(1.1)
        try:
            res = self.geocoder.geocode(query, viewbox=[(BBOX[1], BBOX[0]), (BBOX[3], BBOX[2])], bounded=1)
            if res and res.raw and 'boundingbox' in res.raw:
                bbox_str = res.raw['boundingbox']
                bbox = [float(bbox_str[0]), float(bbox_str[2]),
                        float(bbox_str[1]), float(bbox_str[3])]
                self.cache_bounds[query] = bbox
                return bbox
        except Exception as e:
            return None
        return None


# ==============================================================================
# PROCESAMIENTO Y PARSEO
# ==============================================================================

def parse_calles_stateful(texto: str, calle_actual: str):
    texto_original = texto.strip()
    texto = texto.lower()
    
    if texto.startswith("desde "):
        texto = texto.replace("desde ", "", 1).strip()
    if texto.startswith("la intersección de "):
        texto = texto.replace("la intersección de ", "", 1).strip()
        
    if "por " in texto and "hasta " in texto:
        t = texto.replace("por ", "").replace("hasta ", " y ")
        parts = re.split(r'\s+y\s+|\s+e\s+', t)
        if len(parts) >= 2:
            return parts[0].strip(), parts[1].strip(), parts[1].strip()
            
    if texto.startswith("hasta "):
        t = texto.replace("hasta ", "").strip()
        return calle_actual, t, t
        
    parts = re.split(r'\s+y\s+|\s+e\s+', texto)
    if len(parts) >= 2:
        return parts[0].strip(), parts[1].strip(), parts[1].strip()
        
    return None, None, calle_actual

def cargar_limite_municipio():
    try:
        if Path("brown_limites.geojson").exists():
            gdf = gpd.read_file("brown_limites.geojson")
            return gdf.geometry.unary_union
    except Exception as e:
        logging.error(f"No se pudo cargar el lÃ­mite municipal: {e}")
    return None

def recortar_poligono_al_municipio(poligono: geom.Polygon, municipio_geom: geom.Polygon) -> geom.Polygon:
    if municipio_geom is None or not poligono.is_valid:
        return poligono
    try:
        interseccion = poligono.intersection(municipio_geom)
        if interseccion.is_empty:
            return poligono
        if isinstance(interseccion, geom.MultiPolygon):
            areas = [p.area for p in interseccion.geoms]
            return interseccion.geoms[areas.index(max(areas))]
        return interseccion
    except Exception as e:
        logging.warning(f"Error recortando polÃ­gono: {e}")
        return poligono

def procesar_barrios():
    api_key = "c79b0067911a4855adcff309fb6eec19"
    motor = GeolocalizadorEstrategico(api_key)
    motor.municipio_geom = cargar_limite_municipio()

    geojson_completo = {
        "type": "FeatureCollection",
        "features": []
    }

    for anexo, info in DATOS_ORDENANZA.items():
        localidad = info["localidad"]
        last_localidad_coord = None
        logging.info(f"--- Iniciando procesamiento: {anexo} - {localidad} ---")
        
        for barrio, limites in info["barrios"].items():
            logging.info(f"Procesando barrio: {barrio}")
            
            limites_limpios = limites.rstrip('.')
            intersecciones = [i.strip() for i in re.split(r'[;,]', limites_limpios) if i.strip()]
            
            coordenadas_poligono = []
            calle_actual = ""
            prev_coord = last_localidad_coord
            
            for i, inter in enumerate(intersecciones):
                c1, c2, calle_actual = parse_calles_stateful(inter, calle_actual)
                if c1 and c2:
                    coord = motor.geocode_intersection(c1, c2, localidad, prev_coord)
                    if coord:
                        coordenadas_poligono.append((coord[1], coord[0]))
                        prev_coord = coord
                        last_localidad_coord = coord
                    else:
                        logging.warning(f"No se encontrÃ³ la intersecciÃ³n: '{inter}' para el barrio {barrio}")
            
            if len(coordenadas_poligono) >= 3:
                coordenadas_poligono.append(coordenadas_poligono[0])
                poligono = geom.Polygon(coordenadas_poligono)
                
                if not poligono.is_valid:
                    poligono = poligono.buffer(0)
                    if not poligono.is_valid:
                        logging.warning(f"El polÃ­gono para {barrio} es invÃ¡lido despuÃ©s del buffer.")
                        continue
                        
                poligono_final = recortar_poligono_al_municipio(poligono, motor.municipio_geom)
                
                if isinstance(poligono_final, geom.MultiPolygon):
                    areas = [p.area for p in poligono_final.geoms]
                    poligono_final = poligono_final.geoms[areas.index(max(areas))] if areas else poligono_final
                
                vertices_finales = list(poligono_final.exterior.coords) if isinstance(poligono_final, geom.Polygon) else []
                
                logging.info(f"PolÃ­gono generado y recortado para {barrio} con {len(vertices_finales)} vÃ©rtices.")
                
                feature = {
                    "type": "Feature",
                    "properties": {
                        "nombre": barrio,
                        "localidad": localidad,
                        "anexo": anexo
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [vertices_finales]
                    }
                }
                geojson_completo["features"].append(feature)
            else:
                logging.warning(f"El barrio {barrio} no obtuvo suficientes coordenadas vÃ¡lidas para formar un polÃ­gono (Obtenidas: {len(coordenadas_poligono)}).")
                
    archivo_salida = "brown_completo.geojson"
    with open(archivo_salida, "w", encoding="utf-8") as f:
        json.dump(geojson_completo, f, ensure_ascii=False, indent=2)

    logging.info(f"=== Procesamiento completado. Archivo '{archivo_salida}' generado exitosamente. ===")
    
    # Copiar al frontend
    import shutil
    import os
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public'))
    target_file = os.path.join(target_dir, 'limites_barrios_brown_completo.geojson')
    try:
        shutil.copy(archivo_salida, target_file)
        logging.info(f"Archivo copiado exitosamente a: {target_file}")
    except Exception as e:
        logging.error(f"Error copiando archivo al frontend: {e}")

if __name__ == "__main__":
    procesar_barrios()
"""

header = """#!/usr/bin/env python3
import json
import time
from typing import Dict, List, Tuple, Optional
import time
import requests
import re
import unicodedata
import logging
from pathlib import Path

import geopandas as gpd
import shapely.geometry as geom
import osmnx as ox
import networkx as nx
from geopy.geocoders import Nominatim

MUNICIPIO = "Almirante Brown, Buenos Aires, Argentina"
BBOX = [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("errores_geocodificacion.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

"""

with codecs.open('procesador_barrios_13906.py', 'w', 'utf-8') as f:
    f.write(header + "\n" + dict_content + "\n" + logic)
