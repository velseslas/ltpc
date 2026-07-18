import { LogOut, Building2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps = {}) {

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { data: entreprise } = useEntreprise();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté",
    });
  };

  const userInitials = user?.user_metadata?.prenom?.[0] && user?.user_metadata?.nom?.[0]
    ? `${user.user_metadata.prenom[0]}${user.user_metadata.nom[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.user_metadata?.prenom && user?.user_metadata?.nom
    ? `${user.user_metadata.prenom} ${user.user_metadata.nom}`
    : user?.email?.split("@")[0] || "Utilisateur";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-sidebar-border safe-area-top">
      <div className="flex items-center h-full px-4 gap-2">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={onMenuClick}
            className="md:hidden touch-target flex items-center justify-center rounded-lg hover:bg-secondary/50 text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Logo + entreprise name */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {entreprise?.logo_url ? (
            <img src={entreprise.logo_url} alt={entreprise.nom || "Logo"} className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5" />
          ) : (
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <span className="font-display font-bold text-xs tracking-wider hidden sm:inline">
            {(entreprise?.nom || "ENTREPRISE").split(" ").map((word, i) => (
              <span key={i} className={i % 2 === 0 ? "text-primary" : "text-foreground"}>
                {word}{" "}
              </span>
            ))}
          </span>
        </div>

        <div className="flex-1" />

        {/* Right section: notifications + user */}
        <div className="flex items-center gap-2">
          <NotificationBell collapsed={true} />

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              aria-label="Menu utilisateur"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer",
                userMenuOpen ? "bg-primary/10" : "bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs font-medium">{userInitials}</span>
              </div>
              <span className="hidden sm:inline text-xs font-medium text-foreground truncate max-w-[120px]">
                {userName}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
