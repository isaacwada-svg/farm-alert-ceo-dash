import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Boxes,
  Users,
  Siren,
  Settings as SettingsIcon,
} from "lucide-react";
import logoAsset from "@/assets/farm-alert-logo.jpg.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Africa Map", url: "/map", icon: Map },
  { title: "Sales", url: "/sales", icon: TrendingUp },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Red Alerts", url: "/alerts", icon: Siren },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-brand-navy">
            <img src={logoAsset.url} alt="Farm Alert" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Farm Alert</span>
            <span className="text-[11px] text-sidebar-foreground/60">Envisioning Animal Health</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:bg-brand-green data-[active=true]:text-brand-green-foreground data-[active=true]:font-medium"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.title === "Red Alerts" && (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            3
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            FK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-sidebar-foreground">Dr. Femi Kayode</span>
            <span className="text-[10px] text-sidebar-foreground/60">Chief Executive</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
