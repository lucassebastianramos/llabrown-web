import json
import codecs

# Read clean_dict.txt
with codecs.open('clean_dict.txt', 'r', 'utf-8') as f:
    text = f.read()

# Replace prefix
if text.startswith('DATOS_ORDENANZA = '):
    text = text.replace('DATOS_ORDENANZA = ', '')

data = json.loads(text)

# Inject the 7 Espacios
if 'ANEXO IV' in data:
    data['ANEXO IV']['barrios']['Espacio Vacío 1'] = "Av. Tomas Espora y Alberto Gerchunoff; por Gerchunoff hasta Pte. Castillo; por Castillo hasta Capitán Olivera; por Capitán Olivera hasta Av. Tomas Espora; por Espora hasta Gerchunoff"
    data['ANEXO IV']['barrios']['Espacio Vacío 2'] = "Raúl Espoile y Gobernador Arias; por Arias hasta Intendente Arreghini; por Arreghini hasta Vicepresidente Alsina; por Alsina hasta Arreghini; por Arreghini hasta Pte. Mitre; por Mitre hasta Raúl Espoile; por Espoile hasta Arias"
    data['ANEXO IV']['barrios']['Espacio Vacío 3'] = "Av. Tomas Espora y El Plata; por El Plata hasta Pte. Castillo; por Castillo hasta Montevideo; por Montevideo hasta Gobernador Arias; por Arias hasta Garibaldi; por Garibaldi hasta Av. Tomas Espora; por Espora hasta El Plata"

if 'ANEXO VI' in data:
    data['ANEXO VI']['barrios']['Espacio Vacío 4'] = "R.P. N° 16 y Julio Fonrouge; por Fonrouge hasta Argentina; por Argentina hasta R.P. N° 16; por R.P. N° 16 hasta Fonrouge"

if 'ANEXO VIII' in data:
    data['ANEXO VIII']['barrios']['Espacio Vacío 5'] = "Juan Cagliero y Holmberg; hasta límite adm. exp. 240; por este hasta Carlos Sandoval; por Sandoval hasta Humahuaca; hasta 25 de Mayo; por 25 de Mayo hasta Juan A. García; hasta Laprida; por Laprida hasta Av. Rep. Argentina; hasta Pedro de Irigoyen; por esta hasta Demichelis; hasta Gabino Ezeiza; por Ezeiza hasta Av. Espora; hasta Juan B. Justo; por Justo hasta Av. Rep. Argentina; hasta Estanislao Zeballos; por Zeballos hasta Av. Espora; hasta Sargento Ortiz; por Ortiz hasta Iturralde; hasta Fernando Leyes; hasta Romero; hasta Angel Gallardo; hasta Chivilcoy; por Chivilcoy hasta Juan Cagliero; por esta hasta Holmberg"

if 'ANEXO X' in data:
    data['ANEXO X']['barrios']['Espacio Vacío 6'] = "25 de Mayo y Humahuaca; por Humahuaca hasta Algarrobo; por Algarrobo hasta su continuación como Rufino Córdoba; por Córdoba hasta Leonor Rinaldi; por Rinaldi hasta 25 de Mayo; por 25 de Mayo hasta Humahuaca"

if 'ANEXO XII' in data:
    data['ANEXO XII']['barrios']['Espacio Vacío 7'] = "depósito de la Cattorini y Juan de Garay; por Garay hasta vías del FFCC; por vías hasta Carlos Alvear; por Alvear hasta Héroe de Malvinas; por esta hasta 30 de Septiembre; por 30 de Septiembre hasta Cattorini"

# Write it back
with codecs.open('clean_dict.txt', 'w', 'utf-8') as f:
    f.write('DATOS_ORDENANZA = ' + json.dumps(data, ensure_ascii=False, indent=4))

print(f"Total barrios: {sum(len(v['barrios']) for v in data.values())}")
