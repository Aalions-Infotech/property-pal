import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "moderator" | "agent" | "user";

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
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

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem("lastActivity");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    window.location.href = "/auth";
  }, []);

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    const checkExpiry = () => {
      const last = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
        handleSignOut();
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

    return () => subscription.unsubscribe();
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
