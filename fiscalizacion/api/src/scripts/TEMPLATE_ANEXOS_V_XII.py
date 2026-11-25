"""
TEMPLATE - Anexos V a XII de la Ordenanza Municipal N° 13.906

Este archivo proporciona un template para agregar los anexos restantes
de barrios a tu script de generación de GeoJSON.

Copia y pega los datos donde corresponda en generate_barrios_geojson.py,
después de la sección "DATOS SEGÚN ORDENANZA N° 13.906"

INSTRUCCIONES:
===============

1. Copia el bloque de BARRIOS_ANEXO_[N]_[LOCALIDAD] que corresponda
2. Pégalo en generate_barrios_geojson.py ANTES del comentario "# TODO: Agregar ANEXOS V-XII..."
3. Agrega la variable a la tupla TODOS_LOS_BARRIOS al final
4. Ejecuta: python api/src/scripts/generate_barrios_geojson.py

EJEMPLO:
========

Si tienes el ANEXO V de Isidro Casanova, busca la sección:

    # ANEXO V - ISIDRO CASANOVA

Luego copia el bloque BARRIOS_ANEXO_V_ISIDRO_CASANOVA y pégalo en generate_barrios_geojson.py

Después modifica:

    TODOS_LOS_BARRIOS = (
        BARRIOS_ANEXO_I_ADROGUÉ +
        BARRIOS_ANEXO_II_BURZACO +
        BARRIOS_ANEXO_III_CLAYPOLE +
        BARRIOS_ANEXO_IV_GLEW +
        BARRIOS_ANEXO_V_ISIDRO_CASANOVA +  # ← AGREGAR AQUÍ
    )

================================================================================
TEMPLATE PARA CADA ANEXO - Copia y personaliza según tus datos
================================================================================
"""

# ANEXO V - ISIDRO CASANOVA (TEMPLATE)
# ================================================================================
# Reemplaza los valores ficticios con los datos reales de la Ordenanza

"""
BARRIOS_ANEXO_V_ISIDRO_CASANOVA = [
    BarrioDefinition(
        nombre="Barrio 1",
        localidad="Isidro Casanova",
        descripcion="Calle A y Calle B; por B hasta Calle C; por C hasta Calle D; ..."
    ),
    BarrioDefinition(
        nombre="Barrio 2",
        localidad="Isidro Casanova",
        descripcion="Calle X y Calle Y; por Y hasta Calle Z; ..."
    ),
]
"""

# ANEXO VI - LONGCHAMPS (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_VI_LONGCHAMPS = [
    BarrioDefinition(
        nombre="Centro",
        localidad="Longchamps",
        descripcion="..."
    ),
]
"""

# ANEXO VII - LOMAS DEL MIRADOR (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_VII_LOMAS_DEL_MIRADOR = [
    BarrioDefinition(
        nombre="Centro",
        localidad="Lomas del Mirador",
        descripcion="..."
    ),
]
"""

# ANEXO VIII - PÉREZ MILLÁN (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_VIII_PEREZ_MILLAN = [
    BarrioDefinition(
        nombre="Centro",
        localidad="Pérez Millán",
        descripcion="..."
    ),
]
"""

# ANEXO IX - PNTE. DE LA NORIA (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_IX_PNTE_DE_LA_NORIA = [
    BarrioDefinition(
        nombre="Centro",
        localidad="Pte. de la Noria",
        descripcion="..."
    ),
]
"""

# ANEXO X - TEMPERLEY (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_X_TEMPERLEY = [
    BarrioDefinition(
        nombre="Centro",
        localidad="Temperley",
        descripcion="..."
    ),
]
"""

# ANEXO XI - ZONA RURAL (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_XI_ZONA_RURAL = [
    BarrioDefinition(
        nombre="Paraje Arizpe",
        localidad="Zona Rural",
        descripcion="..."
    ),
]
"""

# ANEXO XII - (TEMPLATE)
# ================================================================================

"""
BARRIOS_ANEXO_XII_OTRO = [
    BarrioDefinition(
        nombre="Tu Barrio",
        localidad="Tu Localidad",
        descripcion="..."
    ),
]
"""


# ================================================================================
# GUÍA PARA PROCESAR LA ORDENANZA
# ================================================================================

"""
PASO A PASO para cada barrio en la Ordenanza:

1. IDENTIFICA el nombre del barrio y la localidad
   
   Ejemplo de la Ordenanza:
   "ANEXO I - ADROGUÉ
    Barrio Vattuone: ..."
   
   → nombre = "Barrio Vattuone"
   → localidad = "Adrogué"

2. COPIA la descripción texual EXACTAMENTE como aparece
   
   Ejemplo:
   "Juan Manuel Estrada y Pte. Arturo Illia; por Illia hasta Av. Tomás Espora; 
    por Espora hasta Pte. Juan Domingo Perón; ..."
   
   Tu descripción debe empezar con "CALLE1 y CALLE2" y continuar con "por X hasta Y"

3. ESTRUCTURA correcta:
   
   ❌ INCORRECTO: "Empieza desde Juan Manuel Estrada..."
   ✅ CORRECTO: "Juan Manuel Estrada y Pte. Arturo Illia; por Illia hasta..."

4. NOMENCLATURA de calles:
   
   - Usa los nombres EXACTOS de la Ordenanza
   - Respeta abreviaturas: "Av.", "Pte.", "Gral.", "Sgto."
   - Si la Ordenanza dice "Pcia. de B.A.", cópialo así exacto

5. PRUEBA:
   
   Una vez agregues todos los barrios, ejecuta:
   python api/src/scripts/generate_barrios_geojson.py
   
   Si alguna calle no se encuentra, el script mostrará un warning.
   Luego puedes hacer búsquedas manuales en:
   https://nominatim.openstreetmap.org/

================================================================================
EJEMPLO COMPLETO - Cómo procesar un barrio
================================================================================

De la Ordenanza:
"ANEXO II - BURZACO
 Barrio Corimayo: Hugo del Carril y Av. Espora; por Espora hasta Araujo; 
 por Araujo hasta Av. Rep. Argentina; por Rep. Argentina hasta Hugo del Carril."

Convertido a código:

    BarrioDefinition(
        nombre="Barrio Corimayo",
        localidad="Burzaco",
        descripcion="Hugo del Carril y Av. Espora; por Espora hasta Araujo; por Araujo hasta Av. Rep. Argentina; por Rep. Argentina hasta Hugo del Carril."
    ),

Pasos del script:
1. Extrae pares: (Hugo del Carril, Av. Espora)
2. Luego: (Av. Espora, Araujo), (Araujo, Av. Rep. Argentina), etc.
3. Geocodifica cada par: busca "Hugo del Carril y Av. Espora, Almirante Brown"
4. Crea polígono conectando todos los puntos
5. Si el último punto != primer punto, los conecta para cerrar

================================================================================
"""


# ================================================================================
# REFERENCIAS DE LOCALIDADES - Para copiar/pegar
# ================================================================================

LOCALIDADES_TEMPLATE = {
    "Adrogué": "ANEXO I",
    "Burzaco": "ANEXO II",
    "Claypole": "ANEXO III",
    "Glew": "ANEXO IV",
    "Isidro Casanova": "ANEXO V",
    "Longchamps": "ANEXO VI",
    "Lomas del Mirador": "ANEXO VII",
    "Pérez Millán": "ANEXO VIII",
    "Pte. de la Noria": "ANEXO IX",
    "Temperley": "ANEXO X",  # O "Temperley A" y "Temperley B"
    "Zona Rural": "ANEXO XI",
}
