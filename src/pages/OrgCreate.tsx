import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/context/OrgContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrgCreate() {
  const { user, loading: authLoading } = useAuth();
  const { refresh, setCurrentOrgId } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    rera_id: "",
    gst_number: "",
    website: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/org/create", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.name.trim().length < 3) {
      toast({ title: "Name too short", description: "Agency name must be at least 3 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await (supabase as any)
      .from("organizations")
      .insert({ ...form, owner_id: user.id, slug, city: "Lucknow" })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      toast({ title: "Couldn't create agency", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
    setCurrentOrgId(data.id);
    toast({ title: "Agency created", description: "You're set up as the owner." });
    navigate("/org/members");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Create your agency</h1>
            <p className="text-sm text-muted-foreground">Add your team, branches, and shared inventory.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6">
          {([
            ["name", "Agency name *", "e.g. Lucknow Realty Group"],
            ["contact_email", "Contact email", "agency@example.com"],
            ["contact_phone", "Contact phone", "+91 …"],
            ["address", "Office address", "Headquarters address in Lucknow"],
            ["rera_id", "RERA registration ID", "Optional"],
            ["gst_number", "GST number", "Optional"],
            ["website", "Website", "https://…"],
          ] as const).map(([k, label, placeholder]) => (
            <div key={k}>
              <label className="block text-xs font-medium mb-1">{label}</label>
              <input
                value={(form as any)[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1">About the agency</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create agency
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}