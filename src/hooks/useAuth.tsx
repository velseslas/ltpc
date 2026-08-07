import { useEffect, useState, createContext, useContext, ReactNode, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logConnexionStart, logConnexionEnd } from "@/lib/auth/connectionLog";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { nom?: string; prenom?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    const expiryMarginSeconds = 60;

    const shouldRefreshSession = (nextSession: Session | null) => {
      if (!nextSession?.expires_at) return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return nextSession.expires_at - nowSec < expiryMarginSeconds;
    };

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    const clearLocalSession = async () => {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    };

    const refreshAndApplySession = async () => {
      if (!mounted) return;
      setIsLoading(true);
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!mounted) return;
      if (refreshError || !refreshed.session) {
        await clearLocalSession();
        applySession(null);
        return;
      }
      applySession(refreshed.session);
    };

    const syncAutoRefresh = () => {
      if (typeof document === "undefined") {
        supabase.auth.startAutoRefresh();
        return;
      }

      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
        // Proactively refresh if the access token is expired or close to expiry
        void supabase.auth.getSession().then(async ({ data: { session: s } }) => {
          if (shouldRefreshSession(s)) {
            await refreshAndApplySession();
          }
        });
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authEventReceived = true;

      if (event === "SIGNED_OUT" || !nextSession) {
        applySession(null);
        return;
      }

      // On preview refresh, the restored INITIAL_SESSION can contain an expired
      // access token. Refresh it before exposing the user to protected queries.
      if (shouldRefreshSession(nextSession)) {
        void refreshAndApplySession();
        return;
      }

      applySession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (authEventReceived) return;
        // If session is expired or close to expiry, refresh before rendering protected data.
        if (shouldRefreshSession(initialSession)) {
          await refreshAndApplySession();
          return;
        }
        if (error) {
          await clearLocalSession();
          applySession(null);
          return;
        }
        applySession(initialSession);
      })
      .catch(async () => {
        await clearLocalSession();
        if (mounted) {
          applySession(null);
        }
      });

    syncAutoRefresh();
    document.addEventListener("visibilitychange", syncAutoRefresh);
    window.addEventListener("focus", syncAutoRefresh);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", syncAutoRefresh);
      window.removeEventListener("focus", syncAutoRefresh);
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: { nom?: string; prenom?: string }) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
  };

  const value = useMemo(
    () => ({ user, session, isLoading, signIn, signUp, signOut }),
    [user, session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
