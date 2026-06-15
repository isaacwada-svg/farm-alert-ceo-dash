import { createFileRoute } from "@tanstack/react-router";
import { CustomerActivityChart } from "@/components/dashboard-charts";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";
import { Users, UserPlus, Repeat, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Farm Alert" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  const totalActive = (live?.returningCustomers ?? 0) + (live?.newCustomers30d ?? 0);
  const repeatRate = totalActive > 0 ? Math.round(((live?.returningCustomers ?? 0) / totalActive) * 100) : 0;
  const avgOrderValue =
    live && live.top10Customers.length > 0
      ? live.top10Customers.reduce((s, c) => s + c.totalSpent, 0) /
        Math.max(1, live.top10Customers.reduce((s, c) => s + c.orderCount, 0))
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Buying behaviour, new vs returning trends, and the top 10 customers across all centers.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Customers (30d)" value={totalActive.toLocaleString()} icon={<Users className="h-4 w-4" />} tone="navy" />
        <KpiCard label="New (30d)" value={live?.newCustomers30d ?? 0} icon={<UserPlus className="h-4 w-4" />} tone="green" />
        <KpiCard label="Returning" value={(live?.returningCustomers ?? 0).toLocaleString()} hint={`Repeat rate: ${repeatRate}%`} icon={<Repeat className="h-4 w-4" />} tone="navy" />
        <KpiCard label="Avg Order Value (top 10)" value={formatNaira(avgOrderValue)} icon={<TrendingUp className="h-4 w-4" />} tone="green" />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">New vs Returning · Last 8 Weeks</h2>
        <p className="text-xs text-muted-foreground">Trend across the network</p>
        <div className="mt-3">
          <CustomerActivityChart data={live?.customerActivityWeekly} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Top 10 Customers · All Centers</h2>
        <p className="text-xs text-muted-foreground">Lifetime spend, last month comparison and most recent order</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Center</th>
                <th className="px-3 py-2 text-right">Total Spent</th>
                <th className="px-3 py-2 text-right">Last Month</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {(live?.top10Customers ?? []).map((c, i) => (
                <tr key={c.customer} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.region}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{formatNaira(c.totalSpent)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{formatNaira(c.lastMonthSpent)}</td>
                  <td className="px-3 py-2 text-right">{c.orderCount}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{c.lastOrder || "—"}</td>
                </tr>
              ))}
              {(!live || live.top10Customers.length === 0) && (
                <tr><td className="px-3 py-4 text-center text-muted-foreground" colSpan={7}>Loading customer rankings…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-brand-navy/20 bg-brand-navy/5 p-5">
        <h2 className="text-sm font-semibold text-brand-navy">Behaviour Insights</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          <li>Repeat-purchase rate over the last 30 days is <strong>{repeatRate}%</strong> — every 1 pt lift here compounds on the ₦250M target.</li>
          <li><strong>{live?.newCustomers30d ?? 0}</strong> new partners joined in the last 30 days, of which <strong>{live?.newCustomersThisWeek ?? 0}</strong> this week.</li>
          <li>Top 10 customers contribute <strong>{formatNaira((live?.top10Customers ?? []).reduce((s, c) => s + c.totalSpent, 0))}</strong> lifetime — set up a CEO-tier loyalty review with them this month.</li>
        </ul>
      </section>
    </div>
  );
}
