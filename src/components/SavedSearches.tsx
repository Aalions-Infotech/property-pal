import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Trash2, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface SavedSearch {
  id: string;
  name: string;
  listing_type: string | null;
  city: string | null;
  locality: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  alerts_enabled: boolean;
  created_at: string;
}

export default function SavedSearches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", listing_type: "buy", city: "", locality: "", property_type: "",
    min_price: "", max_price: "", bedrooms: "", alerts_enabled: true,
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSearches((data as SavedSearch[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      name: form.name.trim(),
      listing_type: form.listing_type || null,
      city: form.city.trim() || null,
      locality: form.locality.trim() || null,
      property_type: form.property_type || null,
      min_price: form.min_price ? Number(form.min_price) : null,
      max_price: form.max_price ? Number(form.max_price) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      alerts_enabled: form.alerts_enabled,
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Search saved" });
    setShowForm(false);
    setForm({ name: "", listing_type: "buy", city: "", locality: "", property_type: "", min_price: "", max_price: "", bedrooms: "", alerts_enabled: true });
    load();
  };

  const toggleAlerts = async (s: SavedSearch) => {
    await supabase.from("saved_searches").update({ alerts_enabled: !s.alerts_enabled }).eq("id", s.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this saved search?")) return;
    await supabase.from("saved_searches").delete().eq("id", id);
    toast({ title: "Removed" });
    load();
  };

  const buildLink = (s: SavedSearch) => {
    const base = s.listing_type === "rent" ? "/rent" : s.listing_type === "commercial" ? "/commercial" : s.listing_type === "pg" ? "/pg" : "/buy";
    const params = new URLSearchParams();
    if (s.city) params.set("city", s.city);
    if (s.locality) params.set("locality", s.locality);
    if (s.property_type) params.set("type", s.property_type);
    if (s.min_price) params.set("min", String(s.min_price));
    if (s.max_price) params.set("max", String(s.max_price));
    if (s.bedrooms) params.set("bhk", String(s.bedrooms));
    return `${base}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg">Saved Searches & Alerts</h2>
          <p className="text-xs text-muted-foreground">Get notified when new properties match your criteria</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> New Saved Search
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Search name (e.g. 3BHK Gomti Nagar)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={form.listing_type} onChange={e => setForm({ ...form, listing_type: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="buy">Buy</option><option value="rent">Rent</option><option value="commercial">Commercial</option><option value="pg">PG</option>
            </select>
            <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="">Any type</option><option value="Apartment">Apartment</option><option value="Villa">Villa</option><option value="Plot">Plot</option><option value="Independent House">Independent House</option><option value="Office">Office</option><option value="Shop">Shop</option>
            </select>
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} placeholder="Locality" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input type="number" value={form.min_price} onChange={e => setForm({ ...form, min_price: e.target.value })} placeholder="Min price (₹)" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input type="number" value={form.max_price} onChange={e => setForm({ ...form, max_price: e.target.value })} placeholder="Max price (₹)" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} placeholder="BHK" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <label className="flex items-center gap-2 px-3 py-2 text-sm">
              <input type="checkbox" checked={form.alerts_enabled} onChange={e => setForm({ ...form, alerts_enabled: e.target.checked })} />
              Email alerts on matches
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Save Search</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>
      ) : searches.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No saved searches yet. Create one to receive alerts.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {searches.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[s.listing_type, s.property_type, s.city, s.locality, s.bedrooms ? `${s.bedrooms}BHK` : null].filter(Boolean).join(" · ") || "Any"}
                  </p>
                  {(s.min_price || s.max_price) && (
                    <p className="text-xs text-muted-foreground">₹{(s.min_price || 0).toLocaleString('en-IN')} – ₹{(s.max_price || 0).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <button onClick={() => toggleAlerts(s)} className={`p-1.5 rounded-lg ${s.alerts_enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`} title={s.alerts_enabled ? "Alerts on" : "Alerts off"}>
                  {s.alerts_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2 mt-1">
                <Link to={buildLink(s)} className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground">Run Search</Link>
                <button onClick={() => remove(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-red-500 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}