import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AppRole = "admin" | "moderator" | "agent" | "user";

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

const clearStoredAuth = () => {
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("ekananda.current_org_id");

  for (const store of [localStorage, sessionStorage]) {
    Object.keys(store).forEach((key) => {
      if ((key.startsWith("sb-") && key.endsWith("-auth-token")) || key.includes("supabase.auth.token")) {
        store.removeItem(key);
      }
    });
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  isAdmin: boolean;
  signOut: (opts?: { reason?: "expired" | "manual"; redirectTo?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  isAdmin: false,
  signOut: async () => {},
});

const resolvePrimaryRole = (roles: string[] = []): AppRole => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";
  if (roles.includes("agent")) return "agent";
  return "user";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchRole = async (userId: string): Promise<AppRole> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const resolvedRole = resolvePrimaryRole((data || []).map((r) => r.role));
    setRole(resolvedRole);
    return resolvedRole;
  };

  const applySession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      await fetchRole(nextSession.user.id);
      // Track last activity for session timeout
      localStorage.setItem("lastActivity", Date.now().toString());
    } else {
      setRole(null);
      localStorage.removeItem("lastActivity");
    }

    setLoading(false);
  };

  const handleSignOut = useCallback(
    async (opts?: { reason?: "expired" | "manual"; redirectTo?: string }) => {
      const reason = opts?.reason ?? "manual";
      clearStoredAuth();
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
      setUser(null);
      setSession(null);
      setRole(null);

      if (reason === "expired") {
        toast({
          title: "Session expired",
          description: "You've been signed out due to inactivity. Please sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      }

      const target =
        opts?.redirectTo ??
        (reason === "expired" ? "/auth?reason=expired" : "/");
      window.location.href = target;
    },
    []
  );

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    const checkExpiry = () => {
      const last = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
        handleSignOut({ reason: "expired" });
      }
    };

    // Check every 30s
    const interval = setInterval(checkExpiry, 30_000);

    // Update activity on user interaction
    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [user, handleSignOut]);

  // (Removed: aggressive popstate auto-logout was signing users out on
  // ordinary back-button navigation, causing widespread session loss bugs.)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setLoading(true);
        void applySession(nextSession);
      }
    );

    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void applySession(initialSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, role,
      isAdmin: role === "admin" || role === "moderator",
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
