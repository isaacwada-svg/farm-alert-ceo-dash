import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Farm Alert" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace, alerts and integrations.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Settings panel coming soon.
      </div>
    </div>
  ),
});
