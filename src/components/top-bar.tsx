import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  const [today, setToday] = useState("—");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="text-foreground" />

      <div className="hidden flex-col md:flex">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</span>
        <span className="text-sm font-medium text-foreground">{today}</span>
      </div>

      <div className="relative ml-auto hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search partners, SKUs, regions…"
          className="h-9 pl-9 bg-background"
        />
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          3
        </span>
      </Button>

      <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-destructive">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-xs font-semibold">3 Red Alerts</span>
      </div>
    </header>
  );
}
