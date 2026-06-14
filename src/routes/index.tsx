import { createFileRoute } from "@tanstack/react-router";
import {
  Banknote,
  PackageX,
  Users,
  UserPlus,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { AfricaMap } from "@/components/africa-map";
import {
  PartnerSalesChart,
  CustomerActivityChart,
  InventoryForecastChart,
} from "@/components/dashboard-charts";
import { InventoryTable } from "@/components/inventory-table";
import {
  kpis,
  formatNaira,
  outOfStockByCenter as mockOosByCenter,
  redAlerts,
} from "@/lib/dashboard-data";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Farm Alert CEO Dashboard" },
      { name: "description", content: "Today's sales, stock health, customers and active red alerts across all Farm Alert distribution centers." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { data: erp, dataUpdatedAt, isFetching, isError } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  const totalSalesToday = live ? live.totalSalesToday : kpis.totalSalesToday.value;
  const outOfStockCount = live
    ? live.inventory.filter((i) => i.status === "out").length
    : kpis.outOfStockCount;
  const returningCount = live ? live.returningCustomers : kpis.activeReturningCustomers.value;
  const newCustomers = live ? live.newCustomersThisWeek : kpis.newCustomers.value;
  const oosByCenter = live && live.outOfStockByCenter.length > 0 ? live.outOfStockByCenter : mockOosByCenter;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Good morning, Dr. Kayode</h1>
          <p className="text-sm text-muted-foreground">
            Here's how Farm Alert is performing across the network today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              isError ? "bg-destructive" : live ? "bg-brand-green" : "bg-warn",
            )}
          />
          <span className="text-muted-foreground">
            {isError
              ? "ERP unreachable · showing last known"
              : live
                ? `Live ERP · updated ${lastUpdated}`
                : "Connecting to ERP…"}
            {isFetching && live ? " · refreshing" : ""}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Sales Today"
          value={formatNaira(totalSalesToday)}
          delta={kpis.totalSalesToday.delta}
          hint={live ? `${live.invoiceCountToday} invoices today` : "vs yesterday"}
          icon={<Banknote className="h-4 w-4" />}
          tone="green"
        />
        <KpiCard
          label="Out of Stock Items"
          value={outOfStockCount}
          hint={live ? "from live stock balance" : "across 8 centers"}
          icon={<PackageX className="h-4 w-4" />}
          tone="destructive"
        />
        <KpiCard
          label="Active / Returning Customers"
          value={returningCount.toLocaleString()}
          delta={kpis.activeReturningCustomers.delta}
          hint="last 30 days"
          icon={<Users className="h-4 w-4" />}
          tone="navy"
        />
        <KpiCard
          label="New Customers"
          value={newCustomers}
          delta={kpis.newCustomers.delta}
          hint="this week"
          icon={<UserPlus className="h-4 w-4" />}
          tone="green"
        />
      </section>

      {/* Map + Out of stock breakdown */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Africa Operations Map</h2>
              <p className="text-xs text-muted-foreground">
                Live alert status and active sales by distribution zone.
              </p>
            </div>
            <a
              href="/map"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-green"
            >
              Open full map <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <AfricaMap variant="compact" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Out of Stock by Center</h2>
          <p className="text-xs text-muted-foreground">
            {live ? "Live from ERP Stock Balance" : "All distribution centers · today"}
          </p>
          <ul className="mt-4 divide-y divide-border">
            {oosByCenter.map((c) => (
              <li key={c.center} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{c.center}</span>
                <span
                  className={cn(
                    "inline-flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold",
                    c.count === 0
                      ? "bg-brand-green/15 text-brand-green"
                      : c.count === 1
                      ? "bg-warn/15 text-warn"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {c.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Charts row */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Partner Sales Performance
              </h2>
              <p className="text-xs text-muted-foreground">By region · this month (₦M)</p>
            </div>
          </div>
          <PartnerSalesChart data={live?.partnerSalesByRegion} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Customer Activity</h2>
          <p className="text-xs text-muted-foreground">New vs Returning · last 7 days</p>
          <div className="mt-3">
            <CustomerActivityChart />
          </div>
        </div>
      </section>

      {/* Inventory + forecast */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Inventory Status</h2>
              <p className="text-xs text-muted-foreground">
                {live ? "Live from ERP Stock Balance report" : "Critical SKUs across all centers"}
              </p>
            </div>
          </div>
          <InventoryTable rows={live?.inventory} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Inventory Forecasting</h2>
          <p className="text-xs text-muted-foreground">7-week demand projection (cartons)</p>
          <div className="mt-3">
            <InventoryForecastChart />
          </div>
        </div>
      </section>

      {/* AI Summary */}
      <section className="rounded-xl border border-brand-navy/20 bg-gradient-to-br from-brand-navy to-brand-navy/90 p-6 text-brand-navy-foreground">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green text-brand-green-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">AI Executive Summary</h2>
              <span className="rounded-full bg-brand-green/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-green">
                Auto-generated
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-navy-foreground/85">
              Today's network revenue is <strong className="text-brand-green">{formatNaira(totalSalesToday)}</strong>
              {live ? ` from ${live.invoiceCountToday} invoices` : ""} — outstanding receivables sit at{" "}
              <strong>{formatNaira(live?.outstandingTotal ?? 0)}</strong>. Top performing zone is{" "}
              <strong>{live?.partnerSalesByRegion[0]?.region ?? "Lagos"}</strong>. {outOfStockCount > 0 ? (
                <>Currently <strong className="text-warn">{outOfStockCount}</strong> SKUs are at zero stock — recommend immediate replenishment from the Abuja DC.</>
              ) : (
                <>All centers are healthy on stock.</>
              )} New customer acquisition this week: <strong>{newCustomers}</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-brand-green-foreground hover:opacity-90">
                <AlertTriangle className="h-3.5 w-3.5" />
                Trigger replenishment
              </button>
              <button className="inline-flex items-center rounded-md border border-brand-navy-foreground/30 px-3 py-1.5 text-xs font-medium text-brand-navy-foreground hover:bg-white/5">
                Brief operations team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Red alerts strip */}
      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h2 className="text-sm font-semibold text-destructive">Active Red Alerts</h2>
        <ul className="mt-3 space-y-2">
          {redAlerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-2 w-2 rounded-full",
                    a.severity === "critical" ? "bg-destructive" : "bg-warn",
                  )}
                />
                <span className="text-foreground">{a.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
