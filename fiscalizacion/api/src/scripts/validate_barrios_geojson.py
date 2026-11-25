#!/usr/bin/env python3
"""
Script de validación y análisis del archivo limites_barrios_brown.geojson
Útil para inspeccionar la estructura y contenido del archivo generado.
"""

import json
from pathlib import Path
from typing import Dict, List


class GeoJSONValidator:
    """Valida y analiza archivos GeoJSON."""
    
    def __init__(self, filepath: str | Path):
        self.filepath = Path(filepath)
        self.data = None
        self.errors = []
        self.warnings = []
        
        self._load()
    
    def _load(self):
        """Carga el archivo GeoJSON."""
        if not self.filepath.exists():
            self.errors.append(f"Archivo no encontrado: {self.filepath}")
            return
        
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"JSON inválido: {str(e)}")
        except Exception as e:
            self.errors.append(f"Error al leer archivo: {str(e)}")
    
    def validate_structure(self) -> bool:
        """Valida que el GeoJSON tenga la estructura básica correcta."""
        if not self.data:
            return False
        
        # Debe ser un FeatureCollection
        if self.data.get('type') != 'FeatureCollection':
            self.errors.append(f"type debe ser 'FeatureCollection', encontrado: {self.data.get('type')}")
            return False
        
        # Debe tener features
        if 'features' not in self.data:
            self.errors.append("Falta el campo 'features'")
            return False
        
        if not isinstance(self.data['features'], list):
            self.errors.append("'features' debe ser una lista")
            return False
        
        if len(self.data['features']) == 0:
            self.warnings.append("No hay features en el FeatureCollection")
        
        return True
    
    def validate_features(self) -> bool:
        """Valida cada feature del GeoJSON."""
        if not self.data or 'features' not in self.data:
            return False
        
        all_valid = True
        for idx, feature in enumerate(self.data['features']):
            if not isinstance(feature, dict):
                self.errors.append(f"Feature {idx}: no es un objeto")
                all_valid = False
                continue
            
            # Validar estructura base
            if feature.get('type') != 'Feature':
                self.errors.append(f"Feature {idx}: type debe ser 'Feature'")
                all_valid = False
            
            if 'geometry' not in feature:
                self.errors.append(f"Feature {idx}: falta 'geometry'")
                all_valid = False
            elif feature['geometry'].get('type') != 'Polygon':
                self.errors.append(f"Feature {idx}: geometry debe ser Polygon")
                all_valid = False
            
            # Validar que el polígono esté cerrado
            if 'geometry' in feature and 'coordinates' in feature['geometry']:
                coords = feature['geometry']['coordinates']
                if coords and isinstance(coords[0], list):
                    ring = coords[0]
                    if ring and ring[0] != ring[-1]:
                        idx_feat = feature.get('properties', {}).get('nombre', f'Feature {idx}')
                        self.warnings.append(f"{idx_feat}: Polígono no está cerrado")
        
        return all_valid
    
    def get_statistics(self) -> Dict:
        """Obtiene estadísticas sobre el GeoJSON."""
        stats = {
            'total_features': 0,
            'total_points': 0,
            'barrios_por_localidad': {},
            'bbox': self.data.get('bbox') if self.data else None,
        }
        
        if not self.data or 'features' not in self.data:
            return stats
        
        stats['total_features'] = len(self.data['features'])
        
        for feature in self.data['features']:
            if 'properties' in feature:
                localidad = feature['properties'].get('localidad', 'Desconocida')
                nombre = feature['properties'].get('nombre', 'Sin nombre')
                
                if localidad not in stats['barrios_por_localidad']:
                    stats['barrios_por_localidad'][localidad] = []
                
                stats['barrios_por_localidad'][localidad].append(nombre)
            
            if 'geometry' in feature and 'coordinates' in feature['geometry']:
                coords = feature['geometry']['coordinates']
                if coords and isinstance(coords[0], list):
                    # -1 porque el último punto es igual al primero (cierre)
                    stats['total_points'] += max(0, len(coords[0]) - 1)
        
        return stats
    
    def print_report(self):
        """Imprime un reporte completo de validación."""
        print("\n" + "="*70)
        print("📋 REPORTE DE VALIDACIÓN: limites_barrios_brown.geojson")
        print("="*70)
        
        if self.errors:
            print(f"\n❌ ERRORES ({len(self.errors)}):")
            for error in self.errors:
                print(f"   - {error}")
            return
        
        print("\n✅ ESTRUCTURA VÁLIDA")
        
        if self.warnings:
            print(f"\n⚠️  ADVERTENCIAS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        # Estadísticas
        stats = self.get_statistics()
        print(f"\n📊 ESTADÍSTICAS:")
        print(f"   - Total de features (barrios): {stats['total_features']}")
        print(f"   - Puntos totales del perímetro: {stats['total_points']}")
        if stats['bbox']:
            lon_min, lat_min, lon_max, lat_max = stats['bbox']
            print(f"   - Bounding Box: [{lon_min:.4f}, {lat_min:.4f}] a [{lon_max:.4f}, {lat_max:.4f}]")
        
        print(f"\n🏘️  BARRIOS POR LOCALIDAD:")
        for localidad, barrios in sorted(stats['barrios_por_localidad'].items()):
            print(f"\n   {localidad} ({len(barrios)} barrios):")
            for barrio in sorted(barrios):
                print(f"      • {barrio}")
        
        # URLs de visualización
        print(f"\n🌐 VISUALIZACIÓN:")
        print(f"   1. En línea: https://geojson.io/")
        print(f"      (Copia y pega el contenido de limites_barrios_brown.geojson)")
        print(f"\n   2. Con Folium (Python):")
        print(f"      ```python")
        print(f"      import folium, json")
        print(f"      with open('limites_barrios_brown.geojson') as f:")
        print(f"          geojson_data = json.load(f)")
        print(f"      m = folium.Map([...], zoom_start=12)")
        print(f"      folium.GeoJson(geojson_data).add_to(m)")
        print(f"      m.save('mapa.html')")
        print(f"      ```")
        
        print("\n" + "="*70)


def main():
    """Función principal."""
    # Buscar el archivo en ubicaciones comunes
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
        print("❌ No se encontró limites_barrios_brown.geojson")
        print("\nUbicaciones buscadas:")
        for path in possible_paths:
            print(f"   - {path}")
        print("\n⚠️  Primero debes ejecutar: generate_barrios_geojson.py")
        return
    
    print(f"📂 Validando: {geojson_file}\n")
    
    validator = GeoJSONValidator(geojson_file)
    
    # Validar
    validator.validate_structure()
    validator.validate_features()
    
    # Reporte
    validator.print_report()


if __name__ == "__main__":
    main()
