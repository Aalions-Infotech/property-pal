import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Palette, Globe, Save, Sun, Moon, Monitor } from "lucide-react";

export default function AdminPlatformSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState<{ default: "light" | "dark" | "system"; enforce: boolean }>({ default: "system", enforce: false });
  const [platform, setPlatform] = useState<any>({ maintenance_mode: false, support_email: "", support_phone: "", tagline: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("*");
      data?.forEach((row: any) => {
        if (row.key === "theme") setTheme({ default: row.value.default || "system", enforce: !!row.value.enforce });
        if (row.key === "platform") setPlatform({ ...platform, ...(row.value || {}) });
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveKey = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key, value, updated_by: user!.id, updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Settings saved" });
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h3 className="font-display font-bold mb-1 flex items-center gap-2"><Palette className="w-5 h-5" /> Global Theme</h3>
        <p className="text-xs text-muted-foreground mb-4">Set the default appearance for all users. Enforce to override individual user choices.</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {([
            { v: "light", label: "Light", icon: Sun },
            { v: "dark", label: "Dark", icon: Moon },
            { v: "system", label: "System", icon: Monitor },
          ] as const).map(opt => (
            <button key={opt.v} onClick={() => setTheme({ ...theme, default: opt.v })}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-colors ${theme.default === opt.v ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted/50"}`}>
              <opt.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 cursor-pointer">
          <input type="checkbox" checked={theme.enforce} onChange={e => setTheme({ ...theme, enforce: e.target.checked })} />
          <div>
            <p className="text-sm font-medium">Enforce theme for all users</p>
            <p className="text-xs text-muted-foreground">When enabled, users can't override the default appearance.</p>
          </div>
        </label>
        <button disabled={saving} onClick={() => saveKey("theme", theme)} className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save Theme Settings
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h3 className="font-display font-bold mb-1 flex items-center gap-2"><Globe className="w-5 h-5" /> Platform Settings</h3>
        <p className="text-xs text-muted-foreground mb-4">Public contact and operational settings.</p>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Tagline</span>
            <input value={platform.tagline || ""} onChange={e => setPlatform({ ...platform, tagline: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Support Email</span>
              <input type="email" value={platform.support_email || ""} onChange={e => setPlatform({ ...platform, support_email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Support Phone</span>
              <input value={platform.support_phone || ""} onChange={e => setPlatform({ ...platform, support_phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer">
            <input type="checkbox" checked={!!platform.maintenance_mode} onChange={e => setPlatform({ ...platform, maintenance_mode: e.target.checked })} />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Display a maintenance banner across the public site.</p>
            </div>
          </label>
          <button disabled={saving} onClick={() => saveKey("platform", platform)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Platform Settings
          </button>
        </div>
      </div>
    </div>
  );
}