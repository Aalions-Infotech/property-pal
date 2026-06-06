import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Folder, Trash2, Home } from "lucide-react";

type Shortlist = { id: string; name: string; description: string | null };
type Item = { id: string; shortlist_id: string; property_id: string; notes: string | null; property?: any };

export default function BuyerShortlists() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lists, setLists] = useState<Shortlist[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    void load();
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("buyer_shortlists").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setLists((data as Shortlist[]) || []);
    if (data && data[0] && !active) setActive(data[0].id);
    setLoading(false);
  };

  useEffect(() => { if (active) void loadItems(active); }, [active]);

  const loadItems = async (id: string) => {
    const { data } = await (supabase as any)
      .from("buyer_shortlist_items")
      .select("*, property:property_listings(id,title,city,locality,price,bedrooms,images)")
      .eq("shortlist_id", id);
    setItems((data as Item[]) || []);
  };

  const create = async () => {
    if (!newName.trim()) return;
    const { data, error } = await (supabase as any).from("buyer_shortlists").insert({ user_id: user!.id, name: newName.trim() }).select().single();
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setLists(l => [data as Shortlist, ...l]);
    setActive((data as Shortlist).id);
    setNewName("");
  };

  const removeList = async (id: string) => {
    if (!confirm("Delete this shortlist?")) return;
    await (supabase as any).from("buyer_shortlists").delete().eq("id", id);
    setLists(l => l.filter(x => x.id !== id));
    if (active === id) setActive(null);
  };

  const removeItem = async (id: string) => {
    await (supabase as any).from("buyer_shortlist_items").delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="font-display font-bold">Buyer Shortlists</h1>
            <p className="text-[11px] text-muted-foreground">Organize favorite properties into folders</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-3">
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New folder name" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <button onClick={create} className="px-3 rounded-lg bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {lists.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Create your first folder</p>}
            {lists.map(l => (
              <div key={l.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${active === l.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setActive(l.id)}>
                <Folder className="w-4 h-4" />
                <span className="flex-1 truncate text-sm">{l.name}</span>
                <button onClick={(e) => { e.stopPropagation(); removeList(l.id); }} className="opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </aside>

        <main>
          {!active ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select or create a shortlist folder</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Home className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No properties yet</p>
              <Link to="/buy" className="text-accent text-sm">Browse properties →</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map(it => (
                <div key={it.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {it.property?.images?.[0] ? <img src={it.property.images[0]} className="w-full h-full object-cover" /> : <Home className="w-8 h-8 m-auto mt-10 text-muted-foreground" />}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{it.property?.title || "Property"}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.property?.locality}, {it.property?.city}</p>
                    <p className="text-sm font-bold mt-1">₹{Number(it.property?.price || 0).toLocaleString("en-IN")}</p>
                    <div className="flex gap-2 mt-2">
                      <Link to={`/property/${it.property_id}`} className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-primary text-primary-foreground">View</Link>
                      <button onClick={() => removeItem(it.id)} className="px-2 py-1.5 rounded-lg border border-border text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}