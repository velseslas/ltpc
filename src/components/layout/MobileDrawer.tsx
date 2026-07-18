import { NavLink, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useVisibleMenuItems } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useEntreprise } from "@/hooks/useEntreprise";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();
  const visibleItems = useVisibleMenuItems();
  const { data: entreprise } = useEntreprise();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const userName = user?.user_metadata?.prenom && user?.user_metadata?.nom
    ? `${user.user_metadata.prenom} ${user.user_metadata.nom}`
    : user?.email?.split("@")[0] || "Utilisateur";

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-xs p-0 bg-sidebar border-sidebar-border safe-area-top safe-area-bottom flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle asChild>
            <div className="flex items-center gap-2">
              {entreprise?.logo_url ? (
                <img src={entreprise.logo_url} alt={entreprise.nom || "Logo"} className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="font-display font-bold text-sm tracking-wider text-left truncate">
                {entreprise?.nom || "ENTREPRISE"}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all touch-target",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="px-2 py-2 mb-2">
            <p className="text-xs font-medium text-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors touch-target"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
