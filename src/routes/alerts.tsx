import { createFileRoute } from "@tanstack/react-router";
import { redAlerts } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Red Alerts — Farm Alert" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Red Alerts</h1>
        <p className="text-sm text-muted-foreground">Critical operational events requiring action.</p>
      </div>
      <ul className="space-y-3">
        {redAlerts.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4",
              a.severity === "critical"
                ? "border-destructive/30 bg-destructive/5"
                : "border-warn/30 bg-warn/5",
            )}
          >
            <AlertTriangle
              className={cn(
                "mt-0.5 h-5 w-5",
                a.severity === "critical" ? "text-destructive" : "text-warn",
              )}
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  ),
});
