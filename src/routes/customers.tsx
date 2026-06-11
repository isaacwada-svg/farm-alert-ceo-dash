import { createFileRoute } from "@tanstack/react-router";
import { CustomerActivityChart } from "@/components/dashboard-charts";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Farm Alert" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">New vs Returning customer activity.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <CustomerActivityChart />
      </div>
    </div>
  ),
});
