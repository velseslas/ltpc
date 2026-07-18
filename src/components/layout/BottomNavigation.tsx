import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FlaskConical, Truck, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/hooks/usePermissionContext";

interface BottomNavigationProps {
  onMenuClick: () => void;
}

/**
 * Bottom navigation for mobile.
 * Shown only on screens < md. Provides 4 primary shortcuts + menu drawer trigger.
 * Item visibility follows the same permission rules as the sidebar.
 */
export function BottomNavigation({ onMenuClick }: BottomNavigationProps) {
  const location = useLocation();
  const { hasPermission, isTechnicien } = usePermissionContext();

  const items = [
    { title: "Accueil", path: "/", icon: LayoutDashboard, visible: true },
    { title: "Essais", path: "/essais", icon: FlaskConical, visible: hasPermission("essais.voir") },
    {
      title: "Chantier",
      path: "/laboratoires-mobiles",
      icon: Truck,
      visible: hasPermission("laboratoires_mobiles.voir"),
    },
  ].filter((i) => i.visible);

  // Technicien: prioritize Essais and Labo Chantier only
  const visible = isTechnicien
    ? items.filter((i) => i.path !== "/")
    : items;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border pb-safe"
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch justify-around">
        {visible.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 touch-target transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Ouvrir le menu"
            className="flex flex-col items-center justify-center gap-0.5 py-2 w-full touch-target text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
