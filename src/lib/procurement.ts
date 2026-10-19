// Procurement analytics: sales quantity by period, 3-month demand forecast,
// and reorder timing. Pure functions — safe on both server and client.

export type Period = "weekly" | "monthly" | "quarterly" | "yearly";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

// Number of buckets returned per period (the last bucket is the current, partial one).
const BUCKETS: Record<Period, number> = { weekly: 12, monthly: 12, quarterly: 8, yearly: 3 };
export const FORECAST_MONTHS = 3;
const DEMAND_WINDOW_DAYS = 90;

export type SaleLine = {
  date: string; // YYYY-MM-DD posting date
  itemCode: string;
  item: string;
  qty: number;
  revenue: number;
  center: string | null;
};

export type StockLine = { itemCode: string; item: string; center: string; qty: number };

export type PeriodSeries = {
  labels: string[];
  qty: number[];
  revenue: number[];
};

export type ItemProcurement = {
  itemCode: string;
  item: string;
  stockQty: number;
  stockByCenter: { center: string; qty: number }[];
  avgDailyQty: number; // over the last 90 days
  qtyByPeriod: Record<Period, number[]>;
  forecastQty: number[]; // next 3 calendar months
  forecastRevenue: number[];
};

export type ProcurementData = {
  asOf: string;
  periods: Record<Period, PeriodSeries>;
  forecastLabels: string[];
  forecastQty: number[];
  forecastRevenue: number[];
  items: ItemProcurement[];
};

// ---------- date helpers (UTC, so server and browser agree) ----------
const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDay(s: string) {
  return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
}
function monthIndex(t: number) {
  const d = new Date(t);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}
