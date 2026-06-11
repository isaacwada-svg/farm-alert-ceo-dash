// Mock data for the Farm Alert CEO dashboard
export const today = new Date();

export const kpis = {
  totalSalesToday: { value: 18_420_500, currency: "₦", delta: 12.4 },
  outOfStockCount: 7,
  activeReturningCustomers: { value: 1284, delta: 4.2 },
  newCustomers: { value: 92, delta: 18.7 },
};

export type AlertLevel = "critical" | "warning" | "active" | "calm";

export const regions: {
  id: string;
  name: string;
  country: string;
  x: number; // SVG % within viewBox
  y: number;
  level: AlertLevel;
  partners: number;
  sales: number;
}[] = [
  { id: "abuja", name: "Abuja DC", country: "Nigeria", x: 540, y: 360, level: "active", partners: 42, sales: 4_120_000 },
  { id: "lagos", name: "Lagos", country: "Nigeria", x: 470, y: 430, level: "active", partners: 68, sales: 6_840_000 },
  { id: "kano", name: "Kano", country: "Nigeria", x: 555, y: 285, level: "warning", partners: 31, sales: 2_410_000 },
  { id: "ibadan", name: "Ibadan", country: "Nigeria", x: 485, y: 410, level: "active", partners: 24, sales: 1_980_000 },
  { id: "adamawa", name: "Adamawa", country: "Nigeria", x: 640, y: 335, level: "critical", partners: 14, sales: 720_000 },
  { id: "ph", name: "Port Harcourt", country: "Nigeria", x: 540, y: 470, level: "active", partners: 27, sales: 2_100_000 },
  { id: "taraba", name: "Taraba", country: "Nigeria", x: 620, y: 380, level: "warning", partners: 11, sales: 540_000 },
  { id: "liberia", name: "Monrovia", country: "Liberia", x: 285, y: 470, level: "active", partners: 9, sales: 480_000 },
  { id: "ghana", name: "Accra", country: "Ghana", x: 390, y: 470, level: "calm", partners: 6, sales: 220_000 },
  { id: "cameroon", name: "Douala", country: "Cameroon", x: 660, y: 460, level: "warning", partners: 8, sales: 360_000 },
  { id: "sierra", name: "Freetown", country: "Sierra Leone", x: 260, y: 430, level: "calm", partners: 4, sales: 140_000 },
  { id: "niger", name: "Niamey", country: "Niger", x: 470, y: 250, level: "calm", partners: 5, sales: 180_000 },
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

export const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
