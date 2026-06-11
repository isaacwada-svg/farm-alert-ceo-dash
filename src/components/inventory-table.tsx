import { inventory, type StockStatus } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const badge: Record<StockStatus, string> = {
  out: "bg-destructive/10 text-destructive border border-destructive/30",
  low: "bg-warn/15 text-warn border border-warn/30",
  ok: "bg-brand-green/15 text-brand-green border border-brand-green/30",
};

const label: Record<StockStatus, string> = {
  out: "Out of Stock",
  low: "Low",
  ok: "In Stock",
};

export function InventoryTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-[11px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-muted-foreground">
            <th>SKU</th>
            <th>Product</th>
            <th>Center</th>
            <th className="text-right">Qty</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((row) => (
            <tr key={row.sku} className="border-t border-border last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sku}</td>
              <td className="px-4 py-3 font-medium text-foreground">{row.product}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.center}</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">{row.qty}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", badge[row.status])}>
                  {label[row.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
