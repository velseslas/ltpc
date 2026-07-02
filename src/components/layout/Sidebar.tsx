import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FlaskConical,
  Truck,
  Microscope,
  Receipt,
  FileText,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import { useCurrentUserChantiers } from "@/hooks/useCurrentUserChantiers";

const menuItems = [
  { title: "Tableau de bord", path: "/", icon: LayoutDashboard, permission: "dashboard.voir" },
  { title: "LTPC AI", path: "/ltpc-ai", icon: Sparkles },
  { title: "Intervenant", path: "/intervenant", icon: Users, permission: "intervenants.voir" },
  { title: "RH", path: "/rh", icon: UserCog, permission: "rh.voir" },
  { title: "Essais", path: "/essais", icon: FlaskConical, permission: "essais.voir" },
  { title: "Laboratoires Chantier", path: "/laboratoires-mobiles", icon: Truck, permission: "laboratoires_mobiles.voir" },
  { title: "Matériel Laboratoire", path: "/materiel", icon: Microscope, permission: "materiel.voir" },
  { title: "Facturation", path: "/facturation", icon: Receipt, permission: "facturation.voir" },
  { title: "Documents", path: "/documents", icon: FileText, permission: "documents.voir" },
  { title: "Paramètres", path: "/parametres", icon: Settings, permission: "parametres.voir" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { hasPermission, role, isTechnicien } = usePermissionContext();
  const { data: userChantiers } = useCurrentUserChantiers();

  const visibleItems = menuItems.filter((item) => {
    // Items sans permission (ex. LTPC AI) toujours visibles
    if (!item.permission) return true;
    // Dashboard always visible
    if (item.permission === "dashboard.voir") return true;
    
    // Techniciens: only show Essais + Laboratoires Chantier (if assigned)
    if (isTechnicien) {
      if (item.permission === "essais.voir") return hasPermission(item.permission);
      if (item.permission === "laboratoires_mobiles.voir") {
        return hasPermission(item.permission) && (userChantiers?.chantierIds?.length ?? 0) > 0;
      }
      return false;
    }
    
    // Check permission
    return hasPermission(item.permission);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}
    >

      {/* Navigation */}
      <nav className="flex-1 mt-10 px-2 overflow-y-auto">
        <ul className="space-y-1.5">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary box-glow"
                      : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors flex-shrink-0",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="absolute bottom-6 -right-3 p-1.5 rounded-full bg-card border border-border hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-200 shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
