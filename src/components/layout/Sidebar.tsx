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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import { useCurrentUserChantiers } from "@/hooks/useCurrentUserChantiers";

export const menuItems = [
  { title: "Tableau de bord", path: "/", icon: LayoutDashboard, permission: "dashboard.voir" },
  { title: "LTPC AI", path: "/ltpc-ai", icon: Sparkles },
  { title: "Messagerie", path: "/messagerie", icon: MessageSquare },
  { title: "Intervenant", path: "/intervenant", icon: Users, permission: "intervenants.voir" },
  { title: "RH", path: "/rh", icon: UserCog, permission: "rh.voir" },
  { title: "Essais", path: "/essais", icon: FlaskConical, permission: "essais.voir" },
  { title: "Laboratoires Mobiles", path: "/laboratoires-mobiles", icon: Truck, permission: "laboratoires_mobiles.voir" },
  { title: "Matériel Laboratoire", path: "/materiel", icon: Microscope, permission: "materiel.voir" },
  { title: "Facturation", path: "/facturation", icon: Receipt, permission: "facturation.voir" },
  { title: "Documents", path: "/documents", icon: FileText, permission: "documents.voir" },
  { title: "Paramètres", path: "/parametres", icon: Settings, permission: "parametres.voir" },
];

export function useVisibleMenuItems() {
  const { hasPermission, isTechnicien } = usePermissionContext();
  const { data: userChantiers } = useCurrentUserChantiers();
  return menuItems.filter((item) => {
    if (!item.permission) return true;
    if (item.permission === "dashboard.voir") return true;
    if (isTechnicien) {
      if (item.permission === "essais.voir") return hasPermission(item.permission);
      if (item.permission === "laboratoires_mobiles.voir") {
        return hasPermission(item.permission) && (userChantiers?.chantierIds?.length ?? 0) > 0;
      }
      return false;
    }
    return hasPermission(item.permission);
  });
}


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const visibleItems = useVisibleMenuItems();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col hidden md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >


      {/* Navigation */}
      <nav className="flex-1 mt-10 px-2 overflow-y-auto">
        <ul className="space-y-1.5">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badge = item.path === "/messagerie" ? unreadMessages : 0;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
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
                    <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                  )}
                  {badge > 0 && (
                    <span
                      className={cn(
                        "bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-5 h-5 px-1.5 grid place-items-center",
                        collapsed && "absolute top-1 right-1 min-w-4 h-4 px-1"
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

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
