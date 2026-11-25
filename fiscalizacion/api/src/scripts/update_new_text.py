import re, json, codecs

f = codecs.open('nuevo_texto.txt', 'r', 'utf-8').read()
regex_nombres = r'([\w\s\(\)\-áéíóúÁÉÍÓÚñÑ\/]+?):\s*(.*?)(?=(?:[\w\s\(\)\-áéíóúÁÉÍÓÚñÑ\/]+?:)|ANEXO|$)'

# Load existing
with codecs.open('clean_dict.txt', 'r', 'utf-8') as file:
    text = file.read().replace('DATOS_ORDENANZA = ', '')
datos = json.loads(text)

anexo_pattern = re.compile(r'(ANEXO [IXV]+) - ([A-Z \xcd\xd1\xd3\xc9\xc1]+)')
anexos_matches = list(anexo_pattern.finditer(f))

for i, match in enumerate(anexos_matches):
    anexo = match.group(1).strip()
    localidad = match.group(2).strip().title()
    
    start_pos = match.end()
    end_pos = anexos_matches[i+1].start() if i + 1 < len(anexos_matches) else len(f)
    texto_anexo = f[start_pos:end_pos]
    
    if anexo not in datos:
        datos[anexo] = {'localidad': localidad, 'barrios': {}}
        
    for bm in re.finditer(regex_nombres, texto_anexo):
        bname = bm.group(1).strip().lstrip('. ')
        bdesc = bm.group(2).strip()
        if bname and bdesc:
            datos[anexo]['barrios'][bname] = bdesc

with codecs.open('clean_dict.txt', 'w', 'utf-8') as out:
    out.write('DATOS_ORDENANZA = ' + json.dumps(datos, ensure_ascii=False, indent=4))

print(f"Total barrios: {sum(len(v['barrios']) for v in datos.values())}")
