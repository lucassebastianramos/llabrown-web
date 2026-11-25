#!/usr/bin/env python3
"""
GENERADOR COMPLETO DE BARRIOS - ORDENANZA 13.906 ALMIRANTE BROWN
Geocodifica y genera limites_barrios_brown_completo.geojson
Con todos los 158 barrios de los 12 anexos
"""

import json
import time
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict
import re

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    import shapely.geometry as geom
    from shapely.ops import unary_union
except ImportError:
    print("❌ Instala dependencias: pip install geopy shapely")
    exit(1)

MUNICIPIO = "Almirante Brown, Buenos Aires, Argentina"
BBOX = [-58.447793760992305, -34.90986784518467, -58.29239338925479, -34.75428071637758]

# ============================================================================
# DATOS COMPLETOS DE LA ORDENANZA
# ============================================================================

BARRIOS_DATA = {
    # ANEXO I - ADROGUÉ
    "Barrio Vattuone": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "vertices": [
            "Estrada y Arturo Illia",
            "Arturo Illia y Espora",
            "Espora y Perón",
            "Perón y Villarruel",
            "Villarruel y Estrada",
        ]
    },
    "Adrogué Centro": {
        "localidad": "Adrogué",
        "anexo": "I",
        "color": "#EF4444",
        "vertices": [
            "Yrigoyen y Perón",
            "Perón y Amenedo",
            "Amenedo y Frías",
            "Frías y Segurola",
            "Segurola y 30 de Septiembre",
            "30 de Septiembre y Erezcano",
            "Erezcano y Perón",
            "Perón y Espora",
            "Espora y Illia",
            "Illia y Estrada",
            "Estrada y Villarruel",
            "Villarruel y Perón",
            "Perón y Yrigoyen",
        ]
    },

    # ANEXO II - BURZACO
    "Corimayo": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Hugo del Carril y Espora", "Espora y Araujo", "Araujo y Rep. Argentina", "Rep. Argentina y Hugo del Carril"]
    },
    "Las Rosas": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Carlos Gardel y 2 de Abril", "2 de Abril y Rep. Argentina", "Rep. Argentina y Hugo del Carril", "Hugo del Carril y Carlos Gardel"]
    },
    "Primera Junta": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Espora y 2 de Abril", "2 de Abril y Carlos Gardel", "Carlos Gardel y Hugo del Carril", "Hugo del Carril y Espora"]
    },
    "Roca": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Espora y límites adm. Parcela 5/6", "Parcela 5/6 y Ávila Gregoria", "Ávila Gregoria y Monteverde", "Monteverde y Espora"]
    },
    "Don Alejandro": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Yrigoyen y Alsina", "Alsina y Roca", "Roca y Monteverde", "Monteverde y Yrigoyen"]
    },
    "Burzaco Centro": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": [
            "Yrigoyen y Perón",
            "Perón y Espora",
            "Espora y Azopardo",
            "Azopardo y Paraguay",
            "Paraguay y Perón",
            "Perón y Angonelli",
            "Angonelli y Humberto Primo",
            "Humberto Primo y Terrero",
            "Terrero y Alsina",
            "Alsina y Pcia. de B.A.",
            "Pcia. de B.A. y 2 de Abril",
            "2 de Abril y Espora",
            "Espora y Rotonda del Vapor",
            "Rotonda del Vapor y Monteverde",
            "Monteverde y Roca",
            "Roca y Alsina",
            "Alsina y Yrigoyen",
        ]
    },
    "La Carlota": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Yrigoyen y Monteverde", "Monteverde y Vallejos", "Vallejos y Ida Rebori", "Ida Rebori y Yrigoyen"]
    },
    "Sakura": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Vallejos y Monteverde", "Monteverde y Japón", "Japón y Combate de Monte Santiago", "Combate de Monte Santiago y Yrigoyen", "Yrigoyen y Ida Rebori", "Ida Rebori y Vallejos"]
    },
    "Luz y Fuerza": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Espora y Perón", "Perón y Paraguay", "Paraguay y Azopardo", "Azopardo y Espora"]
    },
    "Lomas de Burzaco": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Erezcano y Humberto Primo", "Humberto Primo y Angonelli", "Angonelli y Perón", "Perón y Erezcano"]
    },
    "El Gaucho": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Terrero y Humberto Primo", "Humberto Primo y Rep. Argentina", "Rep. Argentina y 2 de Abril", "2 de Abril y Pcia. de B.A.", "Pcia. de B.A. y Alsina", "Alsina y Terrero"]
    },
    "El Hornero": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Guatambú y José Melián", "José Melián y Buenos Aires", "Buenos Aires y Cuyo", "Cuyo y Guatambú"]
    },
    "La Cumbre": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Drago y Diómede", "Diómede y Buenos Aires", "Buenos Aires y Juan XXIII", "Juan XXIII y Drago"]
    },
    "La Primavera": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Ituzaingó y Prieto", "Prieto y Soler", "Soler y Prieto", "Prieto y Yrigoyen", "Yrigoyen y Eva Perón", "Eva Perón y Ituzaingó"]
    },
    "La Pilarica": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Ingenieros y Petiribi", "Petiribi y Drago", "Drago y Arenales", "Arenales y Ingenieros"]
    },
    "La Lucy": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Soler y Diómede", "Diómede y Yrigoyen", "Yrigoyen y Prieto", "Prieto y Soler"]
    },
    "Almafuerte": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Monteverde y José Melián", "José Melián y Derqui", "Derqui y Yrigoyen", "Yrigoyen y Monteverde"]
    },
    "Ciudad Oculta": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Asamblea y Prieto", "Prieto y Bradley", "Bradley y Prieto", "Prieto y Ituzaingó", "Ituzaingó y Eva Perón", "Eva Perón y Bradley", "Bradley y Eva Perón", "Eva Perón y Asamblea", "Asamblea y Prieto"]
    },
    "San Pablo": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Buenos Aires y Prieto", "Prieto y Asamblea", "Asamblea y Eva Perón", "Eva Perón y Derqui", "Derqui y José Melian", "José Melian y Buenos Aires"]
    },
    "El Recuerdo": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Derqui y Eva Perón", "Eva Perón y Bradley", "Bradley y Eva Perón", "Eva Perón y Yrigoyen", "Yrigoyen y Derqui"]
    },
    "Arzeno": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Buenos Aires y Diómede", "Diómede y Bradley", "Bradley y Prieto", "Prieto y Buenos Aires"]
    },
    "Parque Industrial": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": [
            "Rep. Argentina y Petiribi",
            "Petiribi y Ingenieros",
            "Ingenieros y Arenales",
            "Arenales y Drago",
            "Drago y Juan XXIII",
            "Juan XXIII y Buenos Aires",
            "Buenos Aires y Colectora Monteverde",
            "Colectora Monteverde y Melian",
            "Melian y Guatambú",
            "Guatambú y Cuyo",
            "Cuyo y Buenos Aires",
            "Buenos Aires y Monteverde",
            "Monteverde y Rotonda Los Pinos",
            "Rotonda Los Pinos y Yrigoyen",
            "Yrigoyen y Fonrouge",
            "Fonrouge y Rep. Argentina",
            "Rep. Argentina y Petiribi",
        ]
    },
    "Solis": {
        "localidad": "Burzaco",
        "anexo": "II",
        "color": "#F59E0B",
        "vertices": ["Diomede y Bradley", "Bradley y Soler", "Soler y Prieto", "Prieto y Bradley"]
    },

    # ANEXO III - CLAYPOLE
    "Claypole Este": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Billinghurst y Humberto Primo", "Humberto Primo y Irupé", "Irupé y Lacaze", "Lacaze y 17 de Octubre", "17 de Octubre y Catedral", "Catedral y R. de Escalada", "R. de Escalada y Paso", "Paso y 17 de Octubre", "17 de Octubre y Billinghurst"]
    },
    "El Trébol": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Celedonio Flores y Humberto Primo", "Humberto Primo y R. de Escalada", "R. de Escalada y Paso", "Paso y R. de Escalada", "R. de Escalada y Alsina", "Alsina y Celedonio Flores"]
    },
    "Horizonte": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Irupé y Humberto Primo", "Humberto Primo y Rawson", "Rawson y Lacaze", "Lacaze y Irupé"]
    },
    "La Jovita": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Irupé y Lacaze", "Lacaze y Rawson", "Rawson y Monteverde", "Monteverde y Irupé"]
    },
    "Mariano Moreno": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["San Luis Orione y Alsina", "Alsina y Cabral", "Cabral y Monteverde", "Monteverde y San Luis Orione"]
    },
    "Medalla Milagrosa": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Libertad y Humberto Primo", "Humberto Primo y San Francisco de Asis", "San Francisco de Asis y Alsina", "Alsina y Libertad"]
    },
    "Barrio Parque": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["R. de Escalada y Humberto Primo", "Humberto Primo y Billinghurst", "Billinghurst y 17 de Octubre", "17 de Octubre y Paso", "Paso y R. de Escalada"]
    },
    "Sáenz": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["San Francisco de Asís y Humberto Primo", "Humberto Primo y Celedonio Flores", "Celedonio Flores y Alsina", "Alsina y San Francisco de Asís"]
    },
    "San Lucas": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Rep. Argentina y Alsina", "Alsina y San Luis Orione", "San Luis Orione y Monteverde", "Monteverde y Rep. Argentina"]
    },
    "San Luis": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Cabral y Alsina", "Alsina y San Francisco de Asis", "San Francisco de Asis y Monteverde", "Monteverde y Cabral"]
    },
    "Sideco": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Paso y Lacaze", "Lacaze y Esquiú", "Esquiú y Monteverde", "Monteverde y Paso"]
    },
    "Claypole Oeste": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["San Francisco de Asís y Alsina", "Alsina y R. de Escalada", "R. de Escalada y Catedral", "Catedral y 17 de Octubre", "17 de Octubre y Lacaze", "Lacaze y Marconi", "Marconi y Monteverde", "Monteverde y San Francisco de Asis"]
    },
    "Santa Clara": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["San Luis y Falucho", "Falucho y Rawson", "Rawson y Humberto Primo", "Humberto Primo y San Luis"]
    },
    "El Triángulo": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Esquiú y Lacaze", "Lacaze y Irupé", "Irupé y Monteverde", "Monteverde y Esquiú"]
    },
    "Loma de Burzaco": {
        "localidad": "Claypole",
        "anexo": "III",
        "color": "#3B82F6",
        "vertices": ["Rep. Argentina y Humberto Primo", "Humberto Primo y Libertad", "Libertad y Alsina", "Alsina y Rep. Argentina"]
    },

    # ANEXO IV - GLEW
    "Gendarmería": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espora y Fernando Leyes", "Fernando Leyes y Romero", "Romero y Conde", "Conde y Espora"]
    },
    "El Triunfo": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espora y Conde", "Conde y Romero", "Romero y Gallardo", "Gallardo y Espora"]
    },
    "Kanmar": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espora y Raúl Espoile", "Raúl Espoile y Castillo", "Castillo y Gerchunoff", "Gerchunoff y Espora"]
    },
    "600 Viviendas": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espora y Mazzini", "Mazzini y San Ignacio", "San Ignacio y Espoile", "Espoile y Espora"]
    },
    "Santa Rosa": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espora y Garibaldi", "Garibaldi y San Ignacio", "San Ignacio y Mazzini", "Mazzini y Espora"]
    },
    "Santa Ana": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Garibaldi y Arias", "Arias y Espoile", "Espoile y San Ignacio", "San Ignacio y Garibaldi"]
    },
    "Las Calandrias": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Almafuerte y Capitán Olivera", "Capitán Olivera y López y Planes", "López y Planes y Hernández", "Hernández y Parravicini", "Parravicini y Almafuerte"]
    },
    "Villa París": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yapeyú y Arias", "Arias y Gervasio Méndez", "Gervasio Méndez y Newbery", "Newbery y Montevideo", "Montevideo y Longchamps", "Longchamps y Yapeyú"]
    },
    "Ombú": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yapeyú y Arias", "Arias y Montevideo", "Montevideo y Ovidio Lagos", "Ovidio Lagos y Yapeyú"]
    },
    "Ipona": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Mitre", "Mitre y Soldi", "Soldi y Capitán Olivera", "Capitán Olivera y Yrigoyen"]
    },
    "Los Aromos": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Industria", "Industria y Uspallata", "Uspallata y Patria", "Patria y Yrigoyen"]
    },
    "Telepostal": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Padre Pio", "Padre Pio y Uspallata", "Uspallata y Industria", "Industria y Yrigoyen"]
    },
    "UPCN": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Pcia. de Santa Fe", "Pcia. de Santa Fe y FC Roca", "FC Roca y Padre Pio", "Padre Pio y Yrigoyen"]
    },
    "El Castillo Las Heras": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Las Heras", "Las Heras y La Aviación", "La Aviación y Pcia. de Santa Fe", "Pcia. de Santa Fe y Yrigoyen"]
    },
    "Los Álamos": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Pcia. de Santa Fe", "Pcia. de Santa Fe y Gordillo", "Gordillo y Payró", "Payró y Manuela Pedraza y Los Pinos", "Manuela Pedraza y Las Heras", "Las Heras y Yrigoyen"]
    },
    "COTEPA": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Pcia. de Santa Fe", "Pcia. de Santa Fe y Pedraza", "Pedraza y Iglesias", "Iglesias y Yrigoyen"]
    },
    "Parque Roma": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y San Urbano", "San Urbano y San Roque", "San Roque y Pcia. de Santa Fe", "Pcia. de Santa Fe y Buenos Aires", "Buenos Aires y Patagones", "Patagones y Argentina", "Argentina y Caseros", "Caseros y Yrigoyen"]
    },
    "OUCRA": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Beiró y San Urbano", "San Urbano y San Roque", "San Roque y Del Carril", "Del Carril y Franklin", "Franklin y Monroe", "Monroe y Beiró"]
    },
    "Gorritti": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y San Urbano", "San Urbano y Beiró", "Beiró y Monroe", "Monroe y Franklin", "Franklin y Del Carril", "Del Carril y San Roque", "San Roque y Capitán Olivera", "Capitán Olivera y Yrigoyen"]
    },
    "Progreso": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["RP 210 y Caseros", "Caseros y Argentina", "Argentina y Patagones", "Patagones y Buenos Aires", "Buenos Aires y Pcia. de Santa Fe", "Pcia. de Santa Fe y Pedraza", "Pedraza y Fleming", "Fleming y Yrigoyen", "Yrigoyen y RP 210"]
    },
    "El Trébol Glew": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Roger y Pedraza", "Pedraza y Payró", "Payró y Gordillo", "Gordillo y Pcia. de Santa Fe", "Pcia. de Santa Fe y San Roque", "San Roque y Roger"]
    },
    "Glew Centro Oeste": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Patria y Soldi", "Soldi y Mitre", "Mitre y Yrigoyen", "Yrigoyen y Patria"]
    },
    "Glew Centro Este": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Arias y Gervasio Méndez", "Gervasio Méndez y Newbery", "Newbery y Patria", "Patria y vías FC", "vías FC y López y Planes", "López y Planes y Hernández", "Hernández y Parravicini", "Parravicini y Almafuerte", "Almafuerte y Arias"]
    },
    "Almafuerte Glew": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Arias y Capitán Olivera", "Capitán Olivera y Castillo", "Castillo y Arreghini", "Arreghini y Arias"]
    },
    "SUPA": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Espoile y Castillo", "Castillo y Arreghini", "Arreghini y Mitre", "Mitre y Espoile"]
    },
    "COTEPA-PROGRESO": {
        "localidad": "Glew",
        "anexo": "IV",
        "color": "#10B981",
        "vertices": ["Yrigoyen y Iglesias", "Iglesias y Pedraza", "Pedraza y Fleming", "Fleming y Yrigoyen"]
    },

    # ANEXO V - JOSÉ MÁRMOL
    "Mármol Norte": {
        "localidad": "José Mármol",
        "anexo": "V",
        "color": "#EC4899",
        "vertices": ["King y 30 de Septiembre", "30 de Septiembre y Blasco Ibáñez", "Blasco Ibáñez y Amenedo", "Amenedo y King"]
    },
    "Mármol Centro": {
        "localidad": "José Mármol",
        "anexo": "V",
        "color": "#EC4899",
        "vertices": ["Erezcano y Amenedo", "Amenedo y Blasco Ibáñez", "Blasco Ibáñez y Rosales", "Rosales y Molina", "Molina y Jorge", "Jorge y Grandville", "Grandville y San Martin", "San Martin y Erezcano"]
    },
    "Barrio Arca": {
        "localidad": "José Mármol",
        "anexo": "V",
        "color": "#EC4899",
        "vertices": ["Erezcano y 30 de Septiembre", "30 de Septiembre y King", "King y Amenedo", "Amenedo y Erezcano"]
    },
    "Martin Arin": {
        "localidad": "José Mármol",
        "anexo": "V",
        "color": "#EC4899",
        "vertices": ["30 de Septiembre y San Juan", "San Juan y Jorge", "Jorge y Molina", "Molina y Rosales", "Rosales y Blasco Ibáñez", "Blasco Ibáñez y 30 de Septiembre"]
    },

    # ANEXO VI - LONGCHAMPS (Continúa...)
    "Altos de Longchamps": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Castillo y Yapeyú", "Yapeyú y Espora", "Espora y El Plata", "El Plata y Castillo"]
    },
    "Amancay": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Pcia. de B.A. y Los Cipreses", "Los Cipreses y Castillo", "Castillo y Montevideo", "Montevideo y Ovidio Lagos", "Ovidio Lagos y Yapeyú", "Yapeyú y Pcia. de B.A."]
    },
    "Ampliación Santa Rita": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Pedraza y Belgrano", "Belgrano y Alvear", "Alvear y Roger", "Roger y Pedraza"]
    },
    "Amutum 1": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Sarmiento y Tornquist", "Tornquist y Canalejas", "Canalejas y Lorenzini", "Lorenzini y Sarmiento"]
    },
    "Amutum 2 Santa Rita": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Castillo y Garin", "Garin y Canalejas", "Canalejas y Los Cipreses", "Los Cipreses y Castillo"]
    },
    "Campo Ramos": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Drago y Loedel Palumbo", "Loedel Palumbo y Yrigoyen", "Yrigoyen y Berlin", "Berlin y Alvear", "Alvear y Ascasubi", "Ascasubi y Drago"]
    },
    "Casablanca": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Languenhein y Diehl", "Diehl y San Ignacio", "San Ignacio y Tornquist", "Tornquist y Languenhein"]
    },
    "Don Luis": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Mitre y Beltrame", "Beltrame y Castillo", "Castillo y Los Cipreses", "Los Cipreses y Mitre"]
    },
    "Doña Sol": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["RP 16 y Patagones", "Patagones y Yrigoyen", "Yrigoyen y Esteban Arce", "Esteban Arce y RP 16"]
    },
    "El Triángulo Longchamps": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Chiesa y Ascasubi", "Ascasubi y Quintana", "Quintana y Boulogne Sur Mer", "Boulogne Sur Mer y Chiesa"]
    },
    "Esperanza": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Yrigoyen y Finochietto", "Finochietto y Ávila Gregoria", "Ávila Gregoria y Posadas", "Posadas y Olavarria", "Olavarria y Loedel Palumbo", "Loedel Palumbo y Yrigoyen"]
    },
    "Ferroviario": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Yrigoyen y Motti de Tieghi", "Motti de Tieghi y Chiesa", "Chiesa y Roger", "Roger y Parodi", "Parodi y Yrigoyen"]
    },
    "Jorge Newbery": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Alvear y Parodi", "Parodi y Yrigoyen", "Yrigoyen y Roger", "Roger y Alvear"]
    },
    "La Carmen": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Pedraza y Roger", "Roger y Yrigoyen", "Yrigoyen y Las Heras", "Las Heras y Los Pinos", "Los Pinos y Pedraza"]
    },
    "Las Lilas": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Canalejas y Las Heras", "Las Heras y Espora", "Espora y Yapeyú", "Yapeyú y Canalejas"]
    },
    "Los Frutales": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["RP 16 y Posadas", "Posadas y Drago y Alvear", "Drago y Belgrano", "Belgrano y Storni", "Storni y Belgrano", "Belgrano y Pedraza", "Pedraza y RP 16"]
    },
    "Los Studs": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Pcia. de B.A. y Casares", "Casares y Sarmiento", "Sarmiento y Beltrame", "Beltrame y Mitre", "Mitre y Los Cipreses", "Los Cipreses y Pcia. de B.A."]
    },
    "Barrio Municipal": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Sarmiento y Lorenzini", "Lorenzini y Canalejas", "Canalejas y Garin", "Garin y Castillo", "Castillo y Beltrame", "Beltrame y Sarmiento"]
    },
    "Rayo de Sol": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Argentina y RP 16", "RP 16 y Pedraza", "Pedraza y Roger", "Roger y Argentina"]
    },
    "Sakura Lch": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Yrigoyen y Combate Monte Santiago", "Combate Monte Santiago y Ávila Gregoria", "Ávila Gregoria y Finochietto", "Finochietto y Yrigoyen"]
    },
    "Santa Adela": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["RP 16 y Esteban Arce", "Esteban Arce y Yrigoyen", "Yrigoyen y Loedel Palumbo", "Loedel Palumbo y Drago", "Drago y Posadas", "Posadas y RP 16"]
    },
    "Santa María": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["RP 16 y Fonrouge", "Fonrouge y Yrigoyen", "Yrigoyen y Patagones", "Patagones y RP 16"]
    },
    "Santa Rita": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Alvear y Diehl", "Diehl y Yrigoyen", "Yrigoyen y Parodi", "Parodi y Alvear"]
    },
    "Villa París Lch": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Chiesa y Los Cipreses", "Los Cipreses y Ovidio Lagos", "Ovidio Lagos y Los Cipreses", "Los Cipreses y Pcia. de B.A.", "Pcia. de B.A. y Yapeyú", "Yapeyú y Chiesa"]
    },
    "Viplastic": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Castillo y Combate de Monte Santiago", "Combate de Monte Santiago y Ascasubi", "Ascasubi y Chiesa", "Chiesa y Combate de Monte Santiago"]
    },
    "Bicentenario": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Los Cipreses y Canalejas", "Canalejas y Yapeyú", "Yapeyú y Castillo", "Castillo y Los Cipreses"]
    },
    "14 de febrero": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Los Studs y Canalejas", "Canalejas y Las Heras", "Las Heras y Espora", "Espora y Los Studs"]
    },
    "Club Lomas": {
        "localidad": "Longchamps",
        "anexo": "VI",
        "color": "#8B5CF6",
        "vertices": ["Canalejas y Tornquist", "Tornquist y Espora", "Espora y Los Studs", "Los Studs y Canalejas"]
    },

    # ANEXO VII - MALVINAS ARGENTINAS
    "La Lucy Malvinas": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Soler y Pino", "Pino y Yrigoyen", "Yrigoyen y Diomedes", "Diomedes y Soler"]
    },
    "El Encuentro": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Sastre y Moyano", "Moyano y Yrigoyen", "Yrigoyen y Pino", "Pino y Bradley", "Bradley y Pino", "Pino y Sastre"]
    },
    "Betharram": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Bradley y Pino", "Pino y Soler", "Soler y Diomedes", "Diomedes y Bradley"]
    },
    "Loma Verde": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["RP 4 y Moyano", "Moyano y Sastre", "Sastre y Pino", "Pino y Buenos Aires", "Buenos Aires y Pino", "Pino y RP 4"]
    },
    "Arzeno Malvinas": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Pino y Buenos Aires", "Buenos Aires y Bradley", "Bradley y Diomedes", "Diomedes y Buenos Aires"]
    },
    "Asunción Malvinas": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Pino y Argentina", "Argentina y Matienzo", "Matienzo y Moyano", "Moyano y Argentina"]
    },
    "Ona": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Pino y Ingenieros", "Ingenieros y Petiribi", "Petiribi y Argentina", "Argentina y Pino"]
    },
    "La Pilarica Malvinas": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Pino y Ombú", "Ombú y Petiribi", "Petiribi y Drago", "Drago y Pino"]
    },
    "San Miguel": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["Drago y Larrea", "Larrea y RP 4", "RP 4 y Diomedes", "Diomedes y Drago"]
    },
    "Empleados de Comercio": {
        "localidad": "Malvinas Argentinas",
        "anexo": "VII",
        "color": "#06B6D4",
        "vertices": ["RP 4 y Pino", "Pino y Buenos Aires", "Buenos Aires y Diomedes", "Diomedes y RP 4"]
    },

    # ANEXO VIII - MINISTRO RIVADAVIA
    "Ibáñez": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Espora y Araujo", "Araujo y 25 de mayo", "25 de mayo y Moreno", "Moreno y Araujo"]
    },
    "San Juan de Corimayo": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Moreno y Araujo", "Araujo y Rep. Argentina", "Rep. Argentina y Sapelli", "Sapelli y Leguizamón", "Leguizamón y 25 de mayo", "25 de mayo y Moreno"]
    },
    "La Matera": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Rep. Argentina y Araujo", "Araujo y Acassuso", "Acassuso y Sapelli", "Sapelli y Rep. Argentina"]
    },
    "Los Troncos": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Araujo y Acassuso", "Acassuso y Sapelli", "Sapelli y Leguizamón", "Leguizamón y 25 de mayo", "25 de mayo y Martinez Paiva", "Martinez Paiva y Araujo"]
    },
    "Altos Del Castillo": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Araujo y Martinez Paiva", "Martinez Paiva y 25 de mayo", "25 de mayo y Granada Nicolás", "Granada Nicolás y Rufino Córdoba", "Rufino Córdoba y Aconquija", "Aconquija y Araujo"]
    },
    "Del Carmen": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Rep. Argentina y Páez", "Páez y Padre Arrieta", "Padre Arrieta y Laprida", "Laprida y Rep. Argentina"]
    },
    "Madres": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Garcia y Laprida", "Laprida y 25 de Mayo", "25 de Mayo y Rep. Argentina", "Rep. Argentina y Páez", "Páez y Padre Arrieta", "Padre Arrieta y Laprida"]
    },
    "Rivadavia Centro": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Rep. Argentina y 25 de mayo", "25 de mayo y Cardenas", "Cardenas y Vucetich", "Vucetich y Rep. Argentina"]
    },
    "Policial Rivadavia": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Virrey Cevallos y Sandoval", "Sandoval y Cárdenas", "Cárdenas y Panizza", "Panizza y Irigoin", "Irigoin y Panizza", "Panizza y Virrey Cevallos"]
    },
    "Barrio Parque Rivadavia": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Espora y 25 de mayo", "25 de mayo y Virrey Cevallos", "Virrey Cevallos y Panizza", "Panizza y Irigoin", "Irigoin y Laprida", "Laprida y Espora"]
    },
    "Tsuji": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["25 de mayo y Virrey Ceballos", "Virrey Ceballos y Demichelis", "Demichelis y Sandoval", "Sandoval y 25 de mayo"]
    },
    "Los Ciruelos": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Laprida y Cárdenas", "Cárdenas y Irigoyen", "Irigoyen y Virrey Cevallos", "Virrey Cevallos y Laprida"]
    },
    "Lujan": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Vucetich y Rep. Argentina", "Rep. Argentina y Laprida y Lahille", "Lahille y Origone", "Origone y Irigoin", "Irigoin y Vucetich"]
    },
    "Los Pinos": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Laprida y Espora", "Espora y Ezeiza", "Ezeiza y Demichelis", "Demichelis y Irigoyen", "Irigoyen y Virrey Cevallos", "Virrey Cevallos y Laprida"]
    },
    "Los Paraguayos": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Rep. Argentina y Irigoyen", "Irigoyen y Cárdenas", "Cárdenas y Laprida", "Laprida y Irigoin", "Irigoin y Origone", "Origone y Lahille", "Lahille y Rep. Argentina"]
    },
    "La Arbolada": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Yapeyú y Espora", "Espora y Juan B. Justo", "Juan B. Justo y Rep. Argentina", "Rep. Argentina y Zeballos", "Zeballos y Vicente Greco", "Vicente Greco y Yapeyu"]
    },
    "La Hermosa": {
        "localidad": "Ministro Rivadavia",
        "anexo": "VIII",
        "color": "#F97316",
        "vertices": ["Espora y Fernando Leyes", "Fernando Leyes y Iturralde", "Iturralde y Ortiz", "Ortiz y Espora"]
    },

    # ANEXO IX - RAFAEL CALZADA
    "Capilla Del Señor": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["Perón y Rep. Argentina", "Rep. Argentina y Melide", "Melide y Jorge", "Jorge y Grandville", "Grandville y San Martin", "San Martin y Erezcano", "Erezcano y Perón"]
    },
    "La Loma RC": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["Rep. Argentina y Perón", "Perón y Humberto Primo", "Humberto Primo y Erezcano", "Erezcano y Perón"]
    },
    "San Javier": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["Carrillo y Jorge", "Jorge y La Pampa", "La Pampa y San Martin", "San Martin y Mendoza", "Mendoza y Perón", "Perón y San Luis", "San Luis y Falucho", "Falucho y Lerroux", "Lerroux y San Martin", "San Martin y Carrillo"]
    },
    "Villa Rafael Calzada": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["Jorge y Rafael Calzada", "Rafael Calzada y Rep. Argentina", "Rep. Argentina y Humberto Primo", "Humberto Primo y San Luis", "San Luis y Falucho", "Falucho y Lerroux", "Lerroux y San Martin", "San Martin y Carrillo", "Carrillo y Jorge"]
    },
    "2 de abril RC": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["La Pampa y Jorge", "Jorge y La Tijereta", "La Tijereta y San Martin", "San Martin y La Pampa"]
    },
    "14 de noviembre": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["Donato Álvarez y Jorge", "Jorge y La Tijereta", "La Tijereta y San Martin", "San Martin y Donato Álvarez"]
    },
    "San Jerónimo": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["San Martin y Mendoza", "Mendoza y Perón", "Perón y El Picaflor", "El Picaflor y San Martin"]
    },
    "Asunción RC": {
        "localidad": "Rafael Calzada",
        "anexo": "IX",
        "color": "#84CC16",
        "vertices": ["San Luis y Perón", "Perón y El Picaflor", "El Picaflor y Falucho", "Falucho y San Luis"]
    },

    # ANEXO X - SAN FRANCISCO DE ASIS
    "Cerrito": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Estanislao del Campo y Monteverde", "Monteverde y Figueroa", "Figueroa y Virrey Loreto", "Virrey Loreto y Estanislao del Campo"]
    },
    "Don Orione": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Figueroa y Monteverde", "Monteverde y Marconi", "Marconi y Lacaze", "Lacaze y Paso", "Paso y Monteverde", "Monteverde y Blas Parera", "Blas Parera y Jauretche", "Jauretche y Humahuaca", "Humahuaca y Araujo", "Araujo y Figueroa"]
    },
    "La Esther": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Rep. Argentina y Monteverde", "Monteverde y Estanislao del Campo", "Estanislao del Campo y Araujo", "Araujo y Rep. Argentina"]
    },
    "Las Latitas": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Humahuaca y Jauretche", "Jauretche y Blas Parera", "Blas Parera y Araujo", "Araujo y Humahuaca"]
    },
    "Martin Fierro": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Estanislao del Campo y Virrey Loreto", "Virrey Loreto y Figueroa", "Figueroa y Araujo", "Araujo y Estanislao del Campo"]
    },
    "Suterh 2": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Rinaldi y Araujo", "Araujo y Rio Mayo", "Rio Mayo y Rufino Córdoba", "Rufino Córdoba y Rinaldi"]
    },
    "BI.PER.MU.": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Humahuaca y Araujo", "Araujo y Los Olivos", "Los Olivos y Arias", "Arias y Araujo"]
    },
    "Libertad SF": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Iglesia Paz y Araujo", "Araujo y Rinaldi", "Rinaldi y 25 de mayo", "25 de mayo y Iglesia Paz"]
    },
    "6 de diciembre": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Humahuaca y Los Olivos", "Los Olivos y Arias", "Arias y Araujo", "Araujo y Blas Parera", "Blas Parera y Sandoval", "Sandoval y Humahuaca"]
    },
    "Don Orione Viejo": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Aconquija y Araujo", "Araujo y Iglesia Paz", "Iglesia Paz y 25 de mayo", "25 de mayo y Granada Nicolás", "Granada Nicolás y Córdoba Rufino", "Córdoba Rufino y Aconquija"]
    },
    "Suterh 1": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Araujo y calle sin nombre", "calle sin nombre y Bragado", "Bragado y Algarrobo", "Algarrobo y Araujo"]
    },
    "Soom": {
        "localidad": "San Francisco de Asís",
        "anexo": "X",
        "color": "#00D9FF",
        "vertices": ["Araujo y Humahuaca", "Humahuaca y Algarrobo", "Algarrobo y calle sin nombre", "calle sin nombre y Araujo"]
    },

    # ANEXO XI - SAN FRANCISCO SOLANO
    "Guadalupe": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["El Picaflor y San Martin", "San Martin y El Mirlo", "El Mirlo y Perón", "Perón y El Picaflor"]
    },
    "Las Lomas De San Francisco": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Charcas Sur y Lacaze", "Lacaze y Lirio", "Lirio y Humberto Primo", "Humberto Primo y Charcas Sur"]
    },
    "Las Tunas": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["El Picaflor y Falucho", "Falucho y Charcas Norte", "Charcas Norte y Humberto Primo", "Humberto Primo y El Picaflor"]
    },
    "Los Chalets": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Rawson y No me Olvides", "No me Olvides y Charcas Sur", "Charcas Sur y Pensamiento Sur", "Pensamiento Sur y Rawson"]
    },
    "Parque Uno": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Rawson y Salaberry", "Salaberry y Charcas Sur", "Charcas Sur y No me Olvides", "No me Olvides y Rawson"]
    },
    "Parque Dos": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Rawson y Pensamiento Sur", "Pensamiento Sur y Charcas Sur", "Charcas Sur y Lacaze", "Lacaze y Rawson"]
    },
    "Complejo Habitacional SFS": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Rawson y Salaberry", "Salaberry y Humberto Primo", "Humberto Primo y Charcas Sur", "Charcas Sur y Salaberry"]
    },
    "Nueva Pompeya": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Rawson y Lacaze", "Lacaze y Charcas Sur", "Charcas Sur y Monteverde", "Monteverde y Rawson"]
    },
    "San Agustin": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["El Pato y Donato Álvarez", "Donato Álvarez y El Cóndor", "El Cóndor y Humberto Primo", "Humberto Primo y Charcas Norte", "Charcas Norte y El Pato"]
    },
    "Santa Catalina": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["El Mirlo y San Martin", "San Martin y Héroe de Malvinas", "Héroe de Malvinas y Perón", "Perón y El Mirlo"]
    },
    "Santa Isabel": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["Charcas Sur y Lacaze", "Lacaze y Donato Álvarez", "Donato Álvarez y Monteverde", "Monteverde y Charcas Sur"]
    },
    "Villa Laura": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["San Martin y Héroe de Malvinas", "Héroe de Malvinas y Perón", "Perón y Donato Álvarez", "Donato Álvarez y San Martin"]
    },
    "Zabala": {
        "localidad": "San Francisco Solano",
        "anexo": "XI",
        "color": "#FBBF24",
        "vertices": ["El Picaflor y Perón", "Perón y Charcas Norte", "Charcas Norte y Falucho", "Falucho y El Picaflor"]
    },

    # ANEXO XII - SAN JOSÉ
    "San Ramón": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Depósito Cattorini y Juan de Garay", "Juan de Garay y Donato Álvarez", "Donato Álvarez y Alvear Carlos", "Alvear Carlos y Cattorini"]
    },
    "La Gloria": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Amenedo y La Tijereta", "La Tijereta y 30 de septiembre", "30 de septiembre y El Chaja", "El Chaja y Los Nogales", "Los Nogales y Donato Álvarez", "Donato Álvarez y Amenedo"]
    },
    "8 de noviembre": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Cattorini y Los Nogales", "Los Nogales y Donato Álvarez", "Donato Álvarez y Virrey Vértiz", "Virrey Vértiz y Cattorini"]
    },
    "8 de diciembre": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["El Cardenal y Amenedo", "Amenedo y La Tijereta", "La Tijereta y Bynnon", "Bynnon y El Cardenal"]
    },
    "Garay": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["El Hornero y Juan de Garay", "Juan de Garay y vías ex FFCC", "vías ex FFCC y Alvear", "Alvear y Héroe de Malvinas", "Héroe de Malvinas y 30 de septiembre", "30 de septiembre y El Hornero"]
    },
    "Santa Maria SJ": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Cattorini y Virrey Vértiz", "Virrey Vértiz y Alvear Carlos", "Alvear Carlos y Donato Álvarez", "Donato Álvarez y Virrey Vértiz"]
    },
    "La Loma SJ": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["La Tijereta y Amenedo", "Amenedo y Donato Álvarez", "Donato Álvarez y Bynnon", "Bynnon y La Tijereta"]
    },
    "La Victoria": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["El Cóndor y Bynnon", "Bynnon y Donato Álvarez", "Donato Álvarez y Jorge", "Jorge y La Tijereta", "La Tijereta y Piedrabuena", "Piedrabuena y El Cóndor"]
    },
    "Puerto Argentino": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Jorge y El Tordo", "El Tordo y La Tijereta", "La Tijereta y Piedrabuena", "Piedrabuena y El Cóndor", "El Cóndor y Bynnon", "Bynnon y El Hornero", "El Hornero y Rosales", "Rosales y El Tordo", "El Tordo y Jorge"]
    },
    "La Tablada": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Rosales y Santa Ana", "Santa Ana y Amenedo", "Amenedo y El Cardenal", "El Cardenal y Bynnon", "Bynnon y El Hornero", "El Hornero y Rosales"]
    },
    "La Cava": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Jorge y Chubut", "Chubut y Piedrabuena", "Piedrabuena y El Picaflor", "El Picaflor y Jorge"]
    },
    "Virgen De Luján Ombú": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Piedrabuena y Chubut", "Chubut y Nother", "Nother y Santa Ana", "Santa Ana y Rosales", "Rosales y El Tordo", "El Tordo y Jorge", "Jorge y El Picaflor", "El Picaflor y Piedrabuena"]
    },
    "Agustín Ramírez": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Santa Cruz y Amenedo", "Amenedo y Santa Ana", "Santa Ana y Nother", "Nother y Santa Cruz"]
    },
    "Altos De Santa Ana": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Santa Ana y Juan de Garay", "Juan de Garay y El Hornero", "El Hornero y 30 de Septiembre", "30 de Septiembre y Teresa de Calcuta", "Teresa de Calcuta y Amenedo", "Amenedo y Santa Ana"]
    },
    "San José": {
        "localidad": "San José",
        "anexo": "XII",
        "color": "#A78BFA",
        "vertices": ["Jorge y San Juan", "San Juan y Juan de Garay", "Juan de Garay y Santa Ana", "Santa Ana y Amenedo", "Amenedo y Santa Cruz", "Santa Cruz y Nother", "Nother y Chubut", "Chubut y Jorge"]
    },
}

