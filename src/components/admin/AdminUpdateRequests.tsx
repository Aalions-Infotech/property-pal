import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, RefreshCw, FileEdit, Loader2, History, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface AdminUpdateRequestsProps {
  adminId: string;
}

const STATUS_TINTS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const fmtVal = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const AdminUpdateRequests = ({ adminId }: AdminUpdateRequestsProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, any>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [auditMap, setAuditMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchAll = async () => {
    setLoading(true);
    const { data: reqs, error } = await supabase
      .from("property_update_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load update requests", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = reqs || [];
    setRequests(list);

    const listingIds = Array.from(new Set(list.map((r: any) => r.listing_id).filter(Boolean)));
    const userIds = Array.from(new Set([
      ...list.map((r: any) => r.user_id),
      ...list.map((r: any) => r.reviewed_by),
    ].filter(Boolean)));
    const reqIds = list.map((r: any) => r.id);

    const [lRes, pRes, aRes] = await Promise.all([
      listingIds.length
        ? supabase.from("property_listings").select("*").in("id", listingIds as string[])
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds as string[])
        : Promise.resolve({ data: [] as any[] }),
      reqIds.length
        ? supabase.from("update_request_audit").select("*").in("request_id", reqIds).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const lMap: Record<string, any> = {};
    (lRes.data || []).forEach((l: any) => { lMap[l.id] = l; });
    setListingsMap(lMap);
    const pMap: Record<string, any> = {};
    (pRes.data || []).forEach((p: any) => { pMap[p.user_id] = p; });
    setProfilesMap(pMap);
    const aMap: Record<string, any[]> = {};
    (aRes.data || []).forEach((a: any) => {
      (aMap[a.request_id] = aMap[a.request_id] || []).push(a);
    });
    setAuditMap(aMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("admin-update-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "property_update_requests" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const review = async (id: string, status: "approved" | "rejected") => {
    const note = (noteDraft[id] || "").trim();
    if (status === "rejected" && note.length < 5) {
      toast({ title: "Rejection note required", description: "Please provide a clear reason (min 5 characters).", variant: "destructive" });
      return;
    }
    if (note.length > 500) {
      toast({ title: "Note too long", description: "Keep notes under 500 characters.", variant: "destructive" });
      return;
    }
    if (status === "approved" && !confirm("Approve and apply these changes to the live listing?")) return;

    setActingOn(id);
    const { error } = await supabase
      .from("property_update_requests")
      .update({ status, reviewed_by: adminId, reviewed_at: new Date().toISOString(), admin_note: note || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "✅ Update applied to listing" : "Request rejected" });
      setNoteDraft(d => ({ ...d, [id]: "" }));
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
          <p className="text-sm text-muted-foreground">Review proposed edits before they go live. All actions are audited.</p>
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
            const listing = listingsMap[r.listing_id];
            const submitter = profilesMap[r.user_id];
            const reviewer = profilesMap[r.reviewed_by];
            const audit = auditMap[r.id] || [];
            const isOpen = !!expanded[r.id];

            return (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-sm sm:text-base truncate">
                        {listing?.title || "Listing (unavailable)"}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_TINTS[r.status] || ""}`}>
                        {r.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/40">
                        {keys.length} field{keys.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {listing ? `${listing.locality || ""}${listing.locality && listing.city ? ", " : ""}${listing.city || ""} · ` : ""}
                      Submitted by {submitter?.full_name || submitter?.email || "user"} · {new Date(r.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted flex items-center gap-1"
                  >
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isOpen ? "Hide diff" : "Show diff"}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 bg-muted/30 rounded-xl p-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Proposed changes — previous → new
                    </p>
                    {keys.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No fields changed.</p>
                    ) : (
                      <div className="space-y-1">
                        {keys.map(k => {
                          const oldV = listing ? (listing as any)[k] : undefined;
                          const newV = changes[k];
                          return (
                            <div key={k} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto_1fr] gap-2 text-xs items-start py-1.5 border-b border-border/40 last:border-0">
                              <span className="font-medium capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                              <span className="px-2 py-1 rounded bg-red-500/10 text-red-700 dark:text-red-400 line-through break-all">
                                {fmtVal(oldV)}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground self-center hidden sm:block" />
                              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium break-all">
                                {fmtVal(newV)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {audit.length > 0 && (
                      <div className="pt-3 border-t border-border/40">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <History className="w-3.5 h-3.5" /> Audit trail ({audit.length})
                        </p>
                        <ul className="space-y-1.5">
                          {audit.map(a => (
                            <li key={a.id} className="text-xs flex flex-wrap items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_TINTS[a.action] || "border-border bg-muted"}`}>
                                {a.action}
                              </span>
                              <span className="text-muted-foreground">
                                by {profilesMap[a.reviewer_id]?.full_name || profilesMap[a.reviewer_id]?.email || a.reviewer_id?.slice(0, 8) || "system"}
                              </span>
                              <span className="text-muted-foreground">· {new Date(a.created_at).toLocaleString('en-IN')}</span>
                              {a.note && <span className="text-foreground italic">— "{a.note}"</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {r.status === "pending" && (
                  <div className="mt-3 space-y-2">
                    <input
                      maxLength={500}
                      placeholder="Admin remark (required for rejection, min 5 chars)"
                      value={noteDraft[r.id] || ""}
                      onChange={e => setNoteDraft(d => ({ ...d, [r.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{(noteDraft[r.id] || "").length}/500</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => review(r.id, "approved")}
                        disabled={actingOn === r.id || keys.length === 0}
                        title={keys.length === 0 ? "No changes to apply" : ""}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Apply
                      </button>
                      <button
                        onClick={() => review(r.id, "rejected")}
                        disabled={actingOn === r.id}
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
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
                {r.status !== "pending" && r.reviewed_at && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Reviewed by {reviewer?.full_name || reviewer?.email || r.reviewed_by?.slice(0, 8)} on {new Date(r.reviewed_at).toLocaleString('en-IN')}
                  </p>
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
