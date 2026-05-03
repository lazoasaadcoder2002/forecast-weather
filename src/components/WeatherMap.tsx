import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import { reverseGeocode, type GeoLocation } from "@/lib/weather";

// Fix default marker icons (Leaflet + bundlers issue)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  initial: GeoLocation;
  onPick: (loc: GeoLocation) => void;
}

const ClickHandler = ({ onPick }: { onPick: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const WeatherMap = ({ initial, onPick }: Props) => {
  const [pos, setPos] = useState<[number, number]>([initial.latitude, initial.longitude]);
  const [label, setLabel] = useState<string>(initial.name);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPos([initial.latitude, initial.longitude]);
    setLabel(initial.name);
  }, [initial]);

  const handlePick = async (lat: number, lon: number) => {
    setPos([lat, lon]);
    setLoading(true);
    const place = await reverseGeocode(lat, lon);
    setLoading(false);
    const next: GeoLocation =
      place ?? {
        id: Date.now(),
        name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        country: "",
        latitude: lat,
        longitude: lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    setLabel(next.name);
    onPick(next);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        Tap anywhere on the map to see the weather for that spot.
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border">
        <MapContainer
          center={pos}
          zoom={4}
          style={{ height: "100%", width: "100%", minHeight: 360 }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={pos} icon={icon} />
          <ClickHandler onPick={handlePick} />
        </MapContainer>
        {loading && (
          <div className="absolute right-3 top-3 z-[400] glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating…
          </div>
        )}
      </div>
      <div className="text-sm">
        Selected: <span className="font-medium text-primary">{label}</span>
      </div>
    </div>
  );
};
