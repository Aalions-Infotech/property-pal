import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Home, Eye, DollarSign, Star, Search, Users, TrendingUp, Phone, Mail, MapPin, Briefcase } from "lucide-react";

interface Props {
  users: any[];
  userRoles: any[];
}

const AdminAgentDashboardView = ({ users, userRoles }: Props) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [agentListings, setAgentListings] = useState<any[]>([]);
  const [agentClients, setAgentClients] = useState<any[]>([]);
  const [agentReviews, setAgentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const agentUserIds = userRoles.filter(r => r.role === "agent").map(r => r.user_id);
    if (agentUserIds.length === 0) { setAgents([]); setLoading(false); return; }

    const [profilesRes, agentProfilesRes] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", agentUserIds),
      supabase.from("agent_profiles").select("*").in("user_id", agentUserIds),
    ]);

    const merged = (profilesRes.data || []).map(p => {
      const ap = (agentProfilesRes.data || []).find(a => a.user_id === p.user_id);
      return { ...p, agentProfile: ap };
    });
    setAgents(merged);
    setLoading(false);
  };

  const filteredAgents = agents.filter(a =>
    !searchQuery || [a.full_name, a.email, a.city, a.agentProfile?.agent_id].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (!selectedAgentId) return;
    setLoading(true);
    Promise.all([
      supabase.from("agent_profiles").select("*").eq("user_id", selectedAgentId).maybeSingle(),
      supabase.from("property_listings").select("*").eq("user_id", selectedAgentId).order("created_at", { ascending: false }),
      supabase.from("agent_clients").select("*").eq("agent_id", selectedAgentId).order("created_at", { ascending: false }),
      supabase.from("agent_reviews").select("*").eq("agent_user_id", selectedAgentId).order("created_at", { ascending: false }),
    ]).then(([apRes, listRes, clientRes, reviewRes]) => {
      setAgentProfile(apRes.data);
      setAgentListings(listRes.data || []);
      setAgentClients(clientRes.data || []);
      setAgentReviews(reviewRes.data || []);
      setLoading(false);
    });
  }, [selectedAgentId]);

  const selectedAgent = agents.find(a => a.user_id === selectedAgentId);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      lead: "bg-blue-500/10 text-blue-600",
      active: "bg-emerald-500/10 text-emerald-600",
      closed: "bg-gray-500/10 text-gray-500",
      pending: "bg-amber-500/10 text-amber-600",
      approved: "bg-emerald-500/10 text-emerald-600",
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.lead}`;
  };

  if (selectedAgentId && selectedAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedAgentId(null); setAgentProfile(null); }} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">← Back to Agents</button>
          <h2 className="font-display font-bold text-lg">Agent: {selectedAgent.full_name}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Agent Profile */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selectedAgent.avatar_url ? (
                    <img src={selectedAgent.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedAgent.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{agentProfile?.agent_id || "No Agent ID"}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedAgent.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedAgent.phone || "N/A"}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedAgent.city || "N/A"}</span>
                  </div>
                </div>
                <div className="text-right">
                  {agentProfile && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{Number(agentProfile.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({agentProfile.total_reviews || 0})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Listings", value: agentListings.length, icon: Home, color: "text-blue-500" },
                { label: "Clients", value: agentClients.length, icon: Users, color: "text-emerald-500" },
                { label: "Total Sales", value: agentProfile?.total_sales || 0, icon: TrendingUp, color: "text-purple-500" },
                { label: "Revenue", value: `₹${Number(agentProfile?.total_revenue || 0).toLocaleString("en-IN")}`, icon: DollarSign, color: "text-yellow-500" },
                { label: "Reviews", value: agentReviews.length, icon: Star, color: "text-amber-500" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
                  <s.icon className={`w-5 h-5 mx-auto ${s.color} mb-1`} />
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Listings */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Property Listings ({agentListings.length})</h3>
              {agentListings.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No listings</p>
              ) : (
                <div className="space-y-3">
                  {agentListings.map(l => (
                    <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{l.locality}, {l.city} · ₹{Number(l.price).toLocaleString("en-IN")}</p>
                      </div>
                      <span className={statusBadge(l.status)}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clients Pipeline */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Client Pipeline ({agentClients.length})</h3>
              {agentClients.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No clients</p>
              ) : (
                <div className="space-y-3">
                  {agentClients.map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{c.client_name}</p>
                        <p className="text-xs text-muted-foreground">{c.client_email} · {c.client_phone}</p>
                        {c.deal_value > 0 && <p className="text-xs text-muted-foreground">Deal: ₹{Number(c.deal_value).toLocaleString("en-IN")}</p>}
                      </div>
                      <span className={statusBadge(c.status)}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Reviews ({agentReviews.length})</h3>
              {agentReviews.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No reviews yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {agentReviews.map(r => (
                    <div key={r.id} className="p-3 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{r.reviewer_name}</p>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </div>
                      </div>
                      {r.review_text && <p className="text-xs text-muted-foreground">{r.review_text}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="font-display font-bold text-lg">All Agent Dashboards</h2>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No agents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map(a => (
            <div key={a.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{a.full_name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.agentProfile?.agent_id || "No ID"}</p>
                </div>
                {a.agentProfile?.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    {Number(a.agentProfile.rating).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p>{a.email}</p>
                <p>{a.city || "No city"} · {a.phone || "No phone"}</p>
                {a.agentProfile && (
                  <p>{a.agentProfile.experience_years || 0} yrs exp · {a.agentProfile.specialization || "General"}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedAgentId(a.user_id)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1"
              >
                <Eye className="w-3 h-3" /> View Full Dashboard
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAgentDashboardView;
