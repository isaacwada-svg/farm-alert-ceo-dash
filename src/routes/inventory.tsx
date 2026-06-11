import { createFileRoute } from "@tanstack/react-router";
import { InventoryTable } from "@/components/inventory-table";
import { InventoryForecastChart } from "@/components/dashboard-charts";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Farm Alert" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock status & forecasting across all distribution centers.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <InventoryTable />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-base font-semibold text-foreground">Forecasting</h2>
        <InventoryForecastChart />
      </div>
    </div>
  ),
});
