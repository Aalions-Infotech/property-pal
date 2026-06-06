import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Folder, Plus, X } from "lucide-react";

export default function AddToShortlistButton({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    (supabase as any).from("buyer_shortlists").select("*").eq("user_id", user.id).then((r: any) => setLists(r.data || []));
  }, [open, user]);

  const addTo = async (id: string) => {
    const { error } = await (supabase as any).from("buyer_shortlist_items").insert({ shortlist_id: id, property_id: propertyId });
    if (error && !error.message.includes("duplicate")) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Added to shortlist" });
    setOpen(false);
  };

  const createAndAdd = async () => {
    if (!newName.trim() || !user) return;
    const { data } = await (supabase as any).from("buyer_shortlists").insert({ user_id: user.id, name: newName.trim() }).select().single();
    if (data) await addTo(data.id);
    setNewName("");
  };

  if (!user) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-lg border border-border text-sm flex items-center gap-2 hover:bg-muted">
        <Folder className="w-4 h-4" /> Shortlist
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add to shortlist</h3>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {lists.map(l => (
                <button key={l.id} onClick={() => addTo(l.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-left">
                  <Folder className="w-4 h-4" /> {l.name}
                </button>
              ))}
              {lists.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No folders yet</p>}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New folder" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <button onClick={createAndAdd} className="px-3 rounded-lg bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}