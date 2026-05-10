import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, RefreshCw, FileEdit, Loader2 } from "lucide-react";

interface AdminUpdateRequestsProps {
  adminId: string;
}

const STATUS_TINTS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminUpdateRequests = ({ adminId }: AdminUpdateRequestsProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("property_update_requests")
      .select("*, property_listings(id, title, city, locality, status)")
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const review = async (id: string, status: "approved" | "rejected") => {
    setActingOn(id);
    const { error } = await supabase
      .from("property_update_requests")
      .update({ status, reviewed_by: adminId, reviewed_at: new Date().toISOString(), admin_note: noteDraft[id] || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "✅ Update applied" : "Request rejected" });
      await fetchAll();
    }
    setActingOn(null);
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2"><FileEdit className="w-5 h-5" /> Listing Update Requests</h2>
          <p className="text-sm text-muted-foreground">Review and approve user-submitted edits to live listings.</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map(f => {
          const count = f === "all" ? requests.length : requests.filter(r => r.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filter === f ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
          No {filter !== "all" ? filter : ""} update requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const changes = r.proposed_changes || {};
            const keys = Object.keys(changes);
            return (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-sm sm:text-base truncate">
                        {r.property_listings?.title || "Listing"}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_TINTS[r.status] || ""}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.property_listings?.locality}, {r.property_listings?.city} · Submitted {new Date(r.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-muted/30 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground">Proposed changes ({keys.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {keys.map(k => (
                      <div key={k} className="flex gap-2">
                        <span className="font-medium text-muted-foreground capitalize min-w-[110px]">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-foreground break-all">{Array.isArray(changes[k]) ? changes[k].join(", ") : String(changes[k] ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="mt-3 space-y-2">
                    <input
                      placeholder="Optional admin note (shown to owner if rejected)"
                      value={noteDraft[r.id] || ""}
                      onChange={e => setNoteDraft(d => ({ ...d, [r.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => review(r.id, "approved")} disabled={actingOn === r.id} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Apply
                      </button>
                      <button onClick={() => review(r.id, "rejected")} disabled={actingOn === r.id} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {r.status !== "pending" && r.admin_note && (
                  <div className="mt-3 text-xs p-2 bg-muted/30 rounded-lg">
                    <span className="font-semibold">Admin note:</span> {r.admin_note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUpdateRequests;