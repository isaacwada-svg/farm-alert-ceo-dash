import { createFileRoute } from "@tanstack/react-router";
import { AfricaMap } from "@/components/africa-map";
import { regions } from "@/lib/dashboard-data";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Africa Map — Farm Alert" }] }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Africa Operations Map</h1>
        <p className="text-sm text-muted-foreground">
          Geo-mapped distribution zones and partner locations across West & Central Africa.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <AfricaMap variant="full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {regions.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.country}</div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background:
                    r.level === "critical"
                      ? "color-mix(in oklab, var(--destructive) 15%, transparent)"
                      : r.level === "warning"
                      ? "color-mix(in oklab, var(--warn) 18%, transparent)"
                      : r.level === "active"
                      ? "color-mix(in oklab, var(--brand-green) 18%, transparent)"
                      : "color-mix(in oklab, var(--muted-foreground) 15%, transparent)",
                  color:
                    r.level === "critical"
                      ? "var(--destructive)"
                      : r.level === "warning"
                      ? "var(--warn)"
                      : r.level === "active"
                      ? "var(--brand-green)"
                      : "var(--muted-foreground)",
                }}
              >
                {r.level}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Partners</div>
                <div className="font-semibold text-foreground">{r.partners}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sales</div>
                <div className="font-semibold text-foreground">
                  ₦{(r.sales / 1_000_000).toFixed(2)}M
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
