import { createFileRoute } from "@tanstack/react-router";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { CENTERS } from "@/lib/erp.functions";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Red Alerts — Farm Alert" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: erp } = useErpOverview();
  const live = erp && erp.ok ? erp : null;
  const blocks = live?.redAlertsByCenter ?? CENTERS.map((c) => ({ center: c, alerts: [] as { title: string; severity: "critical" | "warning" }[] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Red Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Critical operational events organized per distribution center.
        </p>
      </div>

      {blocks.map((b) => (
        <section key={b.center} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">{b.center} Distribution Center</h2>
            <span className="text-xs text-muted-foreground">{b.alerts.length} alert{b.alerts.length === 1 ? "" : "s"}</span>
          </div>
          {b.alerts.length === 0 ? (
            <div className="rounded-md border border-brand-green/30 bg-brand-green/5 px-3 py-2 text-sm text-brand-green">
              All clear — no active red alerts.
            </div>
          ) : (
            <ul className="space-y-2">
              {b.alerts.map((a, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                    a.severity === "critical" ? "border-destructive/30 bg-destructive/5" : "border-warn/30 bg-warn/5",
                  )}
                >
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4", a.severity === "critical" ? "text-destructive" : "text-warn")} />
                  <span className="text-foreground">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
