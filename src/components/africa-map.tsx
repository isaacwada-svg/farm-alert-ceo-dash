import { useState } from "react";
import { regions, type AlertLevel } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const levelColor: Record<AlertLevel, string> = {
  critical: "text-destructive",
  warning: "text-warn",
  active: "text-brand-green",
  calm: "text-muted-foreground",
};

const levelLabel: Record<AlertLevel, string> = {
  critical: "Critical alert",
  warning: "Warning",
  active: "Active sales",
  calm: "Calm",
};

const dotFill: Record<AlertLevel, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  active: "#2fcb6e",
  calm: "#94a3b8",
};

type Activity = "high" | "moderate" | "low";
const activityFill: Record<Activity, string> = {
  high: "#2fcb6e",
  moderate: "#f59e0b",
  low: "#cbd5e1",
};

// Simplified West Africa country shapes (viewBox 800x600).
// Stylized, not geographically exact, but recognizable layout.
const countries: {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  activity: Activity;
  sales: number; // ₦
  partners: number;
  emphasis?: boolean;
}[] = [
  {
    id: "sierra",
    name: "Sierra Leone",
    path: "M120,360 L180,355 L195,395 L160,420 L120,410 Z",
    labelX: 155,
    labelY: 390,
    activity: "low",
    sales: 140_000,
    partners: 4,
  },
  {
    id: "liberia",
    name: "Liberia",
    path: "M170,420 L235,410 L260,450 L220,485 L170,470 Z",
    labelX: 215,
    labelY: 450,
    activity: "moderate",
    sales: 480_000,
    partners: 9,
  },
  {
    id: "ghana",
    name: "Ghana",
    path: "M310,360 L365,355 L380,420 L355,470 L315,470 L300,410 Z",
    labelX: 340,
    labelY: 415,
    activity: "low",
    sales: 220_000,
    partners: 6,
  },
  {
    id: "niger",
    name: "Niger",
    path: "M380,140 L600,130 L660,180 L640,240 L560,250 L470,240 L400,220 Z",
    labelX: 510,
    labelY: 195,
    activity: "low",
    sales: 180_000,
    partners: 5,
  },
  {
    id: "cameroon",
    name: "Cameroon",
    path: "M650,290 L720,295 L735,370 L710,450 L680,480 L645,450 L640,380 Z",
    labelX: 688,
    labelY: 390,
    activity: "moderate",
    sales: 360_000,
    partners: 8,
  },
  {
    id: "nigeria",
    name: "Nigeria",
    // Larger, dominant central shape
    path: "M400,240 L470,250 L560,255 L630,275 L645,330 L640,400 L600,460 L520,490 L440,485 L400,450 L380,390 L380,310 Z",
    labelX: 510,
    labelY: 370,
    activity: "high",
    sales: 18_420_000,
    partners: 217,
    emphasis: true,
  },
];

interface Props {
  variant?: "compact" | "full";
}

