import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
  icon: ReactNode;
  tone?: "navy" | "green" | "warn" | "destructive";
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  navy: "bg-brand-navy/10 text-brand-navy",
  green: "bg-brand-green/15 text-brand-green",
  warn: "bg-warn/15 text-warn",
  destructive: "bg-destructive/10 text-destructive",
};

export function KpiCard({ label, value, delta, hint, icon, tone = "navy" }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses[tone])}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold leading-tight text-foreground">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive ? "bg-brand-green/15 text-brand-green" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
