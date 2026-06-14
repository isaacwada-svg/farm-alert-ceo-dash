// Server-only Frappe/ERPNext client for Farm Alert ERP.
// Auth: Frappe uses `Authorization: token <api_key>:<api_secret>`.

function getEnv() {
  let baseUrl = process.env.FARMALERT_ERP_BASE_URL?.trim();
  const key = process.env.FARMALERT_ERP_API_KEY?.trim();
  const secret = process.env.FARMALERT_ERP_API_SECRET?.trim();
  if (!baseUrl || !key || !secret) {
    throw new Error("FARMALERT_ERP_* env vars are not configured");
  }
  // Normalise: ensure scheme, strip trailing slashes, drop any desk/app path
  // so we always hit /api/* from the site root.
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  try {
    const u = new URL(baseUrl);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch {
    baseUrl = baseUrl.replace(/\/+$/, "");
  }
  return { baseUrl, key, secret };
}

async function erpFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, key, secret } = getEnv();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    redirect: "manual",
    headers: {
      "Authorization": `token ${key}:${secret}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": "",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ERP ${res.status} ${res.statusText} at ${path}: ${text.slice(0, 300)}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `ERP ${path} returned ${ct || "no content-type"} (likely auth failure / wrong URL): ${text.slice(0, 200)}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`ERP ${path} returned non-JSON body: ${text.slice(0, 200)}`);
  }
}

export type SalesInvoice = {
  name: string;
  customer: string;
  posting_date: string;
  grand_total: number;
  status: string;
  outstanding_amount: number;
  title?: string;
  set_warehouse?: string | null;
  territory?: string | null;
};

export async function fetchRecentSalesInvoices(limit = 200): Promise<SalesInvoice[]> {
  const fields = JSON.stringify([
    "name",
    "customer",
    "posting_date",
    "grand_total",
    "status",
    "outstanding_amount",
    "title",
    "set_warehouse",
    "territory",
  ]);
  const params = new URLSearchParams({
    fields,
    order_by: "posting_date desc, name desc",
    limit_page_length: String(limit),
  });
  const data = await erpFetch(`/api/resource/Sales Invoice?${params.toString()}`);
  return (data?.data ?? []) as SalesInvoice[];
}

export type StockRow = {
  item_code: string;
  item_name?: string;
  warehouse?: string;
  bal_qty?: number;
  [k: string]: unknown;
};

export async function fetchStockBalance(): Promise<StockRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const body = {
    report_name: "Stock Balance",
    filters: { from_date: today, to_date: today, company: undefined },
  };
  const data = await erpFetch("/api/method/frappe.desk.query_report.run", {
    method: "POST",
    body: JSON.stringify(body),
  });
  // Frappe returns { message: { columns, result } }
  const result = data?.message?.result ?? [];
  // Some rows are totals/strings — keep only object rows with an item_code.
  return result.filter(
    (r: unknown): r is StockRow =>
      typeof r === "object" && r !== null && typeof (r as StockRow).item_code === "string",
  );
}
