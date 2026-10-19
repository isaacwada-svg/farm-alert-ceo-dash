import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlarmClock, CalendarClock, PackageX, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import {
  PeriodQtyChart,
  ReorderTable,
  SalesForecastChart,
  useReorderSettings,
} from "@/components/procurement-widgets";
import { useErpOverview } from "@/hooks/use-erp-overview";
import { formatNaira } from "@/lib/dashboard-data";
import { PERIODS, needsOrder, planReorders, type Period } from "@/lib/procurement";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement — Farm Alert" },
      {
        name: "description",
        content:
          "Reorder alerts, units sold by week, month, quarter and year, and a 3-month sales forecast for procurement planning.",
      },
    ],
  }),
  component: ProcurementPage,
});

type StatusFilter = "action" | "soon" | "all";

function ProcurementPage() {
  const { data: erp, dataUpdatedAt, isError } = useErpOverview();
  const live = erp && erp.ok ? erp : null;
  const data = live?.procurement;

  const [settings, setSettings] = useReorderSettings();
  const [period, setPeriod] = useState<Period>("monthly");
  const [filter, setFilter] = useState<StatusFilter>("action");
  const [forecastMetric, setForecastMetric] = useState<"revenue" | "qty">("qty");

  const lines = useMemo(() => (data ? planReorders(data, settings) : []), [data, settings]);
  const orderNow = lines.filter(needsOrder);
  const orderSoon = lines.filter((l) => l.status === "order-soon");
  const stockouts = lines.filter((l) => l.status === "stockout");
  const shown =
    filter === "action" ? orderNow : filter === "soon" ? [...orderNow, ...orderSoon] : lines;

  const forecastQtyTotal = data?.forecastQty.reduce((a, b) => a + b, 0) ?? 0;
  const forecastRevenueTotal = data?.forecastRevenue.reduce((a, b) => a + b, 0) ?? 0;
  const series = data?.periods[period];
  const topItems = (data?.items ?? [])
    .filter((it) => it.qtyByPeriod[period].some((v) => v > 0))
    .sort((a, b) => sum(b.qtyByPeriod[period]) - sum(a.qtyByPeriod[period]))
    .slice(0, 15);
  const forecastItems = (data?.items ?? [])
    .filter((it) => sum(it.forecastQty) > 0)
    .sort((a, b) => sum(b.forecastQty) - sum(a.forecastQty))
    .slice(0, 20);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Procurement Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            What to order, when to order it, and expected sales for the next 3 months.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              isError ? "bg-destructive" : live ? "bg-brand-green" : "bg-warn",
            )}
          />
          <span className="text-muted-foreground">
            {isError
              ? "ERP unreachable"
              : live
                ? `Live ERP · updated ${lastUpdated}`
                : "Connecting to ERP…"}
          </span>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Order Now"
          value={orderNow.length}
          hint={`will run out within ${settings.leadTimeDays + settings.safetyDays} days`}
          icon={<AlarmClock className="h-4 w-4" />}
          tone="destructive"
        />
        <KpiCard
          label="Order Within 2 Weeks"
          value={orderSoon.length}
          hint="plan these purchase orders next"
          icon={<CalendarClock className="h-4 w-4" />}
          tone="warn"
        />
        <KpiCard
          label="Out of Stock (selling)"
          value={stockouts.length}
          hint="products with demand but zero stock"
          icon={<PackageX className="h-4 w-4" />}
          tone="destructive"
        />
        <KpiCard
          label="Forecast · Next 3 Months"
          value={formatNaira(forecastRevenueTotal)}
          hint={`${forecastQtyTotal.toLocaleString("en-NG")} units · ${data?.forecastLabels.join(", ") ?? "—"}`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="green"
        />
      </section>

      {/* Reorder alerts */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Reorder Alerts</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Days left = stock on hand ÷ average daily sales (last 90 days). Order once days left
              falls below lead time + safety buffer. Suggested quantity covers the next 3 months of
              forecast sales plus the buffer.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <NumberField
              label="Supplier lead time (days)"
              value={settings.leadTimeDays}
              onChange={(v) => setSettings({ ...settings, leadTimeDays: v })}
            />
            <NumberField
              label="Safety buffer (days)"
              value={settings.safetyDays}
              onChange={(v) => setSettings({ ...settings, safetyDays: v })}
            />
          </div>
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { key: "action", label: `Order now · ${orderNow.length}` },
            { key: "soon", label: `+ Within 2 weeks · ${orderNow.length + orderSoon.length}` },
            { key: "all", label: `All selling items · ${lines.length}` },
          ]}
        />
        <div className="mt-3">
          {live ? (
            <ReorderTable lines={shown} />
          ) : (
            <Placeholder text="Loading stock and sales from ERP…" />
          )}
        </div>
      </section>

      {/* Sales by quantity */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Units Sold</h2>
            <p className="text-xs text-muted-foreground">
              All 8 distribution centers · approved invoices · last bucket is the current, partial
              period.
            </p>
          </div>
          <Segmented value={period} onChange={setPeriod} options={PERIODS} />
        </div>
        <PeriodQtyChart series={series} />
        <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">
          Top 15 products by units sold
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="sticky left-0 bg-muted px-3 py-2">Product</th>
                {series?.labels.map((l) => (
                  <th key={l} className="whitespace-nowrap px-2 py-2 text-right">
                    {l}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((it) => (
                <tr key={it.itemCode} className="border-t border-border">
                  <td className="sticky left-0 max-w-56 truncate bg-card px-3 py-2 font-medium text-foreground">
                    {it.item}
                  </td>
                  {it.qtyByPeriod[period].map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        v === 0 && "text-muted-foreground/50",
                      )}
                    >
                      {Math.round(v).toLocaleString("en-NG")}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {Math.round(sum(it.qtyByPeriod[period])).toLocaleString("en-NG")}
                  </td>
                </tr>
              ))}
              {topItems.length === 0 && (
                <tr>
                  <td
                    colSpan={(series?.labels.length ?? 0) + 2}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    {live ? "No sales in this range." : "Loading…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3-month forecast */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">3-Month Sales Forecast</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Last 12 months actual vs the next 3 months forecast. Weighted average of the last 3
              complete months, adjusted for the 6-month trend.
            </p>
          </div>
          <Segmented
            value={forecastMetric}
            onChange={setForecastMetric}
            options={[
              { key: "qty", label: "Units" },
              { key: "revenue", label: "Revenue (₦)" },
            ]}
          />
        </div>
        <SalesForecastChart data={data} metric={forecastMetric} />
        <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">
          Forecast by product · top 20
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Product</th>
                {data?.forecastLabels.map((l) => (
                  <th key={l} className="px-3 py-2 text-right">
                    {l} (units)
                  </th>
                ))}
                <th className="px-3 py-2 text-right">3-month units</th>
                <th className="px-3 py-2 text-right">3-month revenue</th>
                <th className="px-3 py-2 text-right">In stock now</th>
              </tr>
            </thead>
            <tbody>
              {forecastItems.map((it) => {
                const total = sum(it.forecastQty);
                return (
                  <tr key={it.itemCode} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">
                      {it.item}
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {it.itemCode}
                      </div>
                    </td>
                    {it.forecastQty.map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums">
                        {Math.round(v).toLocaleString("en-NG")}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {Math.round(total).toLocaleString("en-NG")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-brand-green">
                      {formatNaira(sum(it.forecastRevenue))}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        it.stockQty < total && "font-semibold text-destructive",
                      )}
                    >
                      {Math.round(it.stockQty).toLocaleString("en-NG")}
                    </td>
                  </tr>
                );
              })}
              {forecastItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                    {live ? "Not enough sales history to forecast yet." : "Loading…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground">
      {label}
      <input
        type="number"
        min={0}
        max={365}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
        className="h-8 w-28 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      />
    </label>
  );
}

function Segmented<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K;
  onChange: (k: K) => void;
  options: readonly { key: K; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === o.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
