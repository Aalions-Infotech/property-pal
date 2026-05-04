import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { School, Building2, Train, Hospital, Loader2 } from "lucide-react";
import { fetchNearbyPOIs, type Poi } from "@/lib/geo";

// Fix default marker icon paths (Vite/webpack issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);"><span style="transform:rotate(45deg);font-size:14px;">${emoji}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const ICONS = {
  property: makeIcon("hsl(45 95% 45%)", "🏠"),
  school: makeIcon("hsl(217 91% 60%)", "🎓"),
  hospital: makeIcon("hsl(0 84% 60%)", "✚"),
  metro: makeIcon("hsl(142 70% 40%)", "🚇"),
};

interface Props {
  center: [number, number];
  title?: string;
  showNearby?: boolean;
  height?: string;
  radiusMeters?: number;
}

const PropertyMap = ({ center, title = "Property", showNearby = true, height = "400px", radiusMeters = 1500 }: Props) => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "school" | "hospital" | "metro">("all");

  useEffect(() => {
    if (!showNearby) return;
    setLoading(true);
    fetchNearbyPOIs(center, radiusMeters).then(p => {
      setPois(p);
      setLoading(false);
    });
  }, [center[0], center[1], showNearby, radiusMeters]);

  const filtered = filter === "all" ? pois : pois.filter(p => p.type === filter);

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      {showNearby && (
        <div className="flex items-center gap-2 p-3 border-b border-border flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1">Show nearby:</span>
          {([
            { key: "all", label: "All", icon: Building2 },
            { key: "school", label: "Schools", icon: School },
            { key: "hospital", label: "Hospitals", icon: Hospital },
            { key: "metro", label: "Transit", icon: Train },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                filter === key ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70 text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
          {!loading && pois.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">{pois.length} places nearby</span>
          )}
        </div>
      )}
      <div style={{ height, width: "100%" }}>
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle center={center} radius={radiusMeters} pathOptions={{ color: "hsl(45 95% 45%)", fillOpacity: 0.05, weight: 1 }} />
          <Marker position={center} icon={ICONS.property}>
            <Popup>
              <strong>{title}</strong>
            </Popup>
          </Marker>
          {filtered.map(p => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={ICONS[p.type]}>
              <Popup>
                <div className="text-xs">
                  <strong>{p.name}</strong>
                  <br />
                  <span className="capitalize">{p.type}</span> · {p.distanceKm.toFixed(2)} km away
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default PropertyMap;