import { createFileRoute } from "@tanstack/react-router";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { CENTERS } from "@/lib/erp.functions";
import { formatNaira } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Farm Alert" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  const blocks = live?.inventoryFullByCenter ?? CENTERS.map((c) => ({ center: c, out: [], low: [], ok: [] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive per-warehouse breakdown — Out of Stock → Low in Stock → In Stock for each of the 8 distribution centers.
        </p>
      </div>

      {blocks.map((ci) => (
        <section key={ci.center} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">{ci.center} Distribution Center</h2>
            <div className="text-xs text-muted-foreground">
              <span className="text-destructive">{ci.out.length} out</span> · <span className="text-warn">{ci.low.length} low</span> · <span className="text-brand-green">{ci.ok.length} in stock</span>
            </div>
          </div>
          <StockGroup label="Out of Stock" tone="destructive" rows={ci.out} />
          <StockGroup label="Low in Stock" tone="warn" rows={ci.low} />
          <StockGroup label="In Stock" tone="ok" rows={ci.ok} />
        </section>
      ))}

      {/* 90-day product forecast */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">90-Day Demand Forecast · by Product</h2>
        <p className="text-xs text-muted-foreground">Projection per product from the last 30 days of approved sales × 3.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Sold 30d (qty)</th>
                <th className="px-3 py-2 text-right">Revenue 30d</th>
                <th className="px-3 py-2 text-right">Projected 90d (qty)</th>
                <th className="px-3 py-2 text-right">Projected revenue</th>
              </tr>
            </thead>
            <tbody>
              {(live?.productForecast ?? []).map((p) => (
                <tr key={p.itemCode} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{p.item}<div className="text-[10px] text-muted-foreground">{p.itemCode}</div></td>
                  <td className="px-3 py-2 text-right">{p.last30dQty}</td>
                  <td className="px-3 py-2 text-right">{formatNaira(p.last30dRevenue)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{p.projected90dQty}</td>
                  <td className="px-3 py-2 text-right font-semibold text-brand-green">{formatNaira(p.projected90dRevenue)}</td>
                </tr>
              ))}
              {(!live || live.productForecast.length === 0) && (
                <tr><td className="px-3 py-4 text-center text-muted-foreground" colSpan={5}>Loading product forecast…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StockGroup({
  label,
  tone,
  rows,
}: {
  label: string;
  tone: "destructive" | "warn" | "ok";
  rows: { sku: string; product: string; qty: number }[];
}) {
  if (rows.length === 0) return null;
  const cls =
    tone === "destructive"
      ? "border-destructive/30 bg-destructive/5"
      : tone === "warn"
        ? "border-warn/30 bg-warn/5"
        : "border-brand-green/30 bg-brand-green/5";
  const badge =
    tone === "destructive" ? "text-destructive" : tone === "warn" ? "text-warn" : "text-brand-green";
  return (
    <div className={cn("mt-3 rounded-lg border p-3", cls)}>
      <div className={cn("mb-2 text-xs font-semibold uppercase tracking-wider", badge)}>
        {label} · {rows.length}
      </div>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.sku} className="flex items-center justify-between rounded-md bg-card px-2 py-1.5 text-xs">
            <div className="min-w-0 flex-1 truncate">
              <span className="font-medium text-foreground">{r.product}</span>
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">{r.sku}</span>
            </div>
            <span className="ml-2 font-semibold tabular-nums text-foreground">{r.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
