// Server-only Frappe/ERPNext client for Farm Alert ERP.
// Auth: Frappe uses `Authorization: token <api_key>:<api_secret>`.

function getEnv() {
  const baseUrl = process.env.FARMALERT_ERP_BASE_URL?.replace(/\/+$/, "");
  const key = process.env.FARMALERT_ERP_API_KEY;
  const secret = process.env.FARMALERT_ERP_API_SECRET;
  if (!baseUrl || !key || !secret) {
    throw new Error("FARMALERT_ERP_* env vars are not configured");
  }
  return { baseUrl, key, secret };
}

async function erpFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, key, secret } = getEnv();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `token ${key}:${secret}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ERP ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return res.json();
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
