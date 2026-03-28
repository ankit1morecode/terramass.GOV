import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VehicleData } from "@/lib/mock-data";

interface FleetMapProps {
  vehicles: VehicleData[];
  onSelect: (v: VehicleData) => void;
  selectedId?: string;
}

const defaultCenter: [number, number] = [24.5, 79.0];

const statusColors = {
  safe: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  critical: "hsl(var(--destructive))",
} as const;

const createIcon = (status: VehicleData["sensor"]["status"], isSelected: boolean) => {
  const color = statusColors[status] ?? statusColors.safe;
  const size = isSelected ? 18 : 12;
  const border = isSelected ? "3px solid hsl(var(--primary))" : "2px solid hsl(var(--background))";

  return L.divIcon({
    className: "fleet-marker-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};border:${border};box-shadow:0 0 10px ${color};"></div>`,
  });
};

const FleetMap = ({ vehicles, onSelect, selectedId }: FleetMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const fittedRef = useRef(false);

  // Debug: Log vehicles data
  useEffect(() => {
    console.log('FleetMap vehicles:', vehicles);
    console.log('FleetMap selectedId:', selectedId);
  }, [vehicles, selectedId]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      console.log('Initializing map...');
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 5,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      });

      tileLayer.addTo(map);
      mapRef.current = map;
      tileRef.current = tileLayer;

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      try {
        Object.values(markersRef.current).forEach((marker) => marker.remove());
        markersRef.current = {};
        tileRef.current?.remove();
        mapRef.current?.remove();
        mapRef.current = null;
        tileRef.current = null;
        fittedRef.current = false;
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set<string>();
    const boundsPoints: L.LatLngExpression[] = [];

    vehicles.forEach((vehicle) => {
      const pos = vehicle.coordinates;
      if (!pos) return;

      currentIds.add(vehicle.id);
      boundsPoints.push(pos);

      const marker = markersRef.current[vehicle.id];
      const popupHtml = `
        <div style="font-size:12px;line-height:1.4;min-width:200px">
          <div style="font-weight:bold;margin-bottom:8px;color:#333">${vehicle.name}</div>
          <div style="display:grid;grid-template-columns:80px 1fr;gap:4px;font-size:11px">
            <span style="color:#666">Driver:</span><span style="font-weight:500">${vehicle.driver}</span>
            <span style="color:#666">Location:</span><span>${vehicle.location}</span>
            <span style="color:#666">Speed:</span><span style="font-weight:500">${vehicle.sensor.speed} / ${vehicle.sensor.safeSpeed} km/h</span>
            <span style="color:#666">Status:</span><span style="font-weight:500;color:${statusColors[vehicle.sensor.status]}">${vehicle.sensor.status.toUpperCase()}</span>
            <span style="color:#666">Plate:</span><span>${vehicle.plate}</span>
          </div>
        </div>
      `;

      if (marker) {
        marker.setLatLng(pos);
        marker.setIcon(createIcon(vehicle.sensor.status, selectedId === vehicle.id));
        marker.setPopupContent(popupHtml);
        marker.off("click").on("click", () => onSelect(vehicle));
      } else {
        const nextMarker = L.marker(pos, {
          icon: createIcon(vehicle.sensor.status, selectedId === vehicle.id),
        })
          .addTo(map)
          .bindPopup(popupHtml)
          .on("click", () => onSelect(vehicle));

        markersRef.current[vehicle.id] = nextMarker;
      }
    });

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentIds.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    if (!fittedRef.current && boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints).pad(0.3));
      fittedRef.current = true;
    }
  }, [vehicles, selectedId, onSelect]);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fleet Map</h3>
        <div className="flex items-center gap-4">
          {(["safe", "warning", "critical"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
              <span className="text-xs text-muted-foreground capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full aspect-[2/1] min-h-[300px] relative" style={{ background: "hsl(var(--secondary))" }}>
        {!vehicles || vehicles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">No vehicle data available</div>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="h-full w-full" style={{ zIndex: 1 }} />
            {!mapRef.current && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-muted-foreground">Loading map...</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FleetMap;
