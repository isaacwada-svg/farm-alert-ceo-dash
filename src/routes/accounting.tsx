import { createFileRoute } from "@tanstack/react-router";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";
import { KpiCard } from "@/components/kpi-card";
import { Banknote, Wallet, Receipt, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting — Farm Alert" },
      { name: "description", content: "Receivables, advance payments and revenue summary per distribution center for executive review." },
    ],
  }),
  component: AccountingPage,
});

function AccountingPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;

  const totalReceivable = live?.outstandingTotal ?? 0;
  const totalAdvances = live?.advancesTotal ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Accounting</h1>
        <p className="text-sm text-muted-foreground">
          Cash position, receivables and advance payments — totals and per-center breakdowns.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Revenue (All-Time)" value={formatNaira(live?.totalRevenueAllTime ?? 0)} icon={<Banknote className="h-4 w-4" />} tone="navy" />
        <KpiCard label="MTD Revenue" value={formatNaira(live?.mtdRevenue ?? 0)} hint={`Last month: ${formatNaira(live?.lastMonthRevenue ?? 0)}`} icon={<Wallet className="h-4 w-4" />} tone="green" />
        <KpiCard label="Total Receivables" value={formatNaira(totalReceivable)} hint="Outstanding from sales invoices" icon={<Receipt className="h-4 w-4" />} tone="warn" />
        <KpiCard label="Customer Advances" value={formatNaira(totalAdvances)} hint="Unallocated incoming payments" icon={<PiggyBank className="h-4 w-4" />} tone="navy" />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Receivables & Advances by Center</h2>
        <p className="text-xs text-muted-foreground">All 8 distribution centers · live from ERP</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Center</th>
                <th className="px-3 py-2 text-right">Outstanding Receivable</th>
                <th className="px-3 py-2 text-right">Customer Advances</th>
                <th className="px-3 py-2 text-right">Net Exposure</th>
              </tr>
            </thead>
            <tbody>
              {(live?.receivablesByCenter ?? []).map((r) => (
                <tr key={r.center} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{r.center} Distribution Center</td>
                  <td className="px-3 py-2 text-right text-foreground">{formatNaira(r.outstanding)}</td>
                  <td className="px-3 py-2 text-right text-brand-green">{formatNaira(r.advances)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{formatNaira(r.outstanding - r.advances)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-muted/40 font-semibold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{formatNaira(totalReceivable)}</td>
                <td className="px-3 py-2 text-right text-brand-green">{formatNaira(totalAdvances)}</td>
                <td className="px-3 py-2 text-right">{formatNaira(totalReceivable - totalAdvances)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-brand-navy/20 bg-brand-navy/5 p-5 text-sm">
        <h2 className="text-sm font-semibold text-brand-navy">CEO Notes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
          <li>Net cash exposure across the network is <strong>{formatNaira(totalReceivable - totalAdvances)}</strong> — focus collection effort on centers with the largest outstanding.</li>
          <li>Advances of <strong>{formatNaira(totalAdvances)}</strong> are sitting unallocated — finance should match these to open invoices before month-end.</li>
          <li>This month so far contributes <strong>{formatNaira(live?.mtdRevenue ?? 0)}</strong> toward the ₦250M (Jun–Aug) target.</li>
        </ul>
      </section>
    </div>
  );
}
