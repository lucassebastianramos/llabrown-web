import re, json, codecs

f = codecs.open('actualizar_ordenanza.py', 'r', 'utf-8').read()
texto = re.search(r'texto = """(.*?)"""', f, re.DOTALL).group(1)
regex_nombres = r'([\w\s\(\)\-áéíóúÁÉÍÓÚñÑ]+?):\s*(.*?)(?=(?:[\w\s\(\)\-áéíóúÁÉÍÓÚñÑ]+?:)|$)'
datos = {}
anexo_pattern = re.compile(r'(ANEXO [IXV]+) - ([A-Z \xcd\xd1\xd3\xc9\xc1]+):')
anexos_matches = list(anexo_pattern.finditer(texto))

for i, match in enumerate(anexos_matches):
    datos[match.group(1)] = {
        'localidad': match.group(2).title(),
        'barrios': {
            bm.group(1).strip().lstrip('. '): bm.group(2).strip()
            for bm in re.finditer(regex_nombres, texto[match.end():anexos_matches[i+1].start() if i + 1 < len(anexos_matches) else len(texto)])
            if bm.group(1) and bm.group(2)
        }
    }

codecs.open('clean_dict.txt', 'w', 'utf-8').write('DATOS_ORDENANZA = ' + json.dumps(datos, ensure_ascii=False, indent=4))
