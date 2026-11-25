import json
from geopy.geocoders import OpenCage

api_key = "c79b0067911a4855adcff309fb6eec19"
geolocator = OpenCage(api_key)

result = geolocator.geocode("Estrada y Arturo Illia, Almirante Brown, Argentina")
with open("opencage_result.json", "w", encoding="utf-8") as f:
    json.dump(result.raw if result else {}, f, indent=2, ensure_ascii=False)
