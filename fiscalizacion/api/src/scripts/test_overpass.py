import requests

url = "http://overpass-api.de/api/interpreter"
query = """
[out:json];
area["name"="Almirante Brown"]["admin_level"="6"]->.a;
way["name"~"Estrada", i](area.a)->.w1;
way["name"~"Arturo Illia", i](area.a)->.w2;
node(w.w1)(w.w2);
out center;
"""

response = requests.get(url, params={'data': query})
print(response.status_code)
print(response.text[:500])
