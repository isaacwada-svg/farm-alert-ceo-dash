import { useState } from "react";
import { regions, type AlertLevel } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const levelColor: Record<AlertLevel, string> = {
  critical: "text-destructive",
  warning: "text-warn",
  active: "text-brand-green",
  calm: "text-muted-foreground",
};

const levelFill: Record<AlertLevel, string> = {
  critical: "fill-destructive",
  warning: "fill-warn",
  active: "fill-brand-green",
  calm: "fill-muted-foreground",
};

const levelLabel: Record<AlertLevel, string> = {
  critical: "Critical alert",
  warning: "Warning",
  active: "Active sales",
  calm: "Calm",
};

// Stylized West/Central Africa silhouette (simplified polygon, viewBox 800x600)
const AFRICA_PATH =
  "M210,200 L300,160 L380,170 L460,150 L540,160 L620,180 L690,220 L720,290 L710,360 L690,430 L640,490 L560,520 L470,520 L380,510 L300,500 L240,470 L210,420 L195,360 L195,290 Z";

// Nigeria region (highlighted)
const NIGERIA_PATH =
  "M450,260 L540,250 L620,280 L660,330 L640,400 L580,460 L500,470 L440,440 L420,380 L420,320 Z";

interface Props {
  variant?: "compact" | "full";
}

export function AfricaMap({ variant = "compact" }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const focus = regions.find((r) => r.id === active);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/20">
      <svg
        viewBox="0 0 800 600"
        className={cn("w-full", variant === "full" ? "h-[560px]" : "h-[360px]")}
        role="img"
        aria-label="West and Central Africa partner map"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#grid)" className="text-foreground" />

        {/* Continent silhouette */}
        <path
          d={AFRICA_PATH}
          className="fill-card stroke-border"
          strokeWidth="1.5"
        />

        {/* Nigeria highlighted */}
        <path
          d={NIGERIA_PATH}
          className="fill-brand-navy/15 stroke-brand-navy"
          strokeWidth="1.5"
        />
        <text
          x="525"
          y="370"
          textAnchor="middle"
          className="fill-brand-navy text-[14px] font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          NIGERIA
        </text>

        {/* Neighboring country labels */}
        {[
          { x: 290, y: 450, label: "Liberia" },
          { x: 390, y: 450, label: "Ghana" },
          { x: 660, y: 440, label: "Cameroon" },
          { x: 260, y: 410, label: "S. Leone" },
          { x: 470, y: 230, label: "Niger" },
        ].map((c) => (
          <text
            key={c.label}
            x={c.x}
            y={c.y}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {c.label}
          </text>
        ))}

        {/* Region dots */}
        {regions.map((r) => {
          const isActive = active === r.id;
          return (
            <g
              key={r.id}
              onMouseEnter={() => setActive(r.id)}
              onMouseLeave={() => setActive((cur) => (cur === r.id ? null : cur))}
              className="cursor-pointer"
            >
              {/* Pulse ring for critical/warning */}
              {(r.level === "critical" || r.level === "warning") && (
                <circle
                  cx={r.x}
                  cy={r.y}
                  r={isActive ? 18 : 14}
                  className={cn(levelFill[r.level], "opacity-25")}
                >
                  <animate
                    attributeName="r"
                    values="8;20;8"
                    dur={r.level === "critical" ? "1.6s" : "2.4s"}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur={r.level === "critical" ? "1.6s" : "2.4s"}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={r.x}
                cy={r.y}
                r={isActive ? 8 : 6}
                className={cn(levelFill[r.level], "stroke-card transition-all")}
                strokeWidth="2.5"
              />
              {(isActive || variant === "full") && (
                <text
                  x={r.x}
                  y={r.y - 12}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {r.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute left-3 top-3 flex flex-wrap gap-2 rounded-md bg-card/95 p-2 text-[11px] shadow-sm backdrop-blur">
        {(["critical", "warning", "active", "calm"] as AlertLevel[]).map((lvl) => (
          <div key={lvl} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", {
              "bg-destructive": lvl === "critical",
              "bg-warn": lvl === "warning",
              "bg-brand-green": lvl === "active",
              "bg-muted-foreground": lvl === "calm",
            })} />
            <span className="capitalize text-muted-foreground">{lvl}</span>
          </div>
        ))}
      </div>

      {/* Hover detail */}
      {focus && (
        <div className="absolute bottom-3 right-3 min-w-[220px] rounded-lg border border-border bg-card p-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{focus.name}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", levelColor[focus.level])}>
              {levelLabel[focus.level]}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{focus.country}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Partners</div>
              <div className="font-semibold text-foreground">{focus.partners}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sales (₦)</div>
              <div className="font-semibold text-foreground">{(focus.sales / 1_000_000).toFixed(2)}M</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
