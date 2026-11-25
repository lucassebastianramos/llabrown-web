import re
def parse_calles_stateful(texto: str, calle_actual: str):
    texto_original = texto.strip()
    texto = texto.lower()
    
    # Caso 1: "por X hasta Y"
    if "por " in texto and "hasta " in texto:
        t = texto.replace("por ", "").replace("hasta ", "y")
        parts = re.split(r'\s+y\s+|\s+e\s+', t)
        if len(parts) >= 2:
            return parts[0].strip(), parts[1].strip(), parts[1].strip()
            
    # Caso 2: "hasta X" (implicit 'por calle_actual hasta X')
    if texto.startswith("hasta "):
        t = texto.replace("hasta ", "").strip()
        return calle_actual, t, t
        
    # Caso 3: "X y Y" o "X e Y"
    parts = re.split(r'\s+y\s+|\s+e\s+', texto)
    if len(parts) >= 2:
        return parts[0].strip(), parts[1].strip(), parts[1].strip()
        
    # Fallback
    return None, None, calle_actual

limites = "Estrada y Arturo Illia; por Illia hasta Espora; por Espora hasta Perón; por Perón hasta Villarruel; por Villarruel hasta Estrada ."
limites_limpios = limites.rstrip('.')
intersecciones = [i.strip() for i in limites_limpios.split(';') if i.strip()]

calle_actual = ""
for inter in intersecciones:
    c1, c2, calle_actual = parse_calles_stateful(inter, calle_actual)
    print(f"[{inter}] -> c1='{c1}', c2='{c2}', next='{calle_actual}'")
