import { createServerFn } from "@tanstack/react-start";

import { fetchRecentSalesInvoices, fetchStockBalance, type SalesInvoice, type StockRow } from "./erp.server";

// Map ERP warehouse names to dashboard region/center labels.
// Adjust the substrings on the right to match the user's actual warehouse naming.
const WAREHOUSE_REGION_MAP: { match: RegExp; region: string }[] = [
  { match: /lagos/i, region: "Lagos" },
  { match: /abuja/i, region: "Abuja" },
  { match: /kano/i, region: "Kano" },
  { match: /ibadan/i, region: "Ibadan" },
  { match: /adamawa/i, region: "Adamawa" },
  { match: /port\s*harcourt|phc|harcourt/i, region: "Port Harcourt" },
  { match: /taraba/i, region: "Taraba" },
  { match: /liberia|monrovia/i, region: "Liberia" },
  { match: /ghana|accra/i, region: "Ghana" },
  { match: /cameroon|douala/i, region: "Cameroon" },
  { match: /sierra|freetown/i, region: "Sierra Leone" },
  { match: /niger|niamey/i, region: "Niger" },
];

function regionFor(warehouse?: string | null, territory?: string | null): string {
  const hay = `${warehouse ?? ""} ${territory ?? ""}`;
  for (const entry of WAREHOUSE_REGION_MAP) {
    if (entry.match.test(hay)) return entry.region;
  }
  return warehouse?.split("-")[0]?.trim() || territory || "Other";
}

export type ErpOverview = {
  ok: true;
  fetchedAt: string;
  totalSalesToday: number;
  invoiceCountToday: number;
  totalRevenueAllTime: number;
  totalInvoicesAllTime: number;
  outstandingTotal: number;
  newCustomersThisWeek: number;
  returningCustomers: number;
  partnerSalesByRegion: { region: string; sales: number }[]; // in millions ₦
  inventory: {
    sku: string;
    product: string;
    center: string;
    qty: number;
    status: "out" | "low" | "ok";
  }[];
  outOfStockByCenter: { center: string; count: number }[];
} | { ok: false; error: string };

function summarise(invoices: SalesInvoice[], stock: StockRow[]): ErpOverview {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const todayInvoices = invoices.filter((i) => i.posting_date >= today);
  const totalSalesToday = todayInvoices.reduce((s, i) => s + (i.grand_total ?? 0), 0);
  const outstandingTotal = invoices.reduce((s, i) => s + (i.outstanding_amount ?? 0), 0);

  // Customer first-seen detection from invoice history we have.
  const firstSeen = new Map<string, string>();
  for (const inv of invoices) {
    const prev = firstSeen.get(inv.customer);
    if (!prev || inv.posting_date < prev) firstSeen.set(inv.customer, inv.posting_date);
  }
  let newCustomersThisWeek = 0;
  for (const [, date] of firstSeen) if (date >= sevenDaysAgo) newCustomersThisWeek++;
  const returningCustomers = firstSeen.size - newCustomersThisWeek;

  // Partner sales by region (this month).
  const monthStart = today.slice(0, 7) + "-01";
  const byRegion = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.posting_date < monthStart) continue;
    const region = regionFor(inv.set_warehouse, inv.territory);
    byRegion.set(region, (byRegion.get(region) ?? 0) + (inv.grand_total ?? 0));
  }
  const partnerSalesByRegion = [...byRegion.entries()]
    .map(([region, sales]) => ({ region, sales: +(sales / 1_000_000).toFixed(2) }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);

  // Inventory rows + out-of-stock counts.
  const inventory = stock.slice(0, 20).map((r) => {
    const qty = Number(r.bal_qty ?? 0);
    const status: "out" | "low" | "ok" = qty <= 0 ? "out" : qty < 10 ? "low" : "ok";
    return {
      sku: String(r.item_code),
      product: String(r.item_name ?? r.item_code),
      center: regionFor(typeof r.warehouse === "string" ? r.warehouse : null),
      qty,
      status,
    };
  });

  const oosMap = new Map<string, number>();
  for (const r of stock) {
    const qty = Number(r.bal_qty ?? 0);
    if (qty > 0) continue;
    const center = regionFor(typeof r.warehouse === "string" ? r.warehouse : null);
    oosMap.set(center, (oosMap.get(center) ?? 0) + 1);
  }
  const outOfStockByCenter = [...oosMap.entries()]
    .map(([center, count]) => ({ center, count }))
    .sort((a, b) => b.count - a.count);

  return {
    ok: true,
    fetchedAt: new Date().toISOString(),
    totalSalesToday,
    invoiceCountToday: todayInvoices.length,
    outstandingTotal,
    newCustomersThisWeek,
    returningCustomers,
    partnerSalesByRegion,
    inventory,
    outOfStockByCenter,
  };
}

export const getErpOverview = createServerFn({ method: "GET" }).handler(async (): Promise<ErpOverview> => {
  try {
    const [invoices, stock] = await Promise.all([
      fetchRecentSalesInvoices(200),
      fetchStockBalance().catch(() => [] as StockRow[]),
    ]);
    return summarise(invoices, stock);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
