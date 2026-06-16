import { createFileRoute } from "@tanstack/react-router";
import { AfricaMap } from "@/components/africa-map";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Africa Operations Map Activities — Farm Alert" }] }),
  component: MapPage,
});

function MapPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;
  const points = live?.regionMapPoints ?? [];
  const centerPoints = points.filter((p) => (p.type ?? "center") === "center");
  const customerPoints = points.filter((p) => p.type === "customer");
  const sortedSales = [...centerPoints].sort((a, b) => b.sales - a.sales);
  const sortedNew = [...customerPoints].filter((p) => p.newPartners > 0).sort((a, b) => b.registeredAt?.localeCompare(a.registeredAt ?? "") ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Africa Operations Map Activities</h1>
        <p className="text-sm text-muted-foreground">
          Color codes show approved sales volume by distribution center. Zoom in to see registered customer coordinates and new customer activity.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <AfricaMap variant="full" points={points} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Top Selling Centers · MTD</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {sortedSales.slice(0, 8).map((p) => (
              <li key={p.region} className="flex items-center justify-between py-2">
                <span className="text-foreground">{p.region}</span>
                <span className="font-semibold text-foreground">{formatNaira(p.sales)}</span>
              </li>
            ))}
            {sortedSales.length === 0 && <li className="py-2 text-muted-foreground">Loading…</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">New Customers (30d) · exact locations</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {sortedNew.map((p) => (
              <li key={p.id ?? p.customer} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 text-foreground">
                  <span className="block truncate font-medium">{p.customerName ?? p.customer}</span>
                  <span className="block text-xs text-muted-foreground">{p.center ?? p.region}</span>
                </span>
                <span className="shrink-0 font-semibold text-brand-green">{p.registeredAt ?? "New"}</span>
              </li>
            ))}
            {sortedNew.length === 0 && <li className="py-2 text-muted-foreground">No geocoded new customers detected in the last 30 days.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
