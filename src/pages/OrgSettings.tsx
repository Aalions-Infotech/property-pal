import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/context/OrgContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Building2, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrgSettings() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, refresh, loading: orgLoading } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const canEdit = currentOrg && ["owner", "admin"].includes(currentOrg.role);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/org/settings", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!currentOrg) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("*")
        .eq("id", currentOrg.org_id)
        .maybeSingle();
      setForm(data);
    })();
  }, [currentOrg]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !canEdit) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("organizations")
      .update({
        name: form.name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        address: form.address,
        rera_id: form.rera_id,
        gst_number: form.gst_number,
        website: form.website,
        description: form.description,
        logo_url: form.logo_url,
      })
      .eq("id", form.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
    toast({ title: "Saved", description: "Agency details updated." });
  };

  if (orgLoading || !form) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto pt-28 px-6 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">You don't belong to any agency yet.</p>
          <button onClick={() => navigate("/org/create")} className="px-4 py-2 btn-gold rounded-xl text-sm">Create one</button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              Agency Settings
              {form.is_verified && <BadgeCheck className="w-5 h-5 text-accent" />}
            </h1>
            <p className="text-sm text-muted-foreground">Update info visible to your team and buyers.</p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4 bg-card border border-border rounded-2xl p-6">
          {([
            ["name", "Agency name"],
            ["contact_email", "Contact email"],
            ["contact_phone", "Contact phone"],
            ["address", "Address"],
            ["rera_id", "RERA ID"],
            ["gst_number", "GST number"],
            ["website", "Website"],
            ["logo_url", "Logo URL"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-medium mb-1">{label}</label>
              <input
                disabled={!canEdit}
                value={form[k] || ""}
                onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1">About</label>
            <textarea
              disabled={!canEdit}
              rows={3}
              value={form.description || ""}
              onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
          </div>
          {canEdit && (
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl btn-gold font-semibold text-sm flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          )}
        </form>
      </main>
      <Footer />
    </div>
  );
}