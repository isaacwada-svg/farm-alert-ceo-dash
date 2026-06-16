// Server-only Frappe/ERPNext client for Farm Alert ERP.
// Auth: Frappe uses `Authorization: token <api_key>:<api_secret>`.

function getEnv() {
  let baseUrl = process.env.FARMALERT_ERP_BASE_URL?.trim();
  const rawKey = process.env.FARMALERT_ERP_API_KEY?.trim();
  const rawSecret = process.env.FARMALERT_ERP_API_SECRET?.trim();
  if (!baseUrl || !rawKey) {
    throw new Error("FARMALERT_ERP_* env vars are not configured");
  }
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  try {
    const u = new URL(baseUrl);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch {
    baseUrl = baseUrl.replace(/\/+$/, "");
  }

  const [embeddedKey, embeddedSecret] = rawKey.includes(":") ? rawKey.split(":") : [rawKey, rawSecret];
  if (!embeddedKey || !embeddedSecret) {
    throw new Error("FARMALERT_ERP_API_KEY and FARMALERT_ERP_API_SECRET are not configured correctly");
  }
  return { baseUrl, token: `${embeddedKey}:${embeddedSecret}` };
}

async function erpFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, token } = getEnv();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    redirect: "manual",
    headers: {
      "Authorization": `token ${token}`,
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
  customer_name?: string;
  posting_date: string;
  grand_total: number;
  net_total?: number;
  rounded_total?: number;
  status: string;
  docstatus?: number;
  outstanding_amount: number;
  title?: string;
  set_warehouse?: string | null;
  territory?: string | null;
};

export async function fetchRecentSalesInvoices(limit = 0): Promise<SalesInvoice[]> {
  const fields = JSON.stringify([
    "name", "customer", "customer_name", "posting_date", "grand_total", "net_total", "rounded_total",
    "status", "docstatus", "outstanding_amount", "title", "set_warehouse", "territory",
  ]);
  const filters = JSON.stringify([
    ["docstatus", "=", 1],
    ["status", "not in", ["Cancelled", "Draft"]],
  ]);
  const params = new URLSearchParams({
    fields,
    filters,
    order_by: "posting_date desc, name desc",
    limit_page_length: String(limit),
  });
  const data = await erpFetch(`/api/resource/Sales Invoice?${params.toString()}`);
  return (data?.data ?? []) as SalesInvoice[];
}

export type InvoiceItem = {
  parent: string;
  item_code: string;
  item_name?: string;
  qty: number;
  amount: number;
  net_amount?: number;
  warehouse?: string | null;
};

export async function fetchSalesInvoiceItems(limit = 0): Promise<InvoiceItem[]> {
  const fields = JSON.stringify(["parent", "item_code", "item_name", "qty", "amount", "net_amount", "warehouse"]);
  const params = new URLSearchParams({
    fields,
    limit_page_length: String(limit),
    order_by: "creation desc",
  });
  const data = await erpFetch(`/api/resource/Sales Invoice Item?${params.toString()}`);
  return (data?.data ?? []) as InvoiceItem[];
}

export type StockRow = {
  item_code: string;
  item_name?: string;
  warehouse?: string;
  bal_qty?: number;
  [k: string]: unknown;
};

export async function fetchStockBalance(company = "FarmAlert"): Promise<StockRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const body = {
    report_name: "Stock Balance",
    filters: {
      from_date: monthAgo,
      to_date: today,
      company,
      valuation_field_type: "Currency",
    },
  };
  const data = await erpFetch("/api/method/frappe.desk.query_report.run", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const result = data?.message?.result ?? [];
  return result.filter(
    (r: unknown): r is StockRow =>
      typeof r === "object" && r !== null && typeof (r as StockRow).item_code === "string",
  );
}

export type CustomerRow = {
  name: string;
  customer_name?: string;
  territory?: string;
  creation?: string;
  customer_primary_address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  custom_latitude?: number | string | null;
  custom_longitude?: number | string | null;
  custom_lat?: number | string | null;
  custom_lng?: number | string | null;
  custom_geolocation?: string | null;
  linkedCustomer?: string;
};

