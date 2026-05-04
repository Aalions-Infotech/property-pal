import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getPropertyCoords } from "@/lib/geo";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const priceIcon = (label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:hsl(45 95% 45%);color:#1a1a2e;padding:4px 10px;border-radius:14px;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap;">${label}</div>`,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });

const formatShort = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  return `₹${(price / 1000).toFixed(0)}K`;
};

interface Props {
  properties: any[];
  height?: string;
  center?: [number, number];
  radiusKm?: number;
}

const PropertiesMapView = ({ properties, height = "calc(100vh - 14rem)", center, radiusKm }: Props) => {
  const points = properties
    .map(p => ({ p, coords: getPropertyCoords(p) }))
    .filter(x => x.coords) as { p: any; coords: [number, number] }[];

  const mapCenter: [number, number] =
    center || (points[0]?.coords ?? [22.9734, 78.6569]); // India center

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card" style={{ height }}>
      <MapContainer center={mapCenter} zoom={center ? 12 : 5} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && radiusKm && (
          <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "hsl(45 95% 45%)", fillOpacity: 0.08, weight: 2 }} />
        )}
        {points.map(({ p, coords }) => (
          <Marker key={p.id} position={coords} icon={priceIcon(formatShort(Number(p.price)))}>
            <Popup>
              <div className="text-xs" style={{ minWidth: 180 }}>
                <Link to={`/property/${p.id}`} className="font-semibold block mb-1">{p.title}</Link>
                <div className="text-muted-foreground">{p.locality}, {p.city}</div>
                <div className="mt-1">
                  {p.bedrooms && <span>{p.bedrooms} BHK · </span>}
                  {p.area && <span>{p.area} {p.area_unit || "sq.ft"}</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PropertiesMapView;