function monthLabel(mi: number) {
  return `${MONTHS[mi % 12]} ${String(Math.floor(mi / 12)).slice(2)}`;
}
function dayLabel(t: number) {
  const d = new Date(t);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Index (0..n-1) of the bucket a sale falls in for a period, or -1 if out of range. */
function bucketOf(period: Period, t: number, today: number) {
  const n = BUCKETS[period];
  let back: number;
  if (period === "weekly") back = Math.floor((today - t) / (7 * DAY));
  else if (period === "monthly") back = monthIndex(today) - monthIndex(t);
  else if (period === "quarterly")
    back = Math.floor(monthIndex(today) / 3) - Math.floor(monthIndex(t) / 3);
  else back = new Date(today).getUTCFullYear() - new Date(t).getUTCFullYear();
  return back < 0 || back >= n ? -1 : n - 1 - back;
}

function bucketLabels(period: Period, today: number): string[] {
  const n = BUCKETS[period];
  return Array.from({ length: n }, (_, i) => {
    const back = n - 1 - i;
    if (period === "weekly") return back === 0 ? "This wk" : dayLabel(today - (back * 7 + 6) * DAY);
    if (period === "monthly") return monthLabel(monthIndex(today) - back);
    if (period === "quarterly") {
      const q = Math.floor(monthIndex(today) / 3) - back;
      return `Q${(q % 4) + 1} ${String(Math.floor(q / 4)).slice(2)}`;
    }
    return String(new Date(today).getUTCFullYear() - back);
  });
}

/**
 * Forecast the next months from completed monthly history: a weighted average of
 * the last 3 months plus half the 6-month linear trend, floored at zero.
 */
export function forecastMonthly(history: number[], ahead = FORECAST_MONTHS): number[] {
  if (history.length === 0) return Array(ahead).fill(0);
  const last3 = history.slice(-3);
  const weights = [1, 2, 3].slice(-last3.length);
  const base =
    last3.reduce((s, v, i) => s + v * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
  const window = history.slice(-6);
  let slope = 0;
  if (window.length >= 3) {
    const n = window.length;
    const xMean = (n - 1) / 2;
    const yMean = window.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    window.forEach((y, x) => {
      num += (x - xMean) * (y - yMean);
      den += (x - xMean) ** 2;
    });
    slope = den > 0 ? (num / den) * 0.5 : 0;
  }
  return Array.from({ length: ahead }, (_, k) => Math.max(0, base + slope * (k + 1)));
}

export function buildProcurement(
  sales: SaleLine[],
  stock: StockLine[],
  now = new Date(),
): ProcurementData {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const curMonth = monthIndex(today);
  // 12 completed months feed the forecast (current partial month excluded).
  const histMonths = 12;

  const periods = Object.fromEntries(
    (Object.keys(BUCKETS) as Period[]).map((p) => [
      p,
      {
        labels: bucketLabels(p, today),
        qty: Array(BUCKETS[p]).fill(0),
        revenue: Array(BUCKETS[p]).fill(0),
      },
    ]),
  ) as Record<Period, PeriodSeries>;

  type Acc = {
    item: string;
    qtyByPeriod: Record<Period, number[]>;
    histQty: number[];
    histRevenue: number[];
    recentQty: number;
  };
  const byItem = new Map<string, Acc>();
  const netHistQty = Array(histMonths).fill(0);
  const netHistRevenue = Array(histMonths).fill(0);
  const ensure = (code: string, name: string) => {
    let a = byItem.get(code);
    if (!a) {
      a = {
        item: name,
        qtyByPeriod: Object.fromEntries(
          (Object.keys(BUCKETS) as Period[]).map((p) => [p, Array(BUCKETS[p]).fill(0)]),
        ) as Record<Period, number[]>,
        histQty: Array(histMonths).fill(0),
        histRevenue: Array(histMonths).fill(0),
        recentQty: 0,
      };
      byItem.set(code, a);
    }
    return a;
  };

  for (const s of sales) {
    if (!s.date) continue;
    const t = parseDay(s.date);
    if (t > today) continue;
    const a = ensure(s.itemCode, s.item);
    for (const p of Object.keys(BUCKETS) as Period[]) {
      const b = bucketOf(p, t, today);
      if (b < 0) continue;
      periods[p].qty[b] += s.qty;
      periods[p].revenue[b] += s.revenue;
      a.qtyByPeriod[p][b] += s.qty;
    }
    const mBack = curMonth - monthIndex(t); // 1 = last completed month
    if (mBack >= 1 && mBack <= histMonths) {
      a.histQty[histMonths - mBack] += s.qty;
      a.histRevenue[histMonths - mBack] += s.revenue;
      netHistQty[histMonths - mBack] += s.qty;
      netHistRevenue[histMonths - mBack] += s.revenue;
    }
    if (today - t < DEMAND_WINDOW_DAYS * DAY) a.recentQty += s.qty;
  }

  const stockByItem = new Map<
    string,
    { item: string; total: number; centers: Map<string, number> }
  >();
  for (const r of stock) {
    const e = stockByItem.get(r.itemCode) ?? { item: r.item, total: 0, centers: new Map() };
    e.total += r.qty;
    e.centers.set(r.center, (e.centers.get(r.center) ?? 0) + r.qty);
    stockByItem.set(r.itemCode, e);
    ensure(r.itemCode, r.item);
  }

  // Trim leading empty months so a new product's history isn't diluted by zeros.
  const trimLeading = (arr: number[]) => {
    const first = arr.findIndex((v) => v > 0);
    return first < 0 ? [] : arr.slice(first);
  };

  const items: ItemProcurement[] = [...byItem.entries()].map(([code, a]) => {
    const st = stockByItem.get(code);
    const forecastQty = forecastMonthly(trimLeading(a.histQty));
    const totalHistQty = a.histQty.reduce((x, y) => x + y, 0);
    const unitPrice =
      totalHistQty > 0 ? a.histRevenue.reduce((x, y) => x + y, 0) / totalHistQty : 0;
    return {
      itemCode: code,
      item: a.item,
      stockQty: st?.total ?? 0,
      stockByCenter: [...(st?.centers.entries() ?? [])].map(([center, qty]) => ({ center, qty })),
      avgDailyQty: a.recentQty / DEMAND_WINDOW_DAYS,
      qtyByPeriod: a.qtyByPeriod,
      forecastQty: forecastQty.map((v) => +v.toFixed(1)),
      forecastRevenue: forecastQty.map((v) => Math.round(v * unitPrice)),
    };
  });

  const forecastQty = forecastMonthly(trimLeading(netHistQty));
  const forecastRevenue = forecastMonthly(trimLeading(netHistRevenue));

  return {
    asOf: new Date(today).toISOString().slice(0, 10),
    periods,
    forecastLabels: Array.from({ length: FORECAST_MONTHS }, (_, k) => monthLabel(curMonth + k + 1)),
    forecastQty: forecastQty.map((v) => Math.round(v)),
    forecastRevenue: forecastRevenue.map((v) => Math.round(v)),
    items: items.sort((x, y) => y.avgDailyQty - x.avgDailyQty),
  };
}

// ---------- Reorder planning ----------
export type ReorderSettings = {
  leadTimeDays: number; // supplier order → stock on shelf
  safetyDays: number; // buffer stock kept on top of lead-time demand
};

export const DEFAULT_REORDER_SETTINGS: ReorderSettings = { leadTimeDays: 30, safetyDays: 14 };

export type ReorderStatus = "stockout" | "critical" | "order-now" | "order-soon" | "ok";

export const REORDER_STATUS_META: Record<
  ReorderStatus,
  { label: string; rank: number; tone: "destructive" | "warn" | "ok" }
> = {
  stockout: { label: "Out of stock", rank: 0, tone: "destructive" },
  critical: { label: "Late — order today", rank: 1, tone: "destructive" },
  "order-now": { label: "Order now", rank: 2, tone: "warn" },
  "order-soon": { label: "Order within 2 wks", rank: 3, tone: "warn" },
  ok: { label: "OK", rank: 4, tone: "ok" },
};

export type ReorderLine = ItemProcurement & {
  status: ReorderStatus;
  daysCover: number; // Infinity when there is no recent demand
  runOutDate: string | null;
  orderByDate: string | null;
  suggestedQty: number;
};

function addDays(iso: string, days: number) {
  return new Date(parseDay(iso) + Math.max(0, Math.floor(days)) * DAY).toISOString().slice(0, 10);
}

/**
 * Items with recent demand, ranked by urgency. An item must be ordered once its stock
 * cover drops below lead time + safety days; the suggested quantity covers the next
 * 3 months of forecast demand plus the safety buffer, minus stock on hand.
 */
export function planReorders(data: ProcurementData, settings: ReorderSettings): ReorderLine[] {
  const { leadTimeDays: lead, safetyDays: safety } = settings;
  return data.items
    .filter((it) => it.avgDailyQty > 0)
    .map((it) => {
      const stock = Math.max(0, it.stockQty);
      const daysCover = stock / it.avgDailyQty;
      let status: ReorderStatus = "ok";
      if (stock <= 0) status = "stockout";
      else if (daysCover < lead) status = "critical";
      else if (daysCover < lead + safety) status = "order-now";
      else if (daysCover < lead + safety + 14) status = "order-soon";
      const demand3m = it.forecastQty.reduce((a, b) => a + b, 0);
      const suggestedQty = Math.max(0, Math.ceil(demand3m + it.avgDailyQty * safety - stock));
      return {
        ...it,
        status,
        daysCover,
        runOutDate: addDays(data.asOf, daysCover),
        orderByDate: addDays(data.asOf, daysCover - lead - safety),
        suggestedQty,
      };
    })
    .sort(
      (a, b) =>
        REORDER_STATUS_META[a.status].rank - REORDER_STATUS_META[b.status].rank ||
        a.daysCover - b.daysCover,
    );
}

export function needsOrder(line: ReorderLine) {
  return line.status !== "ok" && line.status !== "order-soon";
}
