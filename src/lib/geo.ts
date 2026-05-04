// City center fallback coordinates (lat, lng) for major Indian cities
export const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  "New Delhi": [28.6139, 77.209],
  Bangalore: [12.9716, 77.5946],
  Bengaluru: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Pune: [18.5204, 73.8567],
  Kolkata: [22.5726, 88.3639],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Chandigarh: [30.7333, 76.7794],
  Gurgaon: [28.4595, 77.0266],
  Gurugram: [28.4595, 77.0266],
  Noida: [28.5355, 77.391],
  Goa: [15.2993, 74.124],
  Kochi: [9.9312, 76.2673],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Surat: [21.1702, 72.8311],
  Nagpur: [21.1458, 79.0882],
  Coimbatore: [11.0168, 76.9558],
  Vadodara: [22.3072, 73.1812],
  Patna: [25.5941, 85.1376],
  Mysore: [12.2958, 76.6394],
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