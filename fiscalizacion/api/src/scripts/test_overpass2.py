import urllib.request
import urllib.parse
import json

def get_intersection(calle1, calle2):
    url = "http://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    area["name"="Almirante Brown"]["admin_level"="6"]->.a;
    way["name"~"{calle1}", i](area.a)->.w1;
    way["name"~"{calle2}", i](area.a)->.w2;
    node(w.w1)(w.w2);
    out center;
    """
    data = urllib.parse.urlencode({'data': query}).encode('utf-8')
    req = urllib.request.Request(url, data=data)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('elements'):
                el = result['elements'][0]
                return el.get('lat'), el.get('lon')
    except Exception as e:
        print(f"Error: {e}")
    return None

print("Estrada y Arturo Illia:", get_intersection("Estrada", "Arturo Illia"))
print("Peron y Espora:", get_intersection("Perón", "Espora"))
