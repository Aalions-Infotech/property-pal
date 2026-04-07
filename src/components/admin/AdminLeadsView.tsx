import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Search, IndianRupee } from "lucide-react";

const AdminLeadsView = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*, property_listings(title, city)")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const filtered = leads.filter(l => {
    if (filter !== "all" && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.full_name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    converted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    closed: "bg-muted text-muted-foreground border-border",
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading leads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex gap-2">
          {["all", "new", "contacted", "converted", "closed"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${filter === s ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>
              {s} {s !== "all" && `(${leads.filter(l => l.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lead => (
          <div key={lead.id} className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-display font-bold text-sm">{lead.full_name}</h4>
                {lead.property_listings?.title && (
                  <p className="text-xs text-muted-foreground mt-0.5">For: {lead.property_listings.title}</p>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColors[lead.status] || statusColors.new}`}>
                {lead.status}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>{lead.phone}</span>
                {lead.otp_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.budget && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>{lead.budget}</span>
                </div>
              )}
              {lead.visit_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(lead.visit_date).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              {lead.status === "new" && (
                <button onClick={() => updateStatus(lead.id, "contacted")} className="flex-1 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                  Mark Contacted
                </button>
              )}
              {(lead.status === "new" || lead.status === "contacted") && (
                <button onClick={() => updateStatus(lead.id, "converted")} className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                  Converted
                </button>
              )}
              {lead.status !== "closed" && (
                <button onClick={() => updateStatus(lead.id, "closed")} className="py-1.5 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                  Close
                </button>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leads found</p>
        </div>
      )}
    </div>
  );
};

export default AdminLeadsView;