export type AddressLinkRow = { parent: string; link_name: string };

export async function fetchCustomerAddressLinks(customerNames: string[]): Promise<AddressLinkRow[]> {
  const clean = [...new Set(customerNames.filter(Boolean))].slice(0, 2000);
  if (clean.length === 0) return [];
  const fields = JSON.stringify(["parent", "link_name"]);
  const filters = JSON.stringify([
    ["parenttype", "=", "Address"],
    ["link_doctype", "=", "Customer"],
    ["link_name", "in", clean],
  ]);
  const params = new URLSearchParams({ fields, filters, limit_page_length: String(clean.length * 2) });
  const data = await erpFetch(`/api/resource/Dynamic Link?${params.toString()}`);
  return (data?.data ?? []) as AddressLinkRow[];
}

export type AddressRow = {
  name: string;
  address_title?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  custom_latitude?: number | string | null;
  custom_longitude?: number | string | null;
  custom_lat?: number | string | null;
  custom_lng?: number | string | null;
  custom_geolocation?: string | null;
};

export async function fetchCustomers(limit = 0): Promise<CustomerRow[]> {
  const fields = JSON.stringify([
    "name", "customer_name", "territory", "creation", "customer_primary_address",
    "latitude", "longitude", "custom_latitude", "custom_longitude", "custom_lat", "custom_lng", "custom_geolocation",
  ]);
  const params = new URLSearchParams({
    fields,
    limit_page_length: String(limit),
    order_by: "creation desc",
  });
  try {
    const data = await erpFetch(`/api/resource/Customer?${params.toString()}`);
    return (data?.data ?? []) as CustomerRow[];
  } catch {
    const fallbackFields = JSON.stringify(["name", "customer_name", "territory", "creation", "customer_primary_address"]);
    const fallbackParams = new URLSearchParams({ fields: fallbackFields, limit_page_length: String(limit), order_by: "creation desc" });
    const data = await erpFetch(`/api/resource/Customer?${fallbackParams.toString()}`);
    return (data?.data ?? []) as CustomerRow[];
  }
}

export async function fetchCustomerAddresses(names: string[]): Promise<AddressRow[]> {
  const clean = [...new Set(names.filter(Boolean))].slice(0, 1000);
  if (clean.length === 0) return [];
  const fields = JSON.stringify([
    "name", "address_title", "city", "state", "country",
    "latitude", "longitude", "custom_latitude", "custom_longitude", "custom_lat", "custom_lng", "custom_geolocation",
  ]);
  const filters = JSON.stringify([["name", "in", clean]]);
  const params = new URLSearchParams({ fields, filters, limit_page_length: String(clean.length) });
  try {
    const data = await erpFetch(`/api/resource/Address?${params.toString()}`);
    return (data?.data ?? []) as AddressRow[];
  } catch {
    const fallbackFields = JSON.stringify(["name", "address_title", "city", "state", "country"]);
    const fallbackParams = new URLSearchParams({ fields: fallbackFields, filters, limit_page_length: String(clean.length) });
    const data = await erpFetch(`/api/resource/Address?${fallbackParams.toString()}`);
    return (data?.data ?? []) as AddressRow[];
  }
}

export type PaymentEntry = {
  name: string;
  party: string;
  party_type: string;
  payment_type: string;
  paid_amount: number;
  unallocated_amount: number;
  posting_date: string;
};

export async function fetchPaymentEntries(limit = 0): Promise<PaymentEntry[]> {
  const fields = JSON.stringify([
    "name", "party", "party_type", "payment_type",
    "paid_amount", "unallocated_amount", "posting_date",
  ]);
  const filters = JSON.stringify([
    ["docstatus", "=", 1],
    ["payment_type", "=", "Receive"],
    ["party_type", "=", "Customer"],
  ]);
  const params = new URLSearchParams({
    fields,
    filters,
    limit_page_length: String(limit),
    order_by: "posting_date desc",
  });
  const data = await erpFetch(`/api/resource/Payment Entry?${params.toString()}`);
  return (data?.data ?? []) as PaymentEntry[];
}