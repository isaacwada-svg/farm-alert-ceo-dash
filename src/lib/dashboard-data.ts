// Mock data for the Farm Alert CEO dashboard
export const today = new Date();

export const kpis = {
  totalSalesToday: { value: 18_420_500, currency: "₦", delta: 12.4 },
  outOfStockCount: 7,
  activeReturningCustomers: { value: 1284, delta: 4.2 },
  newCustomers: { value: 92, delta: 18.7 },
};

export type AlertLevel = "critical" | "warning" | "active" | "calm";

// Geographic coordinates (lat, lng) for real map rendering.
// `x`/`y` retained for any legacy consumers but no longer used by the map.
export const regions: {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  level: AlertLevel;
  partners: number;
  sales: number;
}[] = [
  { id: "abuja", name: "Abuja DC", country: "Nigeria", lat: 9.0765, lng: 7.3986, x: 628, y: 322, level: "active", partners: 42, sales: 4_120_000 },
  { id: "lagos", name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, x: 588, y: 360, level: "active", partners: 68, sales: 6_840_000 },
  { id: "kano", name: "Kano", country: "Nigeria", lat: 12.0022, lng: 8.5919, x: 638, y: 278, level: "warning", partners: 31, sales: 2_410_000 },
  { id: "ibadan", name: "Ibadan", country: "Nigeria", lat: 7.3775, lng: 3.9470, x: 598, y: 352, level: "active", partners: 24, sales: 1_980_000 },
  { id: "adamawa", name: "Adamawa", country: "Nigeria", lat: 9.3265, lng: 12.3984, x: 690, y: 328, level: "critical", partners: 14, sales: 720_000 },
  { id: "ph", name: "Port Harcourt", country: "Nigeria", lat: 4.8156, lng: 7.0498, x: 622, y: 378, level: "active", partners: 27, sales: 2_100_000 },
  { id: "taraba", name: "Taraba", country: "Nigeria", lat: 8.8937, lng: 11.3604, x: 676, y: 338, level: "warning", partners: 11, sales: 540_000 },
  { id: "liberia", name: "Monrovia", country: "Liberia", lat: 6.3004, lng: -10.7969, x: 452, y: 368, level: "active", partners: 9, sales: 480_000 },
  { id: "ghana", name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870, x: 558, y: 372, level: "calm", partners: 6, sales: 220_000 },
  { id: "cameroon", name: "Douala", country: "Cameroon", lat: 4.0511, lng: 9.7679, x: 660, y: 398, level: "warning", partners: 8, sales: 360_000 },
  { id: "sierra", name: "Freetown", country: "Sierra Leone", lat: 8.4657, lng: -13.2317, x: 436, y: 342, level: "calm", partners: 4, sales: 140_000 },
  { id: "niger", name: "Niamey", country: "Niger", lat: 13.5117, lng: 2.1251, x: 580, y: 278, level: "calm", partners: 5, sales: 180_000 },
];

export const partnerSalesByRegion = [
  { region: "Lagos", sales: 6.84 },
  { region: "Abuja", sales: 4.12 },
  { region: "Kano", sales: 2.41 },
  { region: "Port Harcourt", sales: 2.1 },
  { region: "Ibadan", sales: 1.98 },
  { region: "Adamawa", sales: 0.72 },
  { region: "Taraba", sales: 0.54 },
  { region: "Liberia", sales: 0.48 },
];

export type StockStatus = "out" | "low" | "ok";
export const inventory: {
  sku: string;
  product: string;
  center: string;
  qty: number;
  status: StockStatus;
}[] = [
  { sku: "FA-1024", product: "Newcastle Vaccine (500 doses)", center: "Adamawa", qty: 0, status: "out" },
  { sku: "FA-2210", product: "Ivermectin Pour-on 1L", center: "Taraba", qty: 0, status: "out" },
  { sku: "FA-3081", product: "Coccidiostat Premix 25kg", center: "Kano", qty: 4, status: "low" },
  { sku: "FA-1187", product: "Multivitamin Injection", center: "Abuja", qty: 18, status: "low" },
  { sku: "FA-4502", product: "Broiler Starter Feed 50kg", center: "Lagos", qty: 240, status: "ok" },
  { sku: "FA-5610", product: "Tetracycline 100g", center: "Ibadan", qty: 92, status: "ok" },
  { sku: "FA-2901", product: "Tick & Flea Spray 500ml", center: "Port Harcourt", qty: 0, status: "out" },
  { sku: "FA-6701", product: "Calcium Borogluconate", center: "Liberia", qty: 6, status: "low" },
];

export const outOfStockByCenter = [
  { center: "Abuja", count: 0 },
  { center: "Lagos", count: 0 },
  { center: "Kano", count: 1 },
  { center: "Ibadan", count: 0 },
  { center: "Adamawa", count: 2 },
  { center: "Port Harcourt", count: 1 },
  { center: "Taraba", count: 2 },
  { center: "Liberia", count: 1 },
];

export const customerActivity = [
  { day: "Mon", new: 12, returning: 184 },
  { day: "Tue", new: 18, returning: 201 },
  { day: "Wed", new: 9, returning: 176 },
  { day: "Thu", new: 22, returning: 220 },
  { day: "Fri", new: 31, returning: 248 },
  { day: "Sat", new: 28, returning: 192 },
  { day: "Sun", new: 14, returning: 138 },
];

export const inventoryForecast = [
  { week: "W1", actual: 1200, forecast: 1180 },
  { week: "W2", actual: 1340, forecast: 1310 },
  { week: "W3", actual: 1280, forecast: 1295 },
  { week: "W4", actual: 1410, forecast: 1380 },
  { week: "W5", actual: null, forecast: 1460 },
  { week: "W6", actual: null, forecast: 1525 },
  { week: "W7", actual: null, forecast: 1590 },
];

export const redAlerts = [
  { id: 1, title: "Newcastle Vaccine — Adamawa DC at zero", time: "12 min ago", severity: "critical" },
  { id: 2, title: "Suspected outbreak alert from 3 partners in Taraba", time: "48 min ago", severity: "critical" },
  { id: 3, title: "Tick & Flea Spray stockout — Port Harcourt", time: "2 hr ago", severity: "warning" },
];

// Geo-mapped customers across Nigerian states (mock CRM rollup)
export type CustomerPoint = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  type: "new" | "returning";
  orders: number;
};

export const customerPoints: CustomerPoint[] = [
  { id: "c1", name: "GreenPastures Farms", state: "Lagos", lat: 6.6018, lng: 3.3515, type: "returning", orders: 14 },
  { id: "c2", name: "Sahel AgroVet", state: "Kano", lat: 11.9965, lng: 8.5276, type: "returning", orders: 9 },
  { id: "c3", name: "Riverline Poultry", state: "Rivers", lat: 4.8472, lng: 6.9745, type: "new", orders: 2 },
  { id: "c4", name: "Plateau Livestock Co.", state: "Plateau", lat: 9.8965, lng: 8.8583, type: "returning", orders: 7 },
  { id: "c5", name: "Kaduna AgriHub", state: "Kaduna", lat: 10.5222, lng: 7.4383, type: "new", orders: 1 },
  { id: "c6", name: "Enugu Vet Clinic", state: "Enugu", lat: 6.5244, lng: 7.5186, type: "returning", orders: 11 },
  { id: "c7", name: "Cross River Farms", state: "Cross River", lat: 4.9589, lng: 8.3269, type: "returning", orders: 6 },
  { id: "c8", name: "Borno Pastoralists", state: "Borno", lat: 11.8311, lng: 13.1510, type: "new", orders: 1 },
  { id: "c9", name: "Oyo Modern Farms", state: "Oyo", lat: 7.8526, lng: 3.9319, type: "returning", orders: 8 },
  { id: "c10", name: "Delta Agro Services", state: "Delta", lat: 5.8903, lng: 5.6804, type: "new", orders: 3 },
  { id: "c11", name: "Sokoto Cattle Union", state: "Sokoto", lat: 13.0059, lng: 5.2476, type: "returning", orders: 5 },
  { id: "c12", name: "Ekiti Layers Ltd", state: "Ekiti", lat: 7.6210, lng: 5.2210, type: "new", orders: 2 },
  { id: "c13", name: "Anambra AgriCare", state: "Anambra", lat: 6.2209, lng: 6.9370, type: "returning", orders: 9 },
  { id: "c14", name: "Bauchi Ranches", state: "Bauchi", lat: 10.3158, lng: 9.8442, type: "returning", orders: 4 },
  { id: "c15", name: "Ondo Broilers", state: "Ondo", lat: 7.2526, lng: 5.1931, type: "new", orders: 2 },
  { id: "c16", name: "Benue Grain & Vet", state: "Benue", lat: 7.7322, lng: 8.5391, type: "returning", orders: 6 },
];

export const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
