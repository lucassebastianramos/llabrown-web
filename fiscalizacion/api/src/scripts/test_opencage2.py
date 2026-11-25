import os
from geopy.geocoders import OpenCage

api_key = "c79b0067911a4855adcff309fb6eec19"
geolocator = OpenCage(api_key)

queries = [
    "Estrada y Arturo Illia, Almirante Brown",
    "Estrada and Arturo Illia, Almirante Brown",
    "Estrada esquina Arturo Illia, Almirante Brown",
    "Estrada / Arturo Illia, Almirante Brown",
    "Intersection of Estrada and Arturo Illia, Almirante Brown",
    "Estrada at Arturo Illia, Almirante Brown"
]

for query in queries:
    # Adding a country code bias to OpenCage might help
    location = geolocator.geocode(query, countrycode='ar')
    print(f"Query: {query}")
    if location:
        print(f"  Encontrado: {location.address}")
        print(f"  Coordenadas: {location.latitude}, {location.longitude}")
        # Print raw components to see if it actually found the streets
        print(f"  Raw: {location.raw.get('components', {})}")
    else:
        print("  No encontrado")
    print("-" * 50)
