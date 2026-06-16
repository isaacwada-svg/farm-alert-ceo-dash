import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
} from "recharts";
import {
  partnerSalesByRegion,
  customerActivity,
  inventoryForecast,
} from "@/lib/dashboard-data";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

export function PartnerSalesChart({ data }: { data?: { region: string; sales: number }[] }) {
  const rows = data ?? partnerSalesByRegion;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="region" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v}M`} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [`₦${v}M`, "Sales"]} />
        <Bar dataKey="sales" fill="var(--brand-green)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CustomerActivityChart({ data }: { data?: { week?: string; day?: string; new: number; returning: number }[] }) {
  const rows = data
    ? data.map((r) => ({ label: r.week ?? r.day ?? "", new: r.new, returning: r.returning }))
    : customerActivity.map((r) => ({ label: r.day, new: r.new, returning: r.returning }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Bar dataKey="returning" stackId="a" name="Returning" fill="var(--brand-navy)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="new" stackId="a" name="New" fill="var(--brand-green)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InventoryForecastChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={inventoryForecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-green)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--brand-green)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Area type="monotone" dataKey="forecast" name="Forecast" stroke="var(--brand-green)" strokeWidth={2} fill="url(#forecastFill)" />
        <Area type="monotone" dataKey="actual" name="Actual" stroke="var(--brand-navy)" strokeWidth={2.5} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
