import { ReactNode, useEffect, useState } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const MAINTENANCE_KEY = "app_maintenance_mode";

// Purge legacy persistent flag (ancienne version stockait dans localStorage,
// ce qui déclenchait le mode maintenance "tout seul" après un toggle accidentel).
try {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(MAINTENANCE_KEY);
  }
} catch {
  /* noop */
}

export function isMaintenanceActive(): boolean {
  try {
    return sessionStorage.getItem(MAINTENANCE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setMaintenanceMode(active: boolean) {
  try {
    if (active) sessionStorage.setItem(MAINTENANCE_KEY, "on");
    else sessionStorage.removeItem(MAINTENANCE_KEY);
    // Notify same-tab listeners
    window.dispatchEvent(new Event("maintenance-mode-change"));
  } catch {
    /* noop */
  }
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(() => isMaintenanceActive());

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const refresh = () => setActive(isMaintenanceActive());
    window.addEventListener("storage", refresh);
    window.addEventListener("maintenance-mode-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("maintenance-mode-change", refresh);
    };
  }, []);

  if (!active || isAdmin) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Maintenance en cours</h1>
          <p className="text-muted-foreground text-sm">
            L'application est temporairement indisponible. Merci de réessayer dans quelques instants.
          </p>
        </div>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}
