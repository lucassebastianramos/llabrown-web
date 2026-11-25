import requests
from geopy.geocoders import OpenCage

api_key = "c79b0067911a4855adcff309fb6eec19"
geolocator = OpenCage(api_key)

def get_street_bounds(calle):
    query = f"{calle}, Almirante Brown, Buenos Aires, Argentina"
    loc = geolocator.geocode(query)
    if loc and 'bounds' in loc.raw:
        b = loc.raw['bounds']
        return {
            'min_lat': b['southwest']['lat'],
            'max_lat': b['northeast']['lat'],
            'min_lng': b['southwest']['lng'],
            'max_lng': b['northeast']['lng']
        }
    return None

def intersect_bounds(b1, b2):
    if not b1 or not b2: return None
    min_lat = max(b1['min_lat'], b2['min_lat'])
    max_lat = min(b1['max_lat'], b2['max_lat'])
    min_lng = max(b1['min_lng'], b2['min_lng'])
    max_lng = min(b1['max_lng'], b2['max_lng'])
    
    if min_lat <= max_lat and min_lng <= max_lng:
        # Intersectan! devolvemos el centro
        return (min_lat + max_lat) / 2, (min_lng + max_lng) / 2
    return None

b1 = get_street_bounds("Estrada")
b2 = get_street_bounds("Arturo Illia")
print("B1 Estrada:", b1)
print("B2 Arturo Illia:", b2)
inter = intersect_bounds(b1, b2)
print("Intersección Bounding Boxes:", inter)

# Comparado con Nominatim original si funcionara
# lat: -34.79721, lng: -58.38351
