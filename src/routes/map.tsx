import { createFileRoute } from "@tanstack/react-router";
import { AfricaMap } from "@/components/africa-map";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Africa Map — Farm Alert" }] }),
  component: MapPage,
});

function MapPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;
  const points = live?.regionMapPoints ?? [];
  const sortedSales = [...points].sort((a, b) => b.sales - a.sales);
  const sortedNew = [...points].filter((p) => p.newPartners > 0).sort((a, b) => b.newPartners - a.newPartners);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Africa Operations Map</h1>
        <p className="text-sm text-muted-foreground">
          Color shading reflects sales volume by region. Green markers indicate new partners.
          Zoom in to reveal customer-level locations from registered addresses.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <AfricaMap variant="full" points={points} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Top Selling Regions · MTD</h2>
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
          <h2 className="text-base font-semibold text-foreground">New Partners (30d) · by Region</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {sortedNew.map((p) => (
              <li key={p.region} className="flex items-center justify-between py-2">
                <span className="text-foreground">{p.region}</span>
                <span className="font-semibold text-brand-green">+{p.newPartners}</span>
              </li>
            ))}
            {sortedNew.length === 0 && <li className="py-2 text-muted-foreground">No new partners detected in the last 30 days.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
