import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNaira } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REORDER_SETTINGS,
  REORDER_STATUS_META,
  needsOrder,
  type PeriodSeries,
  type ProcurementData,
  type ReorderLine,
  type ReorderSettings,
  type ReorderStatus,
} from "@/lib/procurement";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

const compactNaira = (v: number) =>
  v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1)}M` : `₦${Math.round(v / 1000)}k`;
const formatQty = (v: number) => Math.round(v).toLocaleString("en-NG");

/** Monthly revenue (or qty) for the last 12 months followed by the next 3 forecast months. */
export function SalesForecastChart({
  data,
  metric = "revenue",
  height = 260,
}: {
  data?: ProcurementData;
  metric?: "revenue" | "qty";
  height?: number;
}) {
  const monthly = data?.periods.monthly;
  const actual = monthly ? (metric === "revenue" ? monthly.revenue : monthly.qty) : [];
  const forecast = data ? (metric === "revenue" ? data.forecastRevenue : data.forecastQty) : [];
  const rows = [
    ...(monthly?.labels ?? []).map((label, i) => ({
      label,
      actual: Math.round(actual[i]),
      forecast: null as number | null,
    })),
    ...(data?.forecastLabels ?? []).map((label, i) => ({
      label,
      actual: null as number | null,
      forecast: forecast[i],
    })),
  ];
  const fmt = metric === "revenue" ? compactNaira : formatQty;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmt}
          width={56}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(v: number, name: string) => [
            metric === "revenue" ? formatNaira(v) : `${formatQty(v)} units`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Bar
          dataKey="actual"
          name="Actual (this month to date)"
          fill="var(--brand-navy)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="forecast"
          name="Forecast"
          fill="var(--brand-green)"
          fillOpacity={0.55}
          stroke="var(--brand-green)"
          strokeDasharray="4 2"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Units sold per bucket for the selected period. */
export function PeriodQtyChart({
  series,
  height = 240,
}: {
  series?: PeriodSeries;
  height?: number;
}) {
  const rows = (series?.labels ?? []).map((label, i) => ({
    label,
    qty: Math.round(series!.qty[i]),
    revenue: series!.revenue[i],
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatQty}
          width={56}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(v: number, _n: string, p: { payload?: { revenue: number } }) => [
            `${formatQty(v)} units · ${formatNaira(p.payload?.revenue ?? 0)}`,
            "Sold",
          ]}
        />
        <Bar
          dataKey="qty"
          name="Units sold"
          fill="var(--brand-navy)"
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReorderStatusBadge({ status }: { status: ReorderStatus }) {
  const meta = REORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        meta.tone === "destructive" && "bg-destructive/10 text-destructive",
        meta.tone === "warn" && "bg-warn/15 text-warn",
        meta.tone === "ok" && "bg-brand-green/15 text-brand-green",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.tone === "destructive"
            ? "bg-destructive"
            : meta.tone === "warn"
              ? "bg-warn"
              : "bg-brand-green",
        )}
      />
      {meta.label}
    </span>
  );
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : "—";

export function ReorderTable({
  lines,
  compact = false,
}: {
  lines: ReorderLine[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">In stock</th>
            {!compact && <th className="px-3 py-2 text-right">Sells / day</th>}
            <th className="px-3 py-2 text-right">Days left</th>
            {!compact && <th className="px-3 py-2 text-right">Runs out</th>}
            <th className="px-3 py-2 text-right">Order by</th>
            <th className="px-3 py-2 text-right">Suggested qty</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.itemCode} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-foreground">
                {l.item}
                <div className="text-[10px] font-normal text-muted-foreground">{l.itemCode}</div>
              </td>
              <td className="px-3 py-2">
                <ReorderStatusBadge status={l.status} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatQty(l.stockQty)}</td>
              {!compact && (
                <td className="px-3 py-2 text-right tabular-nums">{l.avgDailyQty.toFixed(1)}</td>
              )}
              <td className="px-3 py-2 text-right tabular-nums">{Math.floor(l.daysCover)}</td>
              {!compact && <td className="px-3 py-2 text-right">{formatDate(l.runOutDate)}</td>}
              <td
                className={cn(
                  "px-3 py-2 text-right font-semibold",
                  REORDER_STATUS_META[l.status].tone === "destructive" && "text-destructive",
                )}
              >
                {needsOrder(l) ? "Today" : formatDate(l.orderByDate)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatQty(l.suggestedQty)}
              </td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={compact ? 6 : 8} className="px-3 py-4 text-center text-muted-foreground">
                Nothing needs ordering right now.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const SETTINGS_KEY = "fa-reorder-settings";

/** Lead time / safety buffer, remembered per browser. */
export function useReorderSettings() {
  const [settings, setSettings] = useState<ReorderSettings>(DEFAULT_REORDER_SETTINGS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_REORDER_SETTINGS, ...JSON.parse(raw) });
    } catch {
      // storage unavailable — keep defaults
    }
  }, []);
  const update = (next: ReorderSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  return [settings, update] as const;
}
