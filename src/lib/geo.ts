// Lucknow-only project: city + locality fallback coordinates (lat, lng).
export const CITY_COORDS: Record<string, [number, number]> = {
  Lucknow: [26.8467, 80.9462],
  "Gomti Nagar": [26.8500, 81.0030],
  Hazratganj: [26.8500, 80.9445],
  "Indira Nagar": [26.8740, 80.9990],
  Aliganj: [26.8950, 80.9420],
  Mahanagar: [26.8770, 80.9550],
  Aminabad: [26.8470, 80.9300],
  Chowk: [26.8650, 80.9100],
  Alambagh: [26.8050, 80.8950],
  "Vibhuti Khand": [26.8550, 81.0050],
  Jankipuram: [26.9180, 80.9400],
  "Vikas Nagar": [26.9050, 80.9650],
  Rajajipuram: [26.8420, 80.8700],
  Telibagh: [26.7700, 80.9550],
  "Sushant Golf City": [26.7700, 81.0150],
  "Sultanpur Road": [26.7800, 81.0200],
  "Faizabad Road": [26.8800, 81.0100],
  "Kanpur Road": [26.7900, 80.8700],
  Aashiana: [26.7950, 80.9100],
  Chinhat: [26.8800, 81.0700],
  "Mall Avenue": [26.8550, 80.9400],
};

export const getPropertyCoords = (p: any): [number, number] | null => {
  if (p?.latitude && p?.longitude) return [Number(p.latitude), Number(p.longitude)];
  const c = p?.city && CITY_COORDS[p.city];
  if (c) {
    // jitter slightly so multiple in same city don't overlap exactly
    const seed = (p.id || "").split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
    const jx = ((seed % 100) - 50) / 5000;
    const jy = (((seed * 7) % 100) - 50) / 5000;
    return [c[0] + jx, c[1] + jy];
  }
  return null;
};

// Haversine distance in km
export const haversineKm = (a: [number, number], b: [number, number]) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Geocode an address via OpenStreetMap Nominatim (no API key, rate-limited; only call once per UI action)
export const geocodeNominatim = async (q: string): Promise<[number, number] | null> => {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } }
    );
    const j = await r.json();
    if (j?.[0]) return [Number(j[0].lat), Number(j[0].lon)];
  } catch (e) {
    console.warn("geocode failed", e);
  }
  return null;
};

// Fetch nearby POIs (schools, hospitals, metro/transit) via Overpass API
export type Poi = { id: number; name: string; type: "school" | "hospital" | "metro"; lat: number; lng: number; distanceKm: number };

export const fetchNearbyPOIs = async (
  center: [number, number],
  radiusMeters = 1500
): Promise<Poi[]> => {
  const [lat, lng] = center;
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="school"](around:${radiusMeters},${lat},${lng});
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["station"="subway"](around:${radiusMeters},${lat},${lng});
      node["public_transport"="station"](around:${radiusMeters},${lat},${lng});
    );
    out body 60;
  `;
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    const j = await r.json();
    return (j.elements || [])
      .map((el: any): Poi | null => {
        const tags = el.tags || {};
        let type: Poi["type"] = "school";
        if (tags.amenity === "hospital" || tags.amenity === "clinic") type = "hospital";
        else if (tags.railway === "station" || tags.station === "subway" || tags.public_transport) type = "metro";
        else if (tags.amenity === "school") type = "school";
        else return null;
        return {
          id: el.id,
          name: tags.name || (type === "school" ? "School" : type === "hospital" ? "Healthcare" : "Transit"),
          type,
          lat: el.lat,
          lng: el.lon,
          distanceKm: haversineKm(center, [el.lat, el.lon]),
        };
      })
      .filter(Boolean)
      .sort((a: Poi, b: Poi) => a.distanceKm - b.distanceKm)
      .slice(0, 30);
  } catch (e) {
    console.warn("overpass failed", e);
    return [];
  }
};