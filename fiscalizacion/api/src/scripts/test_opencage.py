import os
from geopy.geocoders import OpenCage

api_key = "c79b0067911a4855adcff309fb6eec19"
geolocator = OpenCage(api_key)

queries = [
    "Estrada y Arturo Illia, Almirante Brown, Buenos Aires, Argentina",
    "Estrada and Arturo Illia, Almirante Brown, Buenos Aires, Argentina",
    "Estrada esquina Arturo Illia, Almirante Brown, Buenos Aires, Argentina",
    "Estrada & Arturo Illia, Almirante Brown, Buenos Aires, Argentina"
]

for query in queries:
    location = geolocator.geocode(query)
    print(f"Query: {query}")
    if location:
        print(f"  Encontrado: {location.address}")
        print(f"  Coordenadas: {location.latitude}, {location.longitude}")
    else:
        print("  No encontrado")
    print("-" * 50)
