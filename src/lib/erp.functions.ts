import { createServerFn } from "@tanstack/react-start";

import {
  fetchRecentSalesInvoices,
  fetchSalesInvoiceItems,
  fetchStockBalance,
  fetchCustomers,
  fetchCustomerAddresses,
  fetchPaymentEntries,
  type SalesInvoice,
  type InvoiceItem,
  type StockRow,
  type CustomerRow,
  type AddressRow,
  type PaymentEntry,
} from "./erp.server";

// === Canonical 8 distribution centers ============================
export const CENTERS = [
  "Abuja",
  "Lagos",
  "Ibadan",
  "Kano",
  "Port Harcourt",
  "Taraba",
  "Adamawa",
  "Liberia",
] as const;
export type Center = (typeof CENTERS)[number];

const CENTER_MATCHERS: { match: RegExp; center: Center }[] = [
  { match: /lagos/i, center: "Lagos" },
  { match: /abuja|fct/i, center: "Abuja" },
  { match: /kano/i, center: "Kano" },
  { match: /ibadan|oyo/i, center: "Ibadan" },
  { match: /adamawa|yola/i, center: "Adamawa" },
  { match: /port\s*harcourt|phc|harcourt|rivers/i, center: "Port Harcourt" },
  { match: /taraba|jalingo/i, center: "Taraba" },
  { match: /liberia|monrovia/i, center: "Liberia" },
];

function centerFor(warehouse?: string | null, territory?: string | null): Center | null {
  const hay = `${warehouse ?? ""} ${territory ?? ""}`;
  for (const m of CENTER_MATCHERS) if (m.match.test(hay)) return m.center;
  return null;
}

// Approximate Nigerian state coordinates for map plotting.
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  Kano: { lat: 12.0022, lng: 8.5919 },
  Ibadan: { lat: 7.3775, lng: 3.947 },
  Oyo: { lat: 7.85, lng: 3.93 },
  Adamawa: { lat: 9.3265, lng: 12.3984 },
  "Port Harcourt": { lat: 4.8156, lng: 7.0498 },
  Rivers: { lat: 4.8472, lng: 6.9745 },
  Taraba: { lat: 8.8937, lng: 11.3604 },
  Liberia: { lat: 6.3004, lng: -10.7969 },
  Kaduna: { lat: 10.5222, lng: 7.4383 },
  Plateau: { lat: 9.8965, lng: 8.8583 },
  Enugu: { lat: 6.5244, lng: 7.5186 },
  Delta: { lat: 5.8903, lng: 5.6804 },
  Anambra: { lat: 6.2209, lng: 6.937 },
  Edo: { lat: 6.34, lng: 5.62 },
  Borno: { lat: 11.8311, lng: 13.151 },
  Bauchi: { lat: 10.3158, lng: 9.8442 },
  Sokoto: { lat: 13.0059, lng: 5.2476 },
  Benue: { lat: 7.7322, lng: 8.5391 },
};

