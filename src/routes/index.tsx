import { createFileRoute } from "@tanstack/react-router";
import { Banknote, PackageX, Users, UserPlus, Sparkles, ExternalLink, AlertTriangle, Target } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { AfricaMap } from "@/components/africa-map";
import { PartnerSalesChart, CustomerActivityChart } from "@/components/dashboard-charts";
import { formatNaira } from "@/lib/dashboard-data";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { cn } from "@/lib/utils";
import { CENTERS } from "@/lib/erp.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Farm Alert CEO Dashboard" },
      { name: "description", content: "Today's sales, MTD revenue vs goal, stock health across the 8 distribution centers, and AI executive guidance." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { data: erp, dataUpdatedAt, isFetching, isError } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  const outOfStockCount = live
    ? live.inventoryFullByCenter.reduce((s, c) => s + c.out.length, 0)
    : 0;

  const oosByCenter =
    live?.outOfStockByCenter ?? CENTERS.map((c) => ({ center: c, count: 0 }));

  const goalPct = live ? Math.min(100, (live.mtdRevenue / Math.max(live.monthGoalNaira, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Good morning, Dr. Kayode</h1>
          <p className="text-sm text-muted-foreground">
            Performance across the 8 distribution centers, tracked against the ₦250M Jun–Aug target.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("inline-flex h-2 w-2 rounded-full", isError ? "bg-destructive" : live ? "bg-brand-green" : "bg-warn")} />
          <span className="text-muted-foreground">
            {isError ? "ERP unreachable" : live ? `Live ERP · updated ${lastUpdated}` : "Connecting to ERP…"}
            {isFetching && live ? " · refreshing" : ""}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue (All-Time)"
          value={formatNaira(live?.totalRevenueAllTime ?? 0)}
          hint={live ? `${live.totalInvoicesAllTime} approved invoices` : "since first invoice"}
          icon={<Banknote className="h-4 w-4" />}
          tone="navy"
        />
        <KpiCard
          label="Total Sales Today"
          value={formatNaira(live?.totalSalesToday ?? 0)}
          hint={live ? `${live.invoiceCountToday} invoices today` : "—"}
          icon={<Banknote className="h-4 w-4" />}
          tone="green"
        />
        <KpiCard
          label="MTD vs Last Month"
          value={formatNaira(live?.mtdRevenue ?? 0)}
          hint={live ? `Last month: ${formatNaira(live.lastMonthRevenue)}` : "—"}
          delta={
            live && live.lastMonthRevenue > 0
              ? +(((live.mtdRevenue - live.lastMonthRevenue) / live.lastMonthRevenue) * 100).toFixed(1)
              : undefined
          }
          icon={<Target className="h-4 w-4" />}
          tone="navy"
        />
        <KpiCard
          label="Out of Stock Items"
          value={outOfStockCount}
          hint="across 8 centers"
          icon={<PackageX className="h-4 w-4" />}
          tone="destructive"
        />
        <KpiCard
          label="Returning Customers"
          value={(live?.returningCustomers ?? 0).toLocaleString()}
          hint="last 30 days"
          icon={<Users className="h-4 w-4" />}
          tone="navy"
        />
        <KpiCard
          label="New Customers (7d)"
          value={live?.newCustomersThisWeek ?? 0}
          hint="this week"
          icon={<UserPlus className="h-4 w-4" />}
          tone="green"
        />
      </section>

      {/* Goal tracker */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">₦250M Revenue Goal · Jun–Aug 2026</h2>
            <p className="text-xs text-muted-foreground">
              This-month share target: <strong>{formatNaira(live?.monthGoalNaira ?? 0)}</strong> · MTD progress: <strong>{formatNaira(live?.mtdRevenue ?? 0)}</strong> ({goalPct.toFixed(1)}%)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Remaining this month</div>
            <div className="text-lg font-semibold text-foreground">
              {formatNaira(Math.max(0, (live?.monthGoalNaira ?? 0) - (live?.mtdRevenue ?? 0)))}
            </div>
          </div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${goalPct}%` }} />
        </div>
      </section>

      {/* Map + Out of stock breakdown for 8 centers only */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Africa Operations Map Activities</h2>
              <p className="text-xs text-muted-foreground">Sales-volume centers and geocoded customer activity (live).</p>
            </div>
            <a href="/map" className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-green">
              Open full map <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <AfricaMap variant="compact" points={live?.regionMapPoints} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Out of Stock by Center</h2>
          <p className="text-xs text-muted-foreground">Across the 8 distribution centers</p>
          <ul className="mt-4 divide-y divide-border">
            {oosByCenter.map((c) => (
              <li key={c.center} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{c.center} Distribution Center</span>
                <span
                  className={cn(
                    "inline-flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold",
                    c.count === 0 ? "bg-brand-green/15 text-brand-green" : c.count <= 2 ? "bg-warn/15 text-warn" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {c.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Charts: partner sales + customer activity */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-foreground">Partner Sales Performance</h2>
            <p className="text-xs text-muted-foreground">Per distribution center · this month (₦M)</p>
          </div>
          <PartnerSalesChart data={live?.partnerSalesByRegion} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Customer Activity</h2>
          <p className="text-xs text-muted-foreground">New vs Returning · last 8 weeks</p>
          <div className="mt-3">
            <CustomerActivityChart data={live?.customerActivityWeekly} />
          </div>
        </div>
      </section>

      {/* Inventory status: top 10 across 8 centers, organized */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Inventory Status · Top 10 per Center</h2>
          <p className="text-xs text-muted-foreground">
            Ordered Out of Stock → Low → In Stock, organized per distribution center. Full breakdown lives in the Inventory page.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(live?.inventoryTop10ByCenter ?? CENTERS.map((c) => ({ center: c, out: [], low: [], ok: [] }))).map((ci) => (
            <div key={ci.center} className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{ci.center} Distribution Center</h3>
                <span className="text-[10px] text-muted-foreground">
                  {ci.out.length} out · {ci.low.length} low · {ci.ok.length} ok
                </span>
              </div>
              <CenterInventoryBlock ci={ci} />
            </div>
          ))}
        </div>
      </section>

      {/* Forecast (per 8 centers) */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">90-Day Revenue Forecast · 8 Centers</h2>
        <p className="text-xs text-muted-foreground">Projection from last 30 days of sales × 3.</p>
        <ul className="mt-3 divide-y divide-border">
          {(live?.centerForecast ?? CENTERS.map((c) => ({ center: c, projected90dRevenue: 0 }))).map((f) => (
            <li key={f.center} className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground">{f.center} Distribution Center</span>
              <span className="font-semibold text-foreground">{formatNaira(f.projected90dRevenue)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* AI Executive Summary */}
      <section className="rounded-xl border border-brand-navy/20 bg-gradient-to-br from-brand-navy to-brand-navy/90 p-6 text-brand-navy-foreground">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green text-brand-green-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">AI Executive Summary</h2>
              <span className="rounded-full bg-brand-green/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-green">
                Auto-generated · Goal: ₦250M by August
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-navy-foreground/90">
              {live?.aiSummary ?? "Connecting to ERP to generate your daily summary…"}
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

      {/* Active red alerts - top critical per center */}
      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h2 className="text-sm font-semibold text-destructive">Active Red Alerts</h2>
        <ul className="mt-3 space-y-2">
          {(live?.redAlertsByCenter ?? []).flatMap((c) =>
            c.alerts.slice(0, 2).map((a, i) => (
              <li key={`${c.center}-${i}`} className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex h-2 w-2 rounded-full", a.severity === "critical" ? "bg-destructive" : "bg-warn")} />
                  <span className="text-foreground">
                    <strong>{c.center} DC</strong> · {a.title}
                  </span>
                </div>
              </li>
            )),
          ).slice(0, 8)}
          {(!live || live.redAlertsByCenter.every((c) => c.alerts.length === 0)) && (
            <li className="rounded-md bg-card px-3 py-2 text-sm text-muted-foreground">No active red alerts.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

type InventoryLine = { sku: string; product: string; qty: number };

function CenterInventoryBlock({ ci }: { ci: { center: string; out: InventoryLine[]; low: InventoryLine[]; ok: InventoryLine[] } }) {
  return (
    <div className="space-y-2">
      <InventoryGroup label="Out of Stock" tone="destructive" rows={ci.out} />
      <InventoryGroup label="Low in Stock" tone="warn" rows={ci.low} />
      <InventoryGroup label="In Stock" tone="ok" rows={ci.ok} />
    </div>
  );
}

function InventoryGroup({
  label,
  tone,
  rows,
}: {
  label: string;
  tone: "destructive" | "warn" | "ok";
  rows: InventoryLine[];
}) {
  if (rows.length === 0) return null;
  const cls =
    tone === "destructive"
      ? "text-destructive bg-destructive/5 border-destructive/20"
      : tone === "warn"
        ? "text-warn bg-warn/5 border-warn/20"
        : "text-brand-green bg-brand-green/5 border-brand-green/20";
  return (
    <div className={cn("rounded-md border p-2", cls)}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider">{label} · {rows.length}</div>
      <ul className="space-y-0.5 text-[11px] text-foreground/90">
        {rows.map((r) => (
          <li key={r.sku} className="flex justify-between gap-2">
            <span className="truncate">{r.product}</span>
            <span className="font-mono">{r.qty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
