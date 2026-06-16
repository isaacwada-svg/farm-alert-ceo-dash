import { createFileRoute } from "@tanstack/react-router";
import { PartnerSalesChart } from "@/components/dashboard-charts";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales — Farm Alert" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">
          Approved ERP sales invoice items grouped by their actual distribution-center warehouse.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">Approved Sales by Warehouse · This Month (₦M)</h2>
        <PartnerSalesChart data={live?.partnerSalesByRegion} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(live?.centerSales ?? []).map((c) => {
          const up = c.deltaPct >= 0;
          const pctOfHigh = c.sixMonthHigh > 0 ? Math.round((c.mtd / c.sixMonthHigh) * 100) : 0;
          return (
            <div key={c.center} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">{c.center} Distribution Center</h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                    up ? "bg-brand-green/15 text-brand-green" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(c.deltaPct)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm xl:grid-cols-4">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">MTD</div>
                  <div className="font-semibold text-foreground">{formatNaira(c.mtd)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Last month</div>
                  <div className="font-semibold text-foreground">{formatNaira(c.lastMonth)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">6-mo high</div>
                  <div className="font-semibold text-foreground">{formatNaira(c.sixMonthHigh)}</div>
                  <div className="text-[10px] text-muted-foreground">{c.sixMonthHighMonth || "—"} · at {pctOfHigh}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Approved invoices</div>
                  <div className="font-semibold text-foreground">{c.approvedInvoiceCountMtd.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Qty sold: {c.soldQtyMtd.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-3 rounded-md border border-border bg-muted/30 p-2.5">
                <div className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Actual items sold from this warehouse</div>
                <div className="space-y-1.5">
                  {c.topItemsMtd.map((item) => (
                    <div key={item.itemCode} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate text-foreground">{item.item}</span>
                      <span className="shrink-0 text-muted-foreground">{item.qty.toLocaleString()} · {formatNaira(item.sales)}</span>
                    </div>
                  ))}
                  {c.topItemsMtd.length === 0 && <div className="text-xs text-muted-foreground">No approved item sales this month.</div>}
                </div>
              </div>

              <div className="mt-3 rounded-md border border-brand-navy/10 bg-brand-navy/5 p-2.5 text-xs text-foreground">
                <strong className="text-brand-navy">Recommendation:</strong> {c.recommendation}
              </div>
            </div>
          );
        })}
        {(!live || live.centerSales.length === 0) && (
          <div className="col-span-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Loading approved sales from ERP…
          </div>
        )}
      </div>
    </div>
  );
}