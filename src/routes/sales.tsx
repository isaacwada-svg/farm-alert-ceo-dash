import { createFileRoute } from "@tanstack/react-router";
import { PartnerSalesChart } from "@/components/dashboard-charts";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales — Farm Alert" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">Partner sales performance by region.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <PartnerSalesChart />
      </div>
    </div>
  ),
});