export function AfricaMap({ variant = "compact" }: Props) {
  const [hoverCountry, setHoverCountry] = useState<string | null>(null);
  const [hoverDot, setHoverDot] = useState<string | null>(null);

  // Dots only for Nigerian distribution centers
  const nigeriaDots = regions.filter((r) => r.country === "Nigeria");

  const focusCountry = countries.find((c) => c.id === hoverCountry);
  const focusDot = regions.find((r) => r.id === hoverDot);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border"
      style={{ background: "#f0f4f8" }}
    >
      <svg
        viewBox="0 0 800 600"
        className={cn("w-full", variant === "full" ? "h-[560px]" : "h-[380px]")}
        role="img"
        aria-label="West Africa partner activity map"
      >
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#11455b" strokeOpacity="0.05" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#map-grid)" />

        {/* Countries */}
        {countries.map((c) => {
          const isHover = hoverCountry === c.id;
          const fill = activityFill[c.activity];
          const isNigeria = c.id === "nigeria";
          return (
            <g
              key={c.id}
              onMouseEnter={() => setHoverCountry(c.id)}
              onMouseLeave={() =>
                setHoverCountry((cur) => (cur === c.id ? null : cur))
              }
              className="cursor-pointer"
            >
              <path
                d={c.path}
                fill={fill}
                fillOpacity={isNigeria ? (isHover ? 0.95 : 0.85) : isHover ? 0.85 : 0.65}
                stroke={isNigeria ? "#11455b" : "#94a3b8"}
                strokeWidth={isNigeria ? 2.2 : 1.2}
                style={{ transition: "fill-opacity 150ms" }}
              />
              <text
                x={c.labelX}
                y={c.labelY}
                textAnchor="middle"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: isNigeria ? 18 : 12,
                  fontWeight: isNigeria ? 700 : 600,
                  fill: isNigeria ? "#11455b" : "#334155",
                  pointerEvents: "none",
                }}
              >
                {c.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Nigeria distribution center dots */}
        {nigeriaDots.map((r) => {
          const isHover = hoverDot === r.id;
          const color = dotFill[r.level];
          const baseR = 9;
          const hoverR = 12;
          return (
            <g
              key={r.id}
              onMouseEnter={() => setHoverDot(r.id)}
              onMouseLeave={() =>
                setHoverDot((cur) => (cur === r.id ? null : cur))
              }
              className="cursor-pointer"
            >
              {r.level === "critical" && (
                <circle cx={r.x} cy={r.y} r={baseR} fill={color} opacity={0.4}>
                  <animate
                    attributeName="r"
                    values={`${baseR};${baseR + 14};${baseR}`}
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.55;0;0.55"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={r.x}
                cy={r.y}
                r={isHover ? hoverR : baseR}
                fill={color}
                stroke="#ffffff"
                strokeWidth={2.5}
                style={{ transition: "r 150ms" }}
              />
              <text
                x={r.x}
                y={r.y - (isHover ? hoverR + 6 : baseR + 6)}
                textAnchor="middle"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#11455b",
                  pointerEvents: "none",
                }}
              >
                {r.name.replace(" DC", "")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute left-3 top-3 flex flex-wrap gap-2 rounded-md bg-white/95 p-2 text-[11px] shadow-sm">
        {(["critical", "warning", "active", "calm"] as AlertLevel[]).map((lvl) => (
          <div key={lvl} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: dotFill[lvl] }}
            />
            <span className="capitalize text-muted-foreground">{lvl}</span>
          </div>
        ))}
      </div>

      {/* Country activity legend */}
      <div className="absolute right-3 top-3 flex flex-wrap gap-2 rounded-md bg-white/95 p-2 text-[11px] shadow-sm">
        <span className="text-muted-foreground font-medium">Country sales:</span>
        {(["high", "moderate", "low"] as Activity[]).map((a) => (
          <div key={a} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: activityFill[a] }}
            />
            <span className="capitalize text-muted-foreground">{a}</span>
          </div>
        ))}
      </div>

      {/* Tooltip: dot hover takes priority */}
      {focusDot && (
        <div className="absolute bottom-3 right-3 min-w-[220px] rounded-lg border border-border bg-card p-3 shadow-md animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {focusDot.name}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                levelColor[focusDot.level],
              )}
            >
              {levelLabel[focusDot.level]}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {focusDot.country} · Distribution Center
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Partners</div>
              <div className="font-semibold text-foreground">{focusDot.partners}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sales</div>
              <div className="font-semibold text-foreground">
                ₦{(focusDot.sales / 1_000_000).toFixed(2)}M
              </div>
            </div>
          </div>
        </div>
      )}
      {!focusDot && focusCountry && (
        <div className="absolute bottom-3 right-3 min-w-[220px] rounded-lg border border-border bg-card p-3 shadow-md animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {focusCountry.name}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: activityFill[focusCountry.activity] }}
            >
              {focusCountry.activity} activity
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {focusCountry.emphasis ? "Primary market" : "Regional partner"}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Partners</div>
              <div className="font-semibold text-foreground">
                {focusCountry.partners}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Sales</div>
              <div className="font-semibold text-foreground">
                ₦{(focusCountry.sales / 1_000_000).toFixed(2)}M
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
