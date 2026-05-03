import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  enforced: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  enforced: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("re-theme") as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [enforced, setEnforced] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.style.colorScheme = theme;
    localStorage.setItem("re-theme", theme);
  }, [theme]);

  // Sync theme across tabs/windows instantly
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "re-theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Apply global admin-controlled theme settings
  useEffect(() => {
    let mounted = true;
    const apply = (val: any) => {
      if (!mounted || !val) return;
      const def = val.default as "light" | "dark" | "system" | undefined;
      const enforce = !!val.enforce;
      setEnforced(enforce);
      const userHasChoice = !!localStorage.getItem("re-theme");
      if (enforce || !userHasChoice) {
        let resolved: Theme = "light";
        if (def === "dark") resolved = "dark";
        else if (def === "light") resolved = "light";
        else resolved = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setThemeState(resolved);
      }
    };
    supabase.from("app_settings").select("value").eq("key", "theme").maybeSingle()
      .then(({ data }) => apply(data?.value));

    const channel = supabase
      .channel("app-settings-theme")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings", filter: "key=eq.theme" }, (payload: any) => {
        apply(payload.new?.value);
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, enforced }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
