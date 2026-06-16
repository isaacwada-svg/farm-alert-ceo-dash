import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, LayersControl, LayerGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RegionMapPoint } from "@/lib/erp.functions";

interface Props {
  variant?: "compact" | "full";
  points?: RegionMapPoint[];
}

function colorForSales(sales: number, max: number): string {
  if (max <= 0 || sales <= 0) return "#64748b";
  const r = sales / max;
  if (r > 0.66) return "#dc2626";
  if (r > 0.33) return "#f59e0b";
  return "#16a34a";
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString()}`;
}

export function AfricaMap({ variant = "compact", points = [] }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const height = variant === "full" ? 620 : 460;
  const centerPoints = useMemo(() => points.filter((p) => (p.type ?? "center") === "center"), [points]);
  const customerPoints = useMemo(() => points.filter((p) => p.type === "customer"), [points]);
  const newCustomerPoints = useMemo(() => customerPoints.filter((p) => p.newPartners > 0), [customerPoints]);
  const maxSales = useMemo(() => centerPoints.reduce((m, p) => Math.max(m, p.sales), 0), [centerPoints]);

  if (!mounted) {
    return <div className="w-full rounded-lg border border-border bg-muted/30" style={{ height }} />;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ height, background: "#eef3f7" }}>
      <MapContainer
        center={[8.5, 8.5]}
        zoom={variant === "full" ? 5 : 4}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        worldCopyJump={false}
        maxBounds={L.latLngBounds([-12, -28], [32, 35])}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street map">
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

          <LayersControl.Overlay checked name="Distribution center sales volume">
            <LayerGroup>
              {centerPoints.map((p) => {
                const color = colorForSales(p.sales, maxSales);
                const radius = 10 + 22 * (maxSales > 0 ? p.sales / maxSales : 0);
                return (
                  <CircleMarker
                    key={p.id ?? `center-${p.region}`}
                    center={[p.lat, p.lng]}
                    radius={radius}
                    pathOptions={{ color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 0.82 }}
                  >
                    <Tooltip direction="top">
                      <strong>{p.region}</strong> · {formatMoney(p.sales)} MTD
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: 210 }}>
                        <div style={{ fontWeight: 700, color: "#11455b" }}>{p.region}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Approved sales MTD: <strong>{formatMoney(p.sales)}</strong></div>
                        <div style={{ fontSize: 12 }}>Buying customers: <strong>{p.customers}</strong></div>
                        <div style={{ fontSize: 12 }}>New registered customers (30d): <strong>{p.newPartners}</strong></div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Customer registered / buying locations">
            <LayerGroup>
              {customerPoints.map((p) => (
                <CircleMarker
                  key={p.id ?? `customer-${p.customer}-${p.lat}-${p.lng}`}
                  center={[p.lat, p.lng]}
                  radius={p.newPartners > 0 ? 6 : 4}
                  pathOptions={{ color: "#ffffff", weight: 1.3, fillColor: p.newPartners > 0 ? "#16a34a" : "#2563eb", fillOpacity: 0.95 }}
                >
                  <Tooltip direction="top">
                    <strong>{p.customerName ?? p.customer}</strong> · {p.center ?? p.region}
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: 230 }}>
                      <div style={{ fontWeight: 700, color: "#11455b" }}>{p.customerName ?? p.customer}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Center: <strong>{p.center ?? "—"}</strong></div>
                      <div style={{ fontSize: 12 }}>MTD purchases: <strong>{formatMoney(p.sales)}</strong></div>
                      <div style={{ fontSize: 12 }}>Registered: <strong>{p.registeredAt ?? "—"}</strong></div>
                      <div style={{ fontSize: 12 }}>Last purchase: <strong>{p.lastPurchase ?? "—"}</strong></div>
                      {p.address && <div style={{ fontSize: 12, marginTop: 4 }}>{p.address}</div>}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="New customers (30d)">
            <LayerGroup>
              {newCustomerPoints.map((p) => (
                <CircleMarker
                  key={`new-${p.id ?? p.customer}`}
                  center={[p.lat, p.lng]}
                  radius={9}
                  pathOptions={{ color: "#052e16", weight: 2, fillColor: "#22c55e", fillOpacity: 0.35 }}
                >
                  <Tooltip direction="top">
                    <strong>New customer</strong> · {p.customerName ?? p.customer}
                  </Tooltip>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      <div className="pointer-events-none absolute left-3 bottom-3 z-[400] flex flex-col gap-1.5 rounded-md bg-white/95 p-2 text-[11px] shadow-sm">
        <div className="font-semibold text-foreground">Sales volume by center</div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#dc2626" }} /><span className="text-muted-foreground">High</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} /><span className="text-muted-foreground">Mid</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#16a34a" }} /><span className="text-muted-foreground">Low</span></div>
        </div>
        <div className="font-semibold text-foreground">Customers</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2563eb" }} /><span className="text-muted-foreground">Buying/registered</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} /><span className="text-muted-foreground">New 30d</span></div>
      </div>
    </div>
  );
}