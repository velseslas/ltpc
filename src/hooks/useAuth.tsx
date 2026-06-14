import { useEffect, useState, createContext, useContext, ReactNode, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
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
          if (!s) return;
          const expiresAt = s.expires_at ?? 0;
          const nowSec = Math.floor(Date.now() / 1000);
          if (expiresAt - nowSec < 60) {
            await supabase.auth.refreshSession().catch(() => {});
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
      applySession(nextSession);
      // Force redirect to /auth on token refresh failure or sign out
      if (event === "TOKEN_REFRESHED" && !nextSession) {
        void supabase.auth.signOut();
      }
    });

    void supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (authEventReceived) return;
        // If session is expired, try to refresh; if it fails, sign out
        if (initialSession) {
          const expiresAt = initialSession.expires_at ?? 0;
          const nowSec = Math.floor(Date.now() / 1000);
          if (expiresAt <= nowSec) {
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshed.session) {
              await supabase.auth.signOut();
              applySession(null);
              return;
            }
            applySession(refreshed.session);
            return;
          }
        }
        if (error) {
          await supabase.auth.signOut();
          applySession(null);
          return;
        }
        applySession(initialSession);
      })
      .catch(async () => {
        await supabase.auth.signOut().catch(() => {});
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
    await supabase.auth.signOut();
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
