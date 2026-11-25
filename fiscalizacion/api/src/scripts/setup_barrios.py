#!/usr/bin/env python3
"""
Script de configuración rápida para el generador de barrios GeoJSON
Instala todas las dependencias necesarias.
"""

import subprocess
import sys
from pathlib import Path


def run_command(cmd: list, description: str) -> bool:
    """Ejecuta un comando y retorna True si tiene éxito."""
    print(f"\n📦 {description}...")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"   ✅ OK")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Error: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"   ❌ Comando no encontrado: {cmd[0]}")
        return False


def main():
    """Función principal."""
    print("="*70)
    print("🚀 CONFIGURACIÓN - Generador de Barrios GeoJSON")
    print("="*70)
    print("\nEste script instalará las dependencias requeridas.\n")
    
    # Verificar Python
    print(f"🐍 Python versión: {sys.version}")
    if sys.version_info < (3, 8):
        print("❌ Se requiere Python 3.8 o superior")
        sys.exit(1)
    print("   ✅ Versión compatible")
    
    # Instalar dependencias
    all_ok = True
    
    all_ok &= run_command(
        [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
        "Actualizando pip"
    )
    
    all_ok &= run_command(
        [sys.executable, "-m", "pip", "install", "geopy"],
        "Instalando geopy (geocodificación)"
    )
    
    all_ok &= run_command(
        [sys.executable, "-m", "pip", "install", "geojson"],
        "Instalando geojson"
    )
    
    all_ok &= run_command(
        [sys.executable, "-m", "pip", "install", "folium"],
        "Instalando folium (visualización en mapas)"
    )
    
    print("\n" + "="*70)
    if all_ok:
        print("✅ ¡CONFIGURACIÓN COMPLETADA!")
        print("="*70)
        print("\n📚 Próximos pasos:\n")
        print("1️⃣  Genera el GeoJSON:")
        print("    python api/src/scripts/generate_barrios_geojson.py\n")
        print("2️⃣  Valida el resultado:")
        print("    python api/src/scripts/validate_barrios_geojson.py\n")
        print("3️⃣  Visualiza en un mapa (opcional):")
        print("    python api/src/scripts/visualize_barrios_map.py\n")
        print("="*70)
    else:
        print("❌ CONFIGURACIÓN INCOMPLETA")
        print("="*70)
        print("\nIntenta instalar manualmente:")
        print("  pip install geopy geojson folium")
        sys.exit(1)


if __name__ == "__main__":
    main()
