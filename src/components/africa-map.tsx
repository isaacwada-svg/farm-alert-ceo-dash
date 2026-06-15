import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, LayersControl, LayerGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RegionMapPoint } from "@/lib/erp.functions";

interface Props {
  variant?: "compact" | "full";
  points?: RegionMapPoint[];
}

// Color ramp by sales bucket
function colorForSales(sales: number, max: number): string {
  if (max <= 0) return "#94a3b8";
  const r = sales / max;
  if (r > 0.66) return "#ef4444"; // hot
  if (r > 0.33) return "#f59e0b"; // warm
  if (r > 0) return "#2fcb6e"; // active
  return "#94a3b8";
}

export function AfricaMap({ variant = "compact", points = [] }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const height = variant === "full" ? 620 : 460;
  const maxSales = useMemo(() => points.reduce((m, p) => Math.max(m, p.sales), 0), [points]);

  if (!mounted) {
    return <div className="w-full rounded-lg border border-border bg-muted/30" style={{ height }} />;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ height, background: "#f0f4f8" }}>
      <MapContainer
        center={[8.5, 8.5]}
        zoom={4}
        minZoom={3}
        maxZoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        worldCopyJump={false}
        maxBounds={L.latLngBounds([-10, -25], [30, 30])}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Light">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Sales by region">
            <LayerGroup>
              {points.map((p) => {
                const color = colorForSales(p.sales, maxSales);
                const radius = 8 + 14 * (maxSales > 0 ? p.sales / maxSales : 0);
                return (
                  <CircleMarker
                    key={`s-${p.region}`}
                    center={[p.lat, p.lng]}
                    radius={radius}
                    pathOptions={{ color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 0.85 }}
                  >
                    <Tooltip direction="top">
                      <strong>{p.region}</strong> · ₦{(p.sales / 1_000_000).toFixed(2)}M
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 700, color: "#11455b" }}>{p.region}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          MTD sales: <strong>₦{(p.sales / 1_000_000).toFixed(2)}M</strong>
                        </div>
                        <div style={{ fontSize: 12 }}>Customers: <strong>{p.customers}</strong></div>
                        <div style={{ fontSize: 12 }}>New partners (30d): <strong>{p.newPartners}</strong></div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="New partners (30d)">
            <LayerGroup>
              {points.filter((p) => p.newPartners > 0).map((p) => (
                <CircleMarker
                  key={`np-${p.region}`}
                  center={[p.lat + 0.15, p.lng + 0.15]}
                  radius={6}
                  pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: "#2fcb6e", fillOpacity: 1 }}
                >
                  <Tooltip direction="top">
                    <strong>+{p.newPartners} new</strong> · {p.region}
                  </Tooltip>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Legend */}
      <div className="pointer-events-none absolute left-3 bottom-3 z-[400] flex flex-col gap-1.5 rounded-md bg-white/95 p-2 text-[11px] shadow-sm">
        <div className="font-semibold text-foreground">Sales intensity</div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} /><span className="text-muted-foreground">High</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} /><span className="text-muted-foreground">Mid</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2fcb6e" }} /><span className="text-muted-foreground">Low</span></div>
        </div>
        <div className="font-semibold text-foreground">Partners</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2fcb6e" }} /><span className="text-muted-foreground">New (30d)</span></div>
      </div>
    </div>
  );
}