# ============================================================================
# GEOCODIFICACIÓN
# ============================================================================

class BarrioGeocoder:
    """Geocodifica intersecciones para generar barrios"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="fiscaliza_brown_v2")
        self.cache = {}
        self.failed_intersections = []
    
    def geocode_intersection(self, street1: str, street2: str) -> Optional[Tuple[float, float]]:
        """Geocodifica una intersección"""
        # Normalizar
        street1 = street1.strip().title()
        street2 = street2.strip().title()
        cache_key = f"{street1}_{street2}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        query = f"{street1} y {street2}, {MUNICIPIO}"
        
        try:
            print(f"  🔍 Buscando: {query}")
            location = self.geolocator.geocode(query, timeout=10)
            
            if location:
                coords = (location.longitude, location.latitude)
                self.cache[cache_key] = coords
                print(f"    ✓ Encontrado: {coords}")
                return coords
            else:
                print(f"    ✗ No encontrado")
                self.failed_intersections.append(query)
                self.cache[cache_key] = None
                return None
        
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"    ⚠️  Error: {e}")
            self.failed_intersections.append(query)
            self.cache[cache_key] = None
            return None
    
    def barrio_to_polygon(self, barrio_name: str, vertices: List[str]) -> Optional[Dict]:
        """Convierte vertices en polígono GeoJSON"""
        coordinates = []
        
        for vertex in vertices:
            if " y " not in vertex:
                continue
            
            parts = vertex.split(" y ")
            if len(parts) != 2:
                continue
            
            coords = self.geocode_intersection(parts[0], parts[1])
            if coords:
                coordinates.append(list(coords))
            time.sleep(1)  # Rate limit
        
        if len(coordinates) < 3:
            print(f"    ❌ No hay suficientes coordenadas para {barrio_name}")
            return None
        
        # Cerrar polígono
        if coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
        
        return {
            "type": "Polygon",
            "coordinates": [coordinates]
        }


def main():
    print("=" * 80)
    print("🗺️  GENERADOR COMPLETO DE BARRIOS - ORDENANZA 13.906")
    print(f"📍 Total de barrios a procesar: {len(BARRIOS_DATA)}")
    print("=" * 80)
    print()
    
    geocoder = BarrioGeocoder()
    features = []
    
    # Procesar cada barrio
    for barrio_idx, (barrio_name, data) in enumerate(BARRIOS_DATA.items(), 1):
        print(f"\n[{barrio_idx}/{len(BARRIOS_DATA)}] {barrio_name} ({data['localidad']})")
        
        polygon = geocoder.barrio_to_polygon(barrio_name, data['vertices'])
       
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
                    "ordenanza": "13.906"
                },
                "geometry": polygon
            }
            features.append(feature)
            print(f"✅ Barrio procesado correctamente")
    
    # Crear FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "BARRIOS COMPLETOS - ORDENANZA 13.906",
        "bbox": BBOX,
        "properties": {
            "generado": datetime.now().isoformat(),
            "municipio": "Almirante Brown",
            "provincia": "Buenos Aires",
            "pais": "Argentina",
            "total_barrios": len(features),
            "total_procesados": len(BARRIOS_DATA),
            "tasa_exito": f"{len(features)/len(BARRIOS_DATA)*100:.1f}%",
            "nota": "Barrios generados desde Ordenanza 13.906 con geocodificación Nominatim"
        },
        "features": features
    }
    
    # Guardar
    output_path = Path(__file__).parent.parent.parent.parent / "public" / "limites_barrios_brown_completo.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✅ Archivo guardado: {output_path}")
    print(f"📊 Resumen:")
    print(f"   • Barrios procesados: {len(features)}/{len(BARRIOS_DATA)}")
    print(f"   • Tasa de éxito: {len(features)/len(BARRIOS_DATA)*100:.1f}%")
    print(f"   • Intersecciones fallidas: {len(geocoder.failed_intersections)}")
    print("=" * 80)


if __name__ == "__main__":
    main()
