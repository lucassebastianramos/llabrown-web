#!/usr/bin/env python3
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


DATOS_ORDENANZA = {
    "ANEXO I": {
        "localidad": "Adrogué",
        "barrios": {
            "Barrio Vattuone": "Desde Estrada e Illia, por Illia hasta Espora, por Espora hasta Perón, por Perón hasta Villarruel, por Villarruel hasta Estrada .",
            "Adrogué Centro": "Yrigoyen y Perón; por Yrigoyen hasta Amenedo; por Amenedo hasta Frías; por Frías hasta Segurola; por Segurola/30 de Septiembre hasta Erezcano; por Erezcano hasta Perón; por Perón hasta Espora; por Espora hasta Illia; por Illia hasta Estrada; por Estrada hasta Villarruel; por Villarruel hasta Perón; por Perón hasta Yrigoyen ."
        }
    },
    "ANEXO II": {
        "localidad": "Burzaco",
        "barrios": {
            "Corimayo": "Hugo del Carril y Espora; por Espora hasta Araujo; por Araujo hasta Rep. Argentina; por Rep. Argentina hasta Hugo del Carril .",
            "Las Rosas": "Carlos Gardel y 2 de Abril; por 2 de Abril hasta Rep. Argentina; por Rep. Argentina hasta Hugo del Carril; por Hugo del Carril hasta Carlos Gardel .",
            "Primera Junta": "Espora y 2 de Abril; por 2 de Abril hasta Carlos Gardel; por Carlos Gardel hasta Hugo del Carril; por Hugo del Carril hasta Espora .",
            "Roca": "Espora y límite Parcela 5/6; hasta Ávila Gregoria; por Ávila Gregoria hasta Monteverde; por Monteverde hasta Espora .",
            "Don Alejandro": "Yrigoyen y Alsina; por Alsina hasta Roca; por Roca hasta Monteverde; por Monteverde hasta Yrigoyen .",
            "Burzaco Centro": "Yrigoyen y Perón; por Perón hasta Espora; por Espora hasta Azopardo; por Azopardo hasta Paraguay; por Paraguay hasta Perón; por Perón hasta Amelia Angonelli; por Angonelli hasta Humberto Primo; por Humberto Primo hasta Terrero; por Terrero hasta Alsina; por Alsina hasta Pcia. de B.A.; por Pcia. de B.A. hasta 2 de Abril; por 2 de Abril hasta Espora; por Espora hasta Rotonda del Vapor; por Monteverde hasta Roca; por Roca hasta Alsina; por Alsina hasta Yrigoyen .",
            "La Carlota": "Yrigoyen y Monteverde; por Monteverde hasta Vallejos; por Vallejos hasta Ida Rebori; por Ida Rebori hasta Yrigoyen .",
            "Sakura": "Vallejos y Monteverde; por Monteverde hasta Japón; por Japón hasta Combate de Monte Santiago; por Combate de Monte Santiago hasta Yrigoyen; por Yrigoyen hasta Ida Rebori; por Ida Rebori hasta Vallejos .",
            "Luz y Fuerza": "Espora y Perón; por Perón hasta Paraguay; por Paraguay hasta Azopardo; por Azopardo hasta Espora .",
            "Lomas de Burzaco": "Erezcano y Humberto Primo; por Humberto Primo hasta Angonelli; por Angonelli hasta Perón; por Perón hasta Erezcano .",
            "El Gaucho": "Terrero y Humberto Primo; por Humberto Primo hasta Rep. Argentina; por Rep. Argentina hasta 2 de Abril; por 2 de Abril hasta Pcia. de B.A.; por Pcia. de B.A. hasta Alsina; por Alsina hasta Terrero .",
            "El Hornero": "Guatambú y José Melián; por Melián hasta Buenos Aires; por Buenos Aires hasta Cuyo; por Cuyo hasta Guatambú .",
            "La Cumbre": "Drago y Diómede; por Diómede hasta Buenos Aires; por Buenos Aires hasta Juan XXIII; por Juan XXIII hasta Drago .",
            "La Primavera": "Ituzaingó y Prieto; por Prieto hasta Soler; por Soler hasta Prieto; por Prieto hasta Yrigoyen; por Yrigoyen hasta Eva Perón; por Eva Perón hasta Ituzaingó .",
            "La Pilarica": "Ingenieros y Petiribi; por Petiribi hasta Drago; por Drago hasta Arenales; por Arenales hasta Ingenieros .",
            "La Lucy": "Soler y Diómede; por Diómede hasta Yrigoyen; por Yrigoyen hasta Prieto; por Prieto hasta Soler .",
            "Almafuerte": "Monteverde y Melián; por Melián hasta Derqui; por Derqui hasta Yrigoyen; por Yrigoyen hasta Monteverde .",
            "Ciudad Oculta": "Asamblea y Prieto; por Prieto hasta Bradley; por Bradley hasta Prieto; por Prieto hasta Ituzaingó; por Ituzaingó hasta Eva Perón; por Eva Perón hasta Bradley; por Bradley hasta Eva Perón; por Eva Perón hasta Asamblea; por Asamblea hasta Prieto .",
            "San Pablo": "Buenos Aires y Prieto; por Prieto hasta Asamblea; por Asamblea hasta Eva Perón; por Eva Perón hasta Derqui; por Derqui hasta Melián; por Melián hasta Buenos Aires .",
            "El Recuerdo": "Derqui y Eva Perón; por Eva Perón hasta Bradley; por Bradley hasta Eva Perón; por Eva Perón hasta Yrigoyen; por Yrigoyen hasta Derqui .",
            "Arzeno": "Buenos Aires y Diómede; por Diómede hasta Bradley; por Bradley hasta Prieto; por Prieto hasta Buenos Aires .",
            "Parque Industrial": "Rep. Argentina y Petiribi; por Petiribi hasta Ingenieros; por Ingenieros hasta Arenales; por Arenales hasta Drago; por Drago hasta Juan XXIII; por Juan XXIII hasta Buenos Aires; por Buenos Aires hasta Colectora Monteverde; por Colectora hasta Melián; por Melián hasta Guatambú; por Guatambú hasta Cuyo; por Cuyo hasta Buenos Aires; por Buenos Aires hasta Monteverde; por Monteverde hasta Rotonda Los Pinos; por Rotonda hasta Yrigoyen; por Yrigoyen hasta Fonrouge; por Fonrouge hasta Rep. Argentina .",
            "Solis": "Diomede y Bradley; hasta Soler; hasta Prieto; hasta Bradley ."
        }
    },
    "ANEXO III": {
        "localidad": "Claypole",
        "barrios": {
            "Claypole Este": "Billinghurst y Humberto Primo; por Humberto Primo hasta Irupé; por Irupé hasta Lacaze; por Lacaze hasta 17 de Octubre; por 17 de Octubre hasta Catedral; por Catedral hasta R. de Escalada; por R. de Escalada hasta Paso; por Paso hasta 17 de Octubre; por 17 de Octubre hasta Billinghurst .",
            "El Trébol": "Celedonio Flores y Humberto Primo; por Humberto Primo hasta R. de Escalada; por R. de Escalada hasta Paso; por Paso hasta R. de Escalada; por R. de Escalada hasta Alsina; por Alsina hasta Celedonio Flores .",
            "Horizonte": "Irupé y Humberto Primo; por Humberto Primo hasta Rawson; por Rawson hasta Lacaze; por Lacaze hasta Irupé .",
            "La Jovita": "Irupé y Lacaze; por Lacaze hasta Rawson; por Rawson hasta Monteverde; por Monteverde hasta Irupé .",
            "Mariano Moreno": "San Luis Orione y Alsina; por Alsina hasta Cabral; por Cabral hasta Monteverde; por Monteverde hasta San Luis Orione .",
            "Medalla Milagrosa": "Libertad y Humberto Primo; por Humberto Primo hasta San Francisco de Asís; por San Francisco de Asís hasta Alsina; por Alsina hasta Libertad .",
            "Barrio Parque": "R. de Escalada y Humberto Primo; por Humberto Primo hasta Billinghurst; por Billinghurst hasta 17 de Octubre; por 17 de Octubre hasta Paso; por Paso hasta R. de Escalada .",
            "Sáenz": "San Francisco de Asís y Humberto Primo; por Humberto Primo hasta Celedonio Flores; por Celedonio Flores hasta Alsina; por Alsina hasta San Francisco de Asís .",
            "San Lucas": "Rep. Argentina y Alsina; por Alsina hasta San Luis Orione; por San Luis Orione hasta Monteverde; por Monteverde hasta Rep. Argentina .",
            "San Luis": "Cabral y Alsina; por Alsina hasta San Francisco de Asís; por San Francisco de Asís hasta Monteverde; por Monteverde hasta Cabral .",
            "Sideco": "Paso y Lacaze; por Lacaze hasta Esquiú; por Esquiú hasta Monteverde; por Monteverde hasta Paso .",
            "Claypole Oeste": "San Francisco de Asís y Alsina; por Alsina hasta R. de Escalada; por R. de Escalada hasta Catedral; por Catedral hasta 17 de Octubre; por 17 de Octubre hasta Lacaze; por Lacaze hasta Marconi; por Marconi hasta Monteverde; por Monteverde hasta San Francisco de Asís .",
            "Santa Clara": "San Luis y Falucho; por Falucho hasta Rawson; por Rawson hasta Humberto Primo; por Humberto Primo hasta San Luis .",
            "El Triángulo": "Esquiú y Lacaze; por Lacaze hasta Irupé; por Irupé hasta Monteverde; por Monteverde hasta Esquiú .",
            "Loma de Burzaco": "Rep. Argentina y Humberto Primo; hasta Libertad; hasta Alsina; hasta Rep. Argentina ."
        }
    },
    "ANEXO IV": {
        "localidad": "Glew",
        "barrios": {
            "Gendarmería": "Espora y Fernando Leyes; hasta Romero; hasta Conde; hasta Espora .",
            "El Triunfo": "Espora y Conde; hasta Romero; hasta Gallardo; hasta Espora .",
            "Kanmar": "Espora y Raúl Espoile; hasta Castillo; hasta Gerchunoff; hasta Espora .",
            "600 Viviendas": "Espora y Mazzini; hasta San Ignacio; hasta Espoile; hasta Espora .",
            "Santa Rosa": "Espora y Garibaldi; hasta San Ignacio; hasta Mazzini; hasta Espora .",
            "Santa Ana": "Garibaldi y Arias; hasta Espoile; hasta San Ignacio; hasta Garibaldi .",
            "Las Calandrias": "Almafuerte y Capitán Olivera; hasta López y Planes; hasta Hernández; hasta Parravicini; hasta Almafuerte .",
            "Villa París": "Yapeyú y Arias; hasta Gervasio Méndez; hasta Newbery; hasta Montevideo; hasta Longchamps; hasta Yapeyú .",
            "Ombú": "Yapeyú y Arias; hasta Montevideo; hasta Ovidio Lagos; hasta Yapeyú .",
            "Ipona": "Yrigoyen y Mitre; hasta Soldi; hasta Capitán Olivera; hasta Yrigoyen .",
            "Los Aromos": "Yrigoyen e Industria; hasta Uspallata; hasta Patria; hasta Yrigoyen .",
            "Telepostal": "Yrigoyen y Padre Pio; hasta Uspallata; hasta Industria; hasta Yrigoyen .",
            "UPCN": "Yrigoyen y Pcia. de Santa Fe; hasta vías FC Roca; hasta Padre Pio; hasta Yrigoyen .",
            "El Castillo Las Heras": "Yrigoyen y Las Heras; hasta La Aviación; hasta Pcia. de Santa Fe; hasta Yrigoyen .",
            "Los Álamos": "Yrigoyen y Pcia. de Santa Fe; hasta Gordillo; hasta Payró; hasta Manuela Pedraza/Los Pinos; hasta Las Heras; hasta Yrigoyen .",
            "COTEPA": "Yrigoyen y Pcia. de Santa Fe; hasta Pedraza; hasta Iglesias; hasta Yrigoyen .",
            "Parque Roma": "Yrigoyen y San Urbano; hasta San Roque; hasta Pcia. de Santa Fe; hasta Buenos Aires; hasta Patagones; hasta Argentina; hasta Caseros; hasta Yrigoyen .",
            "OUCRA": "Beiró y San Urbano; hasta San Roque; hasta Del Carril; hasta Franklin; hasta Monroe; hasta Beiró .",
            "Gorritti": "Yrigoyen y San Urbano; hasta Beiró; hasta Monroe; hasta Franklin; hasta Del Carril; hasta San Roque; hasta Capitán Olivera; hasta Yrigoyen .",
            "Progreso": "RP 210 y Caseros; hasta Argentina; hasta Patagones; hasta Buenos Aires; hasta Pcia. de Santa Fe; hasta Pedraza; hasta Fleming; hasta Yrigoyen .",
            "El Trébol (Glew)": "Roger y Pedraza; hasta Payró; hasta Gordillo; hasta Pcia. de Santa Fe; hasta San Roque; hasta Roger .",
            "Glew Centro Oeste": "Patria y Soldi; hasta Mitre; hasta Yrigoyen; hasta Patria .",
            "Glew Centro Este": "Arias y Gervasio Méndez; hasta Newbery; hasta Patria; hasta vías FC; hasta López y Planes; hasta Hernández; hasta Parravicini; hasta Almafuerte; hasta Arias .",
            "Almafuerte (Glew)": "Arias y Capitán Olivera; hasta Castillo; hasta Arreghini; hasta Arias .",
            "SUPA": "Espoile y Castillo; hasta Arreghini; hasta Mitre; hasta Espoile .",
            "COTEPA-PROGRESO": "Yrigoyen e Iglesias; hasta Pedraza; hasta Fleming; hasta Yrigoyen .",
            "Espacio Vacío 1": "Av. Tomas Espora y Alberto Gerchunoff; por Gerchunoff hasta Pte. Castillo; por Castillo hasta Capitán Olivera; por Capitán Olivera hasta Av. Tomas Espora; por Espora hasta Gerchunoff",
            "Espacio Vacío 2": "Raúl Espoile y Gobernador Arias; por Arias hasta Intendente Arreghini; por Arreghini hasta Vicepresidente Alsina; por Alsina hasta Arreghini; por Arreghini hasta Pte. Mitre; por Mitre hasta Raúl Espoile; por Espoile hasta Arias",
            "Espacio Vacío 3": "Av. Tomas Espora y El Plata; por El Plata hasta Pte. Castillo; por Castillo hasta Montevideo; por Montevideo hasta Gobernador Arias; por Arias hasta Garibaldi; por Garibaldi hasta Av. Tomas Espora; por Espora hasta El Plata",
            "El Trébol": "Roger y Pedraza; hasta Payró; hasta Gordillo; hasta Pcia. de Santa Fe; hasta San Roque; hasta Roger .",
            "Almafuerte": "Arias y Capitán Olivera; hasta Castillo; hasta Arreghini; hasta Arias .",
            "Espacio Vacío 1 (Glew)": "Espora y Gerchunoff; hasta Castillo; hasta Capitán Olivera; hasta Espora .",
            "Espacio Vacío 2 (Glew)": "Espoile y Arias; hasta Arreghini; hasta Alsina; hasta Arreghini; hasta Mitre; hasta Espoile ."
        }
    },
    "ANEXO V": {
        "localidad": "José Mármol",
        "barrios": {
            "Mármol Norte": "King y 30 de Septiembre; hasta Blasco Ibáñez; hasta Amenedo; hasta King .",
            "Mármol Centro": "Erezcano y Amenedo; hasta Blasco Ibáñez; hasta Rosales; hasta Molina; hasta Jorge; hasta Grandville; hasta San Martín; hasta Erezcano .",
            "Barrio Arca": "Erezcano y 30 de Septiembre; hasta King; hasta Amenedo; hasta Erezcano .",
            "Martin Arin": "30 de Septiembre y San Juan; hasta Jorge; hasta Molina; hasta Rosales; hasta Blasco Ibáñez; hasta 30 de Septiembre .",
            "Arca": "Erezcano y 30 de Septiembre; hasta King; hasta Amenedo; hasta Erezcano ."
        }
    },
    "ANEXO VI": {
        "localidad": "Longchamps",
        "barrios": {
            "Altos de Longchamps": "Castillo y Yapeyú; hasta Espora; hasta El Plata; hasta Castillo .",
            "Amancay": "Pcia. de B.A. y Los Cipreses; hasta Castillo; hasta Montevideo; hasta Ovidio Lagos; hasta Yapeyú; hasta Pcia. de B.A. .",
            "Ampliación Santa Rita": "Pedraza y Belgrano; hasta Alvear; hasta Roger; hasta Pedraza .",
            "Amutum 1": "Sarmiento y Tornquist; hasta Canalejas; hasta Lorenzini; hasta Sarmiento .",
            "Amutum 2- Santa Rita": "Castillo y Garin; hasta Canalejas; hasta Los Cipreses; hasta Castillo .",
            "Campo Ramos": "Drago y Loedel Palumbo; hasta Yrigoyen; hasta Berlin; hasta Alvear; hasta Ascasubi; hasta Drago .",
            "Casablanca": "Languenhein y Diehl; hasta San Ignacio; hasta Tornquist; hasta Languenhein .",
            "Don Luis": "Mitre y Beltrame; hasta Castillo; hasta Los Cipreses; hasta Mitre .",
            "Doña Sol": "RP 16 y Patagones; hasta Yrigoyen; hasta Esteban Arce; hasta RP 16 .",
            "El Triángulo": "Chiesa y Ascasubi; hasta Quintana; hasta Boulogne Sur Mer; hasta Chiesa .",
            "Esperanza": "Yrigoyen y Finochietto; hasta Ávila Gregoria; hasta Posadas; hasta Olavarria; hasta Loedel Palumbo; hasta Yrigoyen .",
            "Ferroviario": "Yrigoyen y Motti de Tieghi; hasta Chiesa; hasta Roger; hasta Parodi; hasta Yrigoyen .",
            "Jorge Newbery": "Alvear y Parodi; hasta Yrigoyen; hasta Roger; hasta Alvear .",
            "La Carmen": "Pedraza y Roger; hasta Yrigoyen; hasta Las Heras; hasta Los Pinos; hasta Pedraza .",
            "Las Lilas": "Canalejas y Las Heras; hasta Espora; hasta Yapeyú; hasta Canalejas .",
            "Longchamps Centro": "Alvear y Berlín; hasta Yrigoyen; hasta Loedel Palumbo; hasta Olavarría; hasta Posadas; hasta Ávila Gregoria; hasta Boulogne Sur Mer; hasta Sarmiento; hasta Casares; hasta Pcia. de B.A.; hasta Los Cipreses; hasta Ovidio Lagos; hasta Chiesa; hasta Las Heras; hasta Yrigoyen; hasta Parodi; hasta Chiesa; hasta Motti de Tieghi; hasta Yrigoyen; hasta Diehl; hasta Alvear .",
            "Longchamps Este": "Quintana y Ascasubi; hasta Espora; hasta Tornquist; hasta San Ignacio; hasta Diehl; hasta Languenheim; hasta Tornquist; hasta Sarmiento; hasta Boulogne Sur Mer; hasta Quintana .",
            "Los Frutales": "RP 16 y Posadas; hasta Drago/Alvear; hasta Belgrano; hasta Storni; hasta Belgrano; hasta Pedraza; hasta RP 16 .",
            "Los Studs": "Pcia. de B.A. y Casares; hasta Sarmiento; hasta Beltrame; hasta Mitre; hasta Los Cipreses; hasta Pcia. de B.A. .",
            "Barrio Municipal": "Sarmiento y Lorenzini; hasta Canalejas; hasta Garin; hasta Castillo; hasta Beltrame; hasta Sarmiento .",
            "Rayo de Sol": "Argentina y RP 16; hasta Pedraza; hasta Roger; hasta Argentina .",
            "Sakura (Lch)": "Yrigoyen y Combate Monte Santiago; hasta Ávila Gregoria; hasta Finochietto; hasta Yrigoyen .",
            "Santa Adela": "RP 16 y Esteban Arce; hasta Yrigoyen; hasta Loedel Palumbo; hasta Drago; hasta Posadas; hasta RP 16 .",
            "Santa María": "RP 16 y Fonrouge; hasta Yrigoyen; hasta Patagones; hasta RP 16.",
            "Santa Rita": "Alvear y Diehl; hasta Yrigoyen; hasta Parodi; hasta Alvear .",
            "Villa París (Lch)": "Chiesa y Los Cipreses; hasta Ovidio Lagos; hasta Los Cipreses; hasta Pcia. de B.A.; hasta Yapeyú; hasta Chiesa .",
            "Viplastic": "Castillo y Combate de Monte Santiago; hasta Ascasubi; hasta Chiesa; hasta Combate de Monte Santiago .",
            "Bicentenario": "Los Cipreses y Canalejas; hasta Yapeyú; hasta Castillo; hasta Los Cipreses .",
            "14 de febrero": "Los Studs y Canalejas; hasta Las Heras; hasta Espora; hasta Los Studs .",
            "Club Lomas": "Canalejas y Tornquist; hasta Espora; hasta Los Studs; hasta Canalejas .",
            "Espacio Vacío 4": "R.P. N° 16 y Julio Fonrouge; por Fonrouge hasta Argentina; por Argentina hasta R.P. N° 16; por R.P. N° 16 hasta Fonrouge"
        }
    },
    "ANEXO VII": {
        "localidad": "Malvinas Argentinas",
        "barrios": {
            "La Lucy": "Soler y Pino; hasta Yrigoyen; hasta Diomedes; hasta Soler .",
            "El Encuentro": "Sastre y Moyano; hasta Yrigoyen; hasta Pino; hasta Bradley; hasta Pino; hasta Sastre .",
            "Betharram": "Bradley y Pino; hasta Soler; hasta Diomedes; hasta Bradley.",
            "Loma Verde": "RP 4 y Moyano; hasta Sastre; hasta Pino; hasta Buenos Aires; hasta Pino; hasta RP 4.",
            "Arzeno": "Pino y Buenos Aires; hasta Bradley; hasta Diomedes; hasta Buenos Aires.",
            "Barrio Lindo": "Moyano y Matienzo; hasta RP 4; hasta Larrea; hasta Drago; hasta Macedonio Rodriguez; hasta Timbó; hasta Pino; hasta Ombú; hasta Diomedes; hasta Ingenieros; hasta Pino; hasta Madariaga; hasta Macedonio Rodriguez; hasta Quebracho; hasta Portugal; hasta Matienzo .",
            "La Antena": "Portugal y Matienzo; hasta Quebracho; hasta Macedonio Rodriguez; hasta Lapacho; hasta Pino; hasta Matienzo.",
            "Ona": "Pino y Argentina; hasta Matienzo; hasta Moyano; hasta Argentina .",
            "Canario": "Pino y Argentina; hasta Ingenieros; hasta Petiribi; hasta Argentina .",
            "La Pilarica": "Pino y Ombú; hasta Petiribi; hasta Drago; hasta Pino.",
            "San Miguel": "Drago y Larrea; hasta RP 4; hasta Diomedes; hasta Drago.",
            "Policial": "Macedonio Rodriguez y Timbó; hasta Drago; hasta Pino; hasta Timbó .",
            "Lindo 1 y 2": "Lapacho y Macedonio Rodriguez; hasta Madariaga; hasta Pino; hasta Lapacho.",
            "Empleados de Comercio": "RP 4 y Pino; hasta Buenos Aires; hasta Diomedes; hasta RP 4."
        }
    },
    "ANEXO VIII": {
        "localidad": "Ministro Rivadavia",
        "barrios": {
            "Ibáñez": "Espora y Araujo; hasta 25 de mayo; hasta Moreno; hasta Araujo .",
            "San Juan de Corimayo": "Moreno y Araujo; hasta Rep. Argentina; hasta Sapelli; hasta Leguizamón; hasta 25 de mayo; hasta Moreno .",
            "La Matera": "Rep. Argentina y Araujo; hasta Acassuso; hasta Sapelli; hasta Rep. Argentina .",
            "Los Troncos": "Araujo y Acassuso; hasta Sapelli; hasta Leguizamón; hasta 25 de mayo; hasta Martinez Paiva; hasta Araujo.",
            "Altos Del Castillo": "Araujo y Martinez Paiva; hasta 25 de mayo; hasta Granada Nicolás; hasta Rufino Córdoba; hasta Aconquija; hasta Araujo.",
            "Del Carmen": "Rep. Argentina y Páez; hasta Padre Arrieta; hasta Laprida; hasta Rep. Argentina .",
            "Madres": "Garcia y Laprida; hasta 25 de Mayo; hasta Rep. Argentina; hasta Páez; hasta Padre Arrieta; hasta Laprida .",
            "Rivadavia Centro": "Rep. Argentina y 25 de mayo; hasta Cardenas; hasta Vucetich; hasta Rep. Argentina .",
            "Policial (MR)": "Virrey Cevallos y Sandoval; hasta Cárdenas; hasta Panizza; hasta Irigoin; hasta Panizza; hasta Virrey Cevallos .",
            "Barrio Parque (MR)": "Espora y 25 de mayo; hasta Virrey Cevallos; hasta Panizza; hasta Irigoin; hasta Laprida; hasta Espora .",
            "Tsuji": "25 de mayo y Virrey Ceballos; hasta Demichelis; hasta Sandoval; hasta 25 de mayo.",
            "Los Ciruelos": "Laprida y Cárdenas; hasta Irigoyen; hasta Virrey Cevallos; hasta Laprida .",
            "Lujan": "Vucetich y Rep. Argentina; hasta Laprida/Lahille; hasta Origone; hasta Irigoin; hasta Vucetich .",
            "Los Pinos": "Laprida y Espora; hasta Ezeiza; hasta Demichelis; hasta Irigoyen; hasta Virrey Cevallos; hasta Laprida .",
            "Los Paraguayos": "Rep. Argentina e Irigoyen; hasta Cárdenas; hasta Laprida; hasta Irigoin; hasta Origone; hasta Lahille; hasta Rep. Argentina .",
            "La Arbolada": "Yapeyú y Espora; hasta Juan B. Justo; hasta Rep. Argentina; hasta Zeballos; hasta Vicente Greco; hasta Yapeyu .",
            "La Hermosa": "Espora y Fernando Leyes; hasta Iturralde; hasta Ortiz; hasta Espora .",
            "Espacio Vacío 5": "Juan Cagliero y Holmberg; hasta límite adm. exp. 240; por este hasta Carlos Sandoval; por Sandoval hasta Humahuaca; hasta 25 de Mayo; por 25 de Mayo hasta Juan A. García; hasta Laprida; por Laprida hasta Av. Rep. Argentina; hasta Pedro de Irigoyen; por esta hasta Demichelis; hasta Gabino Ezeiza; por Ezeiza hasta Av. Espora; hasta Juan B. Justo; por Justo hasta Av. Rep. Argentina; hasta Estanislao Zeballos; por Zeballos hasta Av. Espora; hasta Sargento Ortiz; por Ortiz hasta Iturralde; hasta Fernando Leyes; hasta Romero; hasta Angel Gallardo; hasta Chivilcoy; por Chivilcoy hasta Juan Cagliero; por esta hasta Holmberg"
        }
    },
    "ANEXO IX": {
        "localidad": "Rafael Calzada",
        "barrios": {
            "Capilla Del Señor": "Perón y Rep. Argentina; hasta Melide; hasta Jorge; hasta Grandville; hasta San Martin; hasta Erezcano; hasta Perón .",
            "La Loma": "Rep. Argentina y Perón; hasta Humberto Primo; hasta Erezcano; hasta Perón .",
            "San Javier": "Carrillo y Jorge; hasta La Pampa; hasta San Martin; hasta Mendoza; hasta Perón; hasta San Luis; hasta Falucho; hasta Lerroux; hasta San Martin; hasta Carrillo .",
            "Villa Rafael Calzada": "Jorge y Rafael Calzada; hasta Rep. Argentina; hasta Humberto Primo; hasta San Luis; hasta Falucho; hasta Lerroux; hasta San Martin; hasta Carrillo; hasta Jorge .",
            "2 de abril (RC)": "La Pampa y Jorge; hasta La Tijereta; hasta San Martin; hasta La Pampa .",
            "14 de noviembre": "Donato Álvarez y Jorge; hasta La Tijereta; hasta San Martin; hasta Donato Álvarez .",
            "San Jerónimo": "San Martin y Mendoza; hasta Perón; hasta El Picaflor; hasta San Martin .",
            "Asunción": "San Luis y Perón; hasta El Picaflor; hasta Falucho; hasta San Luis."
        }
    },
    "ANEXO X": {
        "localidad": "San Francisco De Asis",
        "barrios": {
            "Cerrito": "Estanislao del Campo y Monteverde; hasta Figueroa; hasta Virrey Loreto; hasta Estanislao del Campo .",
            "Don Orione": "Figueroa y Monteverde; hasta Marconi; hasta Lacaze; hasta Paso; hasta Monteverde; hasta Blas Parera; hasta Jauretche; hasta Humahuaca; hasta Araujo; hasta Figueroa .",
            "La Esther": "Rep. Argentina y Monteverde; hasta Estanislao del Campo; hasta Araujo; hasta Rep. Argentina .",
            "Las Latitas": "Humahuaca y Jauretche; hasta Blas Parera; hasta Araujo; hasta Humahuaca .",
            "Martin Fierro": "Estanislao del Campo y Virrey Loreto; hasta Figueroa; hasta Araujo; hasta Estanislao del Campo.",
            "Suterh 2": "Rinaldi y Araujo; hasta Rio Mayo; hasta Rufino Córdoba; hasta Rinaldi.  BI.PER.MU.: Humahuaca y Araujo; hasta Los Olivos; hasta Arias; hasta Araujo.",
            "Libertad": "Iglesia Paz y Araujo; hasta Rinaldi; hasta 25 de mayo; hasta Iglesia Paz.",
            "6 de diciembre": "Humahuaca y Los Olivos; hasta Arias; hasta Araujo; hasta Blas Parera; hasta Sandoval; hasta Humahuaca.",
            "Don Orione Viejo": "Aconquija y Araujo; hasta Iglesia Paz; hasta 25 de mayo; hasta Granada Nicolás; hasta Córdoba Rufino; hasta Aconquija.",
            "Suterh 1": "Araujo y calle sin nombre; hasta Bragado; hasta Algarrobo; hasta Araujo .",
            "Soom": "Araujo y Humahuaca; hasta Algarrobo; hasta calle sin nombre; hasta Araujo .",
            "Espacio Vacío 6": "25 de Mayo y Humahuaca; por Humahuaca hasta Algarrobo; por Algarrobo hasta su continuación como Rufino Córdoba; por Córdoba hasta Leonor Rinaldi; por Rinaldi hasta 25 de Mayo; por 25 de Mayo hasta Humahuaca"
        }
    },
    "ANEXO XI": {
        "localidad": "San Francisco Solano",
        "barrios": {
            "Guadalupe": "El Picaflor y San Martin; hasta El Mirlo; hasta Perón; hasta El Picaflor .",
            "Las Lomas De San Francisco": "Charcas Sur y Lacaze; hasta Lirio; hasta Humberto Primo; hasta Charcas Sur .",
            "Las Tunas": "El Picaflor y Falucho; hasta Charcas Norte; hasta Humberto Primo; hasta El Picaflor.",
            "Los Chalets": "Rawson y No me Olvides; hasta Charcas Sur; hasta Pensamiento Sur; hasta Rawson.",
            "Parque Uno": "Rawson y Salaberry; hasta Charcas Sur; hasta No me Olvides; hasta Rawson.",
            "Parque Dos": "Rawson y Pensamiento Sur; hasta Charcas Sur; hasta Lacaze; hasta Rawson .",
            "Complejo Habitacional SFS": "Rawson y Salaberry; hasta Humberto Primo; hasta Charcas Sur; hasta Salaberry.",
            "Nueva Pompeya": "Rawson y Lacaze; hasta Charcas Sur; hasta Monteverde; hasta Rawson .",
            "San Agustin": "El Pato y Donato Álvarez; hasta El Cóndor; hasta Humberto Primo; hasta Charcas Norte; hasta El Pato .",
            "Santa Catalina": "El Mirlo y San Martin; hasta Héroe de Malvinas; hasta Perón; hasta El Mirlo .",
            "Santa Isabel": "Charcas Sur y Lacaze; hasta Donato Álvarez; hasta Monteverde; hasta Charcas Sur .",
            "Villa Laura": "San Martin y Héroe de Malvinas; hasta Perón; hasta Donato Álvarez; hasta San Martin .",
            "Zabala": "El Picaflor y Perón; hasta Charcas Norte; hasta Falucho; hasta El Picaflor ."
        }
    },
    "ANEXO XII": {
        "localidad": "San José",
        "barrios": {
            "San Ramón": "Depósito Cattorini y Juan de Garay; hasta Donato Álvarez; hasta Alvear Carlos; hasta Cattorini .",
            "La Gloria": "Amenedo y La Tijereta; hasta 30 de septiembre; hasta El Chaja; hasta Los Nogales; hasta Donato Álvarez; hasta Amenedo .",
            "8 de noviembre": "Cattorini y Los Nogales; hasta Donato Álvarez; hasta Virrey Vértiz; hasta Cattorini .",
            "8 de diciembre": "El Cardenal y Amenedo; hasta La Tijereta; hasta Bynnon; hasta El Cardenal.",
            "Garay": "El Hornero y Juan de Garay; hasta vías ex FFCC; hasta Alvear; hasta Héroe de Malvinas; hasta 30 de septiembre; hasta El Hornero.",
            "Santa Maria (SJ)": "Cattorini y Virrey Vértiz; hasta Alvear Carlos; hasta Donato Álvarez; hasta Virrey Vértiz .",
            "La Loma (SJ)": "La Tijereta y Amenedo; hasta Donato Álvarez; hasta Bynnon; hasta La Tijereta .",
            "La Victoria": "El Cóndor y Bynnon; hasta Donato Álvarez; hasta Jorge; hasta La Tijereta; hasta Piedrabuena; hasta El Cóndor .",
            "Puerto Argentino": "Jorge y El Tordo; hasta La Tijereta; hasta Piedrabuena; hasta El Cóndor; hasta Bynnon; hasta El Hornero; hasta Rosales; hasta El Tordo; hasta Jorge.",
            "La Tablada": "Rosales y Santa Ana; hasta Amenedo; hasta El Cardenal; hasta Bynnon; hasta El Hornero; hasta Rosales.",
            "La Cava": "Jorge y Chubut; hasta Piedrabuena; hasta El Picaflor; hasta Jorge.",
            "Virgen De Luján - Ombú": "Piedrabuena y Chubut; hasta Nother; hasta Santa Ana; hasta Rosales; hasta El Tordo; hasta Jorge; hasta El Picaflor; hasta Piedrabuena .",
            "Agustín Ramírez": "Santa Cruz y Amenedo; hasta Santa Ana; hasta Nother; hasta Santa Cruz.",
            "Altos De Santa Ana": "Santa Ana y Juan de Garay; hasta El Hornero; hasta 30 de Septiembre; hasta Teresa de Calcuta; hasta Amenedo; hasta Santa Ana.",
            "San José": "Jorge y San Juan; hasta Juan de Garay; hasta Santa Ana; hasta Amenedo; hasta Santa Cruz; hasta Nother; hasta Chubut; hasta Jorge.",
            "Espacio Vacío 7": "Depósito Cattorini y Juan de Garay; por Garay hasta vías FC; hasta Carlos Alvear; hasta Héroe de Malvinas; hasta 30 de Septiembre; hasta Cattorini ."
        }
    }
}

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
