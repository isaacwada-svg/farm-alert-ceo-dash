import { useState } from "react";
import { regions, type AlertLevel } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import africaMapAsset from "@/assets/africa-map.png.asset.json";

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

// Image is 1408x787; we use that as the viewBox so dot coords line up.
const VB_W = 1408;
const VB_H = 787;

interface Props {
  variant?: "compact" | "full";
}

export function AfricaMap({ variant = "compact" }: Props) {
  const [hoverDot, setHoverDot] = useState<string | null>(null);
  const focusDot = regions.find((r) => r.id === hoverDot);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border"
      style={{ background: "#f0f4f8" }}
    >
      <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        <img
          src={africaMapAsset.url}
          alt="Map of Africa"
          className={cn(
            "absolute inset-0 h-full w-full object-contain select-none",
            variant === "full" ? "" : "",
          )}
          draggable={false}
        />
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Partner activity overlay"
        >
          {/* Nigeria emphasis ring */}
          <circle
            cx={628}
            cy={335}
            r={78}
            fill="none"
            stroke="#11455b"
            strokeWidth={2.5}
            strokeDasharray="6 5"
            opacity={0.7}
          />

          {regions.map((r) => {
            const isHover = hoverDot === r.id;
            const color = dotFill[r.level];
            const isNigeria = r.country === "Nigeria";
            const baseR = isNigeria ? 11 : 9;
            const hoverR = baseR + 3;
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
                  <circle cx={r.x} cy={r.y} r={baseR} fill={color} opacity={0.5}>
                    <animate
                      attributeName="r"
                      values={`${baseR};${baseR + 16};${baseR}`}
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
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
                  y={r.y - (isHover ? hoverR + 5 : baseR + 5)}
                  textAnchor="middle"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fill: "#11455b",
                    paintOrder: "stroke",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                    pointerEvents: "none",
                  }}
                >
                  {r.name.replace(" DC", "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute left-3 bottom-3 flex flex-wrap gap-2 rounded-md bg-white/95 p-2 text-[11px] shadow-sm">
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

      {/* Tooltip */}
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
    </div>
  );
}