function coordsFor(label: string): { lat: number; lng: number } | null {
  if (STATE_COORDS[label]) return STATE_COORDS[label];
  for (const k of Object.keys(STATE_COORDS)) {
    if (label.toLowerCase().includes(k.toLowerCase())) return STATE_COORDS[k];
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function parseCoords(record: CustomerRow | AddressRow): { lat: number; lng: number } | null {
  const lat = parseNumber(record.latitude ?? record.custom_latitude ?? record.custom_lat);
  const lng = parseNumber(record.longitude ?? record.custom_longitude ?? record.custom_lng);
  if (lat !== null && lng !== null) return { lat, lng };
  const geo = record.custom_geolocation;
  if (!geo) return null;
  try {
    const parsed = JSON.parse(geo) as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
    const pLat = parseNumber(parsed.lat ?? parsed.latitude);
    const pLng = parseNumber(parsed.lng ?? parsed.longitude);
    if (pLat !== null && pLng !== null) return { lat: pLat, lng: pLng };
  } catch {
    const match = geo.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (match) return { lat: Number(match[1]), lng: Number(match[2]) };
  }
  return null;
}

// === Public output type =========================================
export type CenterInventory = {
  center: Center;
  out: { sku: string; product: string; qty: number }[];
  low: { sku: string; product: string; qty: number }[];
  ok: { sku: string; product: string; qty: number }[];
};

export type CenterSales = {
  center: Center;
  mtd: number;
  lastMonth: number;
  deltaPct: number;
  sixMonthHigh: number;
  sixMonthHighMonth: string;
  soldQtyMtd: number;
  approvedInvoiceCountMtd: number;
  topItemsMtd: { itemCode: string; item: string; qty: number; sales: number }[];
  recommendation: string;
};

export type ProductForecast = {
  item: string;
  itemCode: string;
  last30dQty: number;
  last30dRevenue: number;
  projected90dQty: number;
  projected90dRevenue: number;
};

export type TopCustomer = {
  customer: string;
  name: string;
  totalSpent: number;
  lastMonthSpent: number;
  orderCount: number;
  region: string;
  lastOrder: string;
};

export type CenterReceivable = { center: Center; outstanding: number; advances: number };

export type RegionMapPoint = {
  id?: string;
  type?: "center" | "customer";
  region: string;
  center?: Center;
  customer?: string;
  customerName?: string;
  address?: string;
  registeredAt?: string;
  lastPurchase?: string;
  lat: number;
  lng: number;
  sales: number;
  customers: number;
  newPartners: number;
};

export type ErpOverviewOK = {
  ok: true;
  fetchedAt: string;
  // Headlines
  totalSalesToday: number;
  invoiceCountToday: number;
  totalRevenueAllTime: number;
  totalInvoicesAllTime: number;
  outstandingTotal: number;
  advancesTotal: number;
  mtdRevenue: number;
  lastMonthRevenue: number;
  monthGoalNaira: number; // 250M / 3 -> per month target
  // Customers
  newCustomersThisWeek: number;
  newCustomers30d: number;
  returningCustomers: number;
  customerActivityWeekly: { week: string; new: number; returning: number }[];
  top10Customers: TopCustomer[];
  // Sales
  partnerSalesByRegion: { region: string; sales: number }[]; // ₦M MTD
  centerSales: CenterSales[];
  // Inventory
  inventoryTop10ByCenter: CenterInventory[]; // top 10 lines / center for overview
  inventoryFullByCenter: CenterInventory[]; // full breakdown for inventory page
  outOfStockByCenter: { center: string; count: number }[];
  // Forecast
  productForecast: ProductForecast[];
  centerForecast: { center: Center; projected90dRevenue: number }[];
  // Receivables
  receivablesByCenter: CenterReceivable[];
  // Map
  regionMapPoints: RegionMapPoint[];
  // Alerts
  redAlertsByCenter: { center: Center; alerts: { title: string; severity: "critical" | "warning" }[] }[];
  // AI summary inputs
  aiSummary: string;
};

export type ErpOverview = ErpOverviewOK | { ok: false; error: string };

// ================= Summarisation ==================================
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function startOfPrevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
}

function summarise(
  invoices: SalesInvoice[],
  items: InvoiceItem[],
  stock: StockRow[],
  customers: CustomerRow[],
  addresses: AddressRow[],
  payments: PaymentEntry[],
): ErpOverviewOK {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfPrevMonth(now);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const invoiceByName = new Map(invoices.map((i) => [i.name, i]));
  const approvedItems = items.filter((it) => invoiceByName.has(it.parent));
  const itemCenter = (it: InvoiceItem): Center | null => {
    const inv = invoiceByName.get(it.parent);
    return centerFor(it.warehouse, inv?.set_warehouse ?? inv?.territory);
  };
  const itemRevenue = (it: InvoiceItem) => Number(it.net_amount ?? it.amount ?? 0);

  const customerCoords = new Map<string, { lat: number; lng: number }>();
  const customerAddressLabel = new Map<string, string>();
  for (const c of customers) {
    const coords = parseCoords(c);
    if (coords) customerCoords.set(c.name, coords);
  }
  for (const a of addresses) {
    const coords = parseCoords(a);
    const label = [a.address_title, a.city, a.state, a.country].filter(Boolean).join(", ");
    for (const c of customers) {
      if (c.customer_primary_address !== a.name) continue;
      if (coords) customerCoords.set(c.name, coords);
      if (label) customerAddressLabel.set(c.name, label);
    }
  }

  // ---------- Headlines ----------
  const todayInvoices = invoices.filter((i) => i.posting_date >= today);
  const totalSalesToday = todayInvoices.reduce((s, i) => s + (i.grand_total ?? 0), 0);
  const totalRevenueAllTime = invoices.reduce((s, i) => s + (i.grand_total ?? 0), 0);
  const outstandingTotal = invoices.reduce((s, i) => s + (i.outstanding_amount ?? 0), 0);
  const advancesTotal = payments.reduce((s, p) => s + (p.unallocated_amount ?? 0), 0);
  const mtdRevenue = invoices
    .filter((i) => i.posting_date >= monthStart)
    .reduce((s, i) => s + (i.grand_total ?? 0), 0);
  const lastMonthRevenue = invoices
    .filter((i) => i.posting_date >= prevMonthStart && i.posting_date < monthStart)
    .reduce((s, i) => s + (i.grand_total ?? 0), 0);

  // ---------- Customers ----------
  const firstSeen = new Map<string, string>();
  const lastSeen = new Map<string, string>();
  const customerTotal = new Map<string, number>();
  const customerLastMonth = new Map<string, number>();
  const customerOrders = new Map<string, number>();
  const customerName = new Map<string, string>();
  const customerRegion = new Map<string, string>();

  for (const inv of invoices) {
    const cust = inv.customer;
    const prev = firstSeen.get(cust);
    if (!prev || inv.posting_date < prev) firstSeen.set(cust, inv.posting_date);
    const lst = lastSeen.get(cust);
    if (!lst || inv.posting_date > lst) lastSeen.set(cust, inv.posting_date);
    customerTotal.set(cust, (customerTotal.get(cust) ?? 0) + (inv.grand_total ?? 0));
    if (inv.posting_date >= prevMonthStart && inv.posting_date < monthStart) {
      customerLastMonth.set(cust, (customerLastMonth.get(cust) ?? 0) + (inv.grand_total ?? 0));
    }
    customerOrders.set(cust, (customerOrders.get(cust) ?? 0) + 1);
    if (!customerName.has(cust)) customerName.set(cust, inv.customer_name ?? cust);
    if (!customerRegion.has(cust)) {
      const c = centerFor(inv.set_warehouse, inv.territory);
      customerRegion.set(cust, c ?? inv.territory ?? "Other");
    }
  }
  // also pull from Customer doctype for first seen if more accurate
  for (const c of customers) {
    if (c.creation) {
      const cdate = c.creation.slice(0, 10);
      const prev = firstSeen.get(c.name);
      if (!prev || cdate < prev) firstSeen.set(c.name, cdate);
    }
    if (c.customer_name && !customerName.has(c.name)) customerName.set(c.name, c.customer_name);
  }

  let newCustomersThisWeek = 0;
  let newCustomers30d = 0;
  for (const [, date] of firstSeen) {
    if (date >= sevenDaysAgo) newCustomersThisWeek++;
    if (date >= thirtyDaysAgo) newCustomers30d++;
  }
  const returningCustomers = firstSeen.size - newCustomers30d;

  // Weekly activity for last 8 weeks
  const weekBuckets = new Map<string, { new: number; returning: number }>();
  for (let w = 7; w >= 0; w--) {
    const d = new Date(Date.now() - w * 7 * 86400000);
    const key = `W${8 - w}`;
    weekBuckets.set(key, { new: 0, returning: 0 });
    void d;
  }
  const weekKeys = [...weekBuckets.keys()];
  for (const [cust, date] of firstSeen) {
    const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (daysAgo < 0 || daysAgo > 56) continue;
    const idx = 7 - Math.floor(daysAgo / 7);
    if (idx >= 0 && idx < 8) {
      const k = weekKeys[idx];
      const bucket = weekBuckets.get(k)!;
      bucket.new++;
    }
    void cust;
  }
  for (const inv of invoices) {
    const daysAgo = Math.floor((Date.now() - new Date(inv.posting_date).getTime()) / 86400000);
    if (daysAgo < 0 || daysAgo > 56) continue;
    const idx = 7 - Math.floor(daysAgo / 7);
    if (idx < 0 || idx >= 8) continue;
    const k = weekKeys[idx];
    const bucket = weekBuckets.get(k)!;
    const fs = firstSeen.get(inv.customer);
    if (fs && fs < inv.posting_date) bucket.returning++;
  }
  const customerActivityWeekly = [...weekBuckets.entries()].map(([week, v]) => ({ week, ...v }));

  const top10Customers: TopCustomer[] = [...customerTotal.entries()]
    .map(([cust, total]) => ({
      customer: cust,
      name: customerName.get(cust) ?? cust,
      totalSpent: total,
      lastMonthSpent: customerLastMonth.get(cust) ?? 0,
      orderCount: customerOrders.get(cust) ?? 0,
      region: customerRegion.get(cust) ?? "Other",
      lastOrder: lastSeen.get(cust) ?? "",
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // ---------- Partner sales MTD by center ----------
  // Per-center sales are calculated from approved Sales Invoice Items by their own warehouse,
  // so invoices with mixed warehouses are not combined into the header warehouse.
  const mtdByCenter = new Map<Center, number>();
  const lastMonthByCenter = new Map<Center, number>();
  const mtdQtyByCenter = new Map<Center, number>();
  const mtdInvoicesByCenter = new Map<Center, Set<string>>();
  const mtdItemsByCenter = new Map<Center, Map<string, { item: string; qty: number; sales: number }>>();
  const monthByCenter = new Map<string, Map<Center, number>>();
  for (const it of approvedItems) {
    const inv = invoiceByName.get(it.parent);
    if (!inv) continue;
    const c = itemCenter(it);
    if (!c) continue;
    const revenue = itemRevenue(it);
    const qty = Number(it.qty ?? 0);
    if (inv.posting_date >= monthStart) {
      mtdByCenter.set(c, (mtdByCenter.get(c) ?? 0) + revenue);
      mtdQtyByCenter.set(c, (mtdQtyByCenter.get(c) ?? 0) + qty);
      if (!mtdInvoicesByCenter.has(c)) mtdInvoicesByCenter.set(c, new Set());
      mtdInvoicesByCenter.get(c)!.add(it.parent);
      if (!mtdItemsByCenter.has(c)) mtdItemsByCenter.set(c, new Map());
      const byItem = mtdItemsByCenter.get(c)!;
      const key = it.item_code;
      const cur = byItem.get(key) ?? { item: it.item_name ?? it.item_code, qty: 0, sales: 0 };
      cur.qty += qty;
      cur.sales += revenue;
      byItem.set(key, cur);
    }
    if (inv.posting_date >= prevMonthStart && inv.posting_date < monthStart) {
      lastMonthByCenter.set(c, (lastMonthByCenter.get(c) ?? 0) + revenue);
    }
    const monthKey = inv.posting_date.slice(0, 7);
    if (!monthByCenter.has(monthKey)) monthByCenter.set(monthKey, new Map());
    const m = monthByCenter.get(monthKey)!;
    m.set(c, (m.get(c) ?? 0) + revenue);
  }

  const partnerSalesByRegion = CENTERS.map((center) => ({
    region: center,
    sales: +(((mtdByCenter.get(center) ?? 0) / 1_000_000).toFixed(2)),
  })).sort((a, b) => b.sales - a.sales);

  const centerSales: CenterSales[] = CENTERS.map((center) => {
    const mtd = mtdByCenter.get(center) ?? 0;
    const lm = lastMonthByCenter.get(center) ?? 0;
    let high = 0;
    let highMonth = "";
    for (const [monthKey, perC] of monthByCenter) {
      const v = perC.get(center) ?? 0;
      if (v > high) {
        high = v;
        highMonth = monthKey;
      }
    }
    const deltaPct = lm > 0 ? +(((mtd - lm) / lm) * 100).toFixed(1) : mtd > 0 ? 100 : 0;
    let rec = "Maintain current performance and watch stock cover.";
    if (mtd < lm * 0.8) rec = `Sales dropped ${Math.abs(deltaPct)}% vs last month — reinforce field reps and run a 7-day promo.`;
    else if (mtd > lm * 1.1) rec = `Strong growth (+${deltaPct}%) — secure additional stock cover and onboard 2-3 new partners.`;
    else if (mtd < high * 0.6) rec = `Currently at ${Math.round((mtd / Math.max(high, 1)) * 100)}% of 6-month high — push targeted campaign.`;
    return {
      center,
      mtd,
      lastMonth: lm,
      deltaPct,
      sixMonthHigh: high,
      sixMonthHighMonth: highMonth,
      soldQtyMtd: +(mtdQtyByCenter.get(center) ?? 0).toFixed(2),
      approvedInvoiceCountMtd: mtdInvoicesByCenter.get(center)?.size ?? 0,
      topItemsMtd: [...(mtdItemsByCenter.get(center)?.entries() ?? [])]
        .map(([itemCode, v]) => ({ itemCode, item: v.item, qty: +v.qty.toFixed(2), sales: +v.sales.toFixed(0) }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      recommendation: rec,
    };
  });

  // ---------- Inventory grouped by center ----------
  const stockByCenter = new Map<Center, StockRow[]>();
  for (const r of stock) {
    const c = centerFor(typeof r.warehouse === "string" ? r.warehouse : null);
    if (!c) continue;
    if (!stockByCenter.has(c)) stockByCenter.set(c, []);
    stockByCenter.get(c)!.push(r);
  }

  function buildCenterInventory(rows: StockRow[]): { out: any[]; low: any[]; ok: any[] } {
    const out: any[] = [];
    const low: any[] = [];
    const ok: any[] = [];
    for (const r of rows) {
      const qty = Number(r.bal_qty ?? 0);
      const item = {
        sku: String(r.item_code),
        product: String(r.item_name ?? r.item_code),
        qty,
      };
      if (qty <= 0) out.push(item);
      else if (qty < 10) low.push(item);
      else ok.push(item);
    }
    return { out, low, ok };
  }

  const inventoryFullByCenter: CenterInventory[] = CENTERS.map((center) => {
    const rows = stockByCenter.get(center) ?? [];
    const { out, low, ok } = buildCenterInventory(rows);
    return { center, out, low, ok };
  });

  // Top-10 view per center for overview (out → low → ok, trimmed)
  const inventoryTop10ByCenter: CenterInventory[] = inventoryFullByCenter.map((ci) => {
    const combined = [...ci.out, ...ci.low, ...ci.ok].slice(0, 10);
    const out = combined.filter((i) => i.qty <= 0);
    const low = combined.filter((i) => i.qty > 0 && i.qty < 10);
    const ok = combined.filter((i) => i.qty >= 10);
    return { center: ci.center, out, low, ok };
  });

  const outOfStockByCenter = CENTERS.map((center) => {
    const rows = stockByCenter.get(center) ?? [];
    const count = rows.filter((r) => Number(r.bal_qty ?? 0) <= 0).length;
    return { center, count };
  });

  // ---------- Product forecast (90d) ----------
  const itemAgg = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of approvedItems) {
    const inv = invoiceByName.get(it.parent);
    if (!inv || inv.posting_date < thirtyDaysAgo) continue;
    const cur = itemAgg.get(it.item_code) ?? { name: it.item_name ?? it.item_code, qty: 0, revenue: 0 };
    cur.qty += Number(it.qty ?? 0);
    cur.revenue += itemRevenue(it);
    itemAgg.set(it.item_code, cur);
  }
  const productForecast: ProductForecast[] = [...itemAgg.entries()]
    .map(([code, v]) => ({
      itemCode: code,
      item: v.name,
      last30dQty: +v.qty.toFixed(2),
      last30dRevenue: +v.revenue.toFixed(0),
      projected90dQty: +(v.qty * 3).toFixed(2),
      projected90dRevenue: +(v.revenue * 3).toFixed(0),
    }))
    .sort((a, b) => b.projected90dRevenue - a.projected90dRevenue)
    .slice(0, 20);

  // Per-center 90-day projection (× 3 of last 30 days at item warehouse)
  const centerLast30Revenue = new Map<Center, number>();
  for (const it of approvedItems) {
    const inv = invoiceByName.get(it.parent);
    if (!inv || inv.posting_date < thirtyDaysAgo) continue;
    const c = itemCenter(it);
    if (!c) continue;
    centerLast30Revenue.set(c, (centerLast30Revenue.get(c) ?? 0) + itemRevenue(it));
  }
  const centerForecast = CENTERS.map((center) => ({
    center,
    projected90dRevenue: (centerLast30Revenue.get(center) ?? 0) * 3,
  }));

  // ---------- Receivables / advances by center ----------
  const recByCenter = new Map<Center, number>();
  for (const inv of invoices) {
    const c = centerFor(inv.set_warehouse, inv.territory);
    if (!c) continue;
    recByCenter.set(c, (recByCenter.get(c) ?? 0) + (inv.outstanding_amount ?? 0));
  }
  // Advances: use payments unallocated_amount, attribute to customer's most-frequent center
  const custCenter = new Map<string, Center | null>();
  for (const inv of invoices) {
    if (custCenter.has(inv.customer)) continue;
    custCenter.set(inv.customer, centerFor(inv.set_warehouse, inv.territory));
  }
  const advByCenter = new Map<Center, number>();
  for (const p of payments) {
    const c = custCenter.get(p.party) ?? null;
    if (!c) continue;
    advByCenter.set(c, (advByCenter.get(c) ?? 0) + (p.unallocated_amount ?? 0));
  }
  const receivablesByCenter: CenterReceivable[] = CENTERS.map((center) => ({
    center,
    outstanding: recByCenter.get(center) ?? 0,
    advances: advByCenter.get(center) ?? 0,
  }));

  // ---------- Map: center sales intensity + exact customer locations ----------
  const centerMapAgg = new Map<Center, { sales: number; customers: Set<string>; newPartners: number }>();
  const customerMapAgg = new Map<string, { sales: number; center: Center | null; lastPurchase: string }>();
  for (const it of approvedItems) {
    const inv = invoiceByName.get(it.parent);
    if (!inv) continue;
    const c = itemCenter(it);
    if (!c) continue;
    const sales = itemRevenue(it);
    if (inv.posting_date >= monthStart) {
      if (!centerMapAgg.has(c)) centerMapAgg.set(c, { sales: 0, customers: new Set(), newPartners: 0 });
      const e = centerMapAgg.get(c)!;
      e.sales += sales;
      e.customers.add(inv.customer);
      const cur = customerMapAgg.get(inv.customer) ?? { sales: 0, center: c, lastPurchase: inv.posting_date };
      cur.sales += sales;
      cur.center = c;
      if (inv.posting_date > cur.lastPurchase) cur.lastPurchase = inv.posting_date;
      customerMapAgg.set(inv.customer, cur);
    }
  }
  for (const [cust, fdate] of firstSeen) {
    if (fdate < thirtyDaysAgo) continue;
    const c = customerMapAgg.get(cust)?.center ?? centerFor(null, customerRegion.get(cust));
    if (!c) continue;
    if (!centerMapAgg.has(c)) centerMapAgg.set(c, { sales: 0, customers: new Set(), newPartners: 0 });
    centerMapAgg.get(c)!.newPartners++;
  }
  const centerPoints: RegionMapPoint[] = CENTERS.map((center) => {
    const co = coordsFor(center)!;
    const v = centerMapAgg.get(center) ?? { sales: 0, customers: new Set<string>(), newPartners: 0 };
    return { id: `center-${center}`, type: "center", region: `${center} Distribution Center`, center, lat: co.lat, lng: co.lng, sales: v.sales, customers: v.customers.size, newPartners: v.newPartners };
  });
  const customerPoints = customers.reduce<RegionMapPoint[]>((acc, c) => {
      const co = customerCoords.get(c.name);
      const purchase = customerMapAgg.get(c.name);
      const isNew = (firstSeen.get(c.name) ?? "") >= thirtyDaysAgo;
      if (!co || (!purchase && !isNew)) return acc;
      const center = purchase?.center ?? centerFor(null, customerRegion.get(c.name));
      acc.push({
        id: `customer-${c.name}`,
        type: "customer",
        region: c.territory ?? center ?? "Customer location",
        center: center ?? undefined,
        customer: c.name,
        customerName: customerName.get(c.name) ?? c.customer_name ?? c.name,
        address: customerAddressLabel.get(c.name) ?? c.customer_primary_address ?? undefined,
        registeredAt: firstSeen.get(c.name) ?? c.creation?.slice(0, 10),
        lastPurchase: purchase?.lastPurchase ?? lastSeen.get(c.name),
        lat: co.lat,
        lng: co.lng,
        sales: purchase?.sales ?? 0,
        customers: 1,
        newPartners: isNew ? 1 : 0,
      });
      return acc;
    }, []);
  const regionMapPoints = [...centerPoints, ...customerPoints];

  // ---------- Red alerts derived from inventory ----------
  const redAlertsByCenter = CENTERS.map((center) => {
    const inv = inventoryFullByCenter.find((i) => i.center === center)!;
    const alerts: { title: string; severity: "critical" | "warning" }[] = [];
    for (const o of inv.out.slice(0, 5)) {
      alerts.push({ title: `${o.product} (${o.sku}) — OUT OF STOCK`, severity: "critical" });
    }
    for (const l of inv.low.slice(0, 5)) {
      alerts.push({ title: `${l.product} (${l.sku}) — low (${l.qty} left)`, severity: "warning" });
    }
    const sales = centerSales.find((s) => s.center === center)!;
    if (sales.deltaPct < -25) {
      alerts.push({ title: `Sales down ${Math.abs(sales.deltaPct)}% vs last month`, severity: "critical" });
    }
    return { center, alerts };
  });

  // ---------- AI executive summary ----------
  const monthGoalNaira = 250_000_000 / 3; // ~₦83.3M / month for June-Aug target
  const goalPct = monthGoalNaira > 0 ? (mtdRevenue / monthGoalNaira) * 100 : 0;
  const mtdVsLm =
    lastMonthRevenue > 0
      ? (((mtdRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : "—";
  const topCenter = [...centerSales].sort((a, b) => b.mtd - a.mtd)[0];
  const weakCenter = [...centerSales].sort((a, b) => a.mtd - b.mtd)[0];
  const outCount = inventoryFullByCenter.reduce((s, c) => s + c.out.length, 0);
  const aiSummary =
    `Today: ₦${(totalSalesToday / 1_000_000).toFixed(2)}M from ${todayInvoices.length} approved invoices. ` +
    `Month-to-date: ₦${(mtdRevenue / 1_000_000).toFixed(2)}M vs last month ₦${(lastMonthRevenue / 1_000_000).toFixed(2)}M (${mtdVsLm}%). ` +
    `Against the 3-month ₦250M target you are at ${goalPct.toFixed(1)}% of this month's ₦${(monthGoalNaira / 1_000_000).toFixed(1)}M share. ` +
    `Top performer: ${topCenter?.center} (₦${(topCenter?.mtd / 1_000_000).toFixed(2)}M). ` +
    `Weakest: ${weakCenter?.center} (₦${(weakCenter?.mtd / 1_000_000).toFixed(2)}M). ` +
    `${outCount} SKUs are at zero stock across the network. ` +
    `Recommendation: rebalance stock from Lagos/Abuja DCs to ${weakCenter?.center}, push a closed-loop promo to the top 10 customers to lift repeat orders, ` +
    `and have field reps activate ${newCustomersThisWeek} fresh partner leads this week. Hitting ₦250M by August requires +${Math.max(0, ((monthGoalNaira - mtdRevenue) / 1_000_000)).toFixed(1)}M more this month.`;

  return {
    ok: true,
    fetchedAt: new Date().toISOString(),
    totalSalesToday,
    invoiceCountToday: todayInvoices.length,
    totalRevenueAllTime,
    totalInvoicesAllTime: invoices.length,
    outstandingTotal,
    advancesTotal,
    mtdRevenue,
    lastMonthRevenue,
    monthGoalNaira,
    newCustomersThisWeek,
    newCustomers30d,
    returningCustomers,
    customerActivityWeekly,
    top10Customers,
    partnerSalesByRegion,
    centerSales,
    inventoryTop10ByCenter,
    inventoryFullByCenter,
    outOfStockByCenter,
    productForecast,
    centerForecast,
    receivablesByCenter,
    regionMapPoints,
    redAlertsByCenter,
    aiSummary,
  };
}

export const getErpOverview = createServerFn({ method: "GET" }).handler(async (): Promise<ErpOverview> => {
  try {
    const [invoices, items, stock, customers, payments] = await Promise.all([
      fetchRecentSalesInvoices(0),
      fetchSalesInvoiceItems(0).catch(() => [] as InvoiceItem[]),
      fetchStockBalance().catch(() => [] as StockRow[]),
      fetchCustomers(0).catch(() => [] as CustomerRow[]),
      fetchPaymentEntries(0).catch(() => [] as PaymentEntry[]),
    ]);
    return summarise(invoices, items, stock, customers, payments);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
