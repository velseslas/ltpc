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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Tableau de bord", path: "/", icon: LayoutDashboard },
  { title: "Intervenant", path: "/intervenant", icon: Users },
  { title: "RH", path: "/rh", icon: UserCog },
  { title: "Essais", path: "/essais", icon: FlaskConical },
  { title: "Laboratoires Chantier", path: "/laboratoires-mobiles", icon: Truck },
  { title: "Matériel Laboratoire", path: "/materiel", icon: Microscope },
  { title: "Facturation", path: "/facturation", icon: Receipt },
  { title: "Documents", path: "/documents", icon: FileText },
  { title: "Paramètres", path: "/parametres", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

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
          {menuItems.map((item) => {
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
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
