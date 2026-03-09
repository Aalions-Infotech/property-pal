import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Star, Phone, MapPin, CheckCircle, Search, MessageSquare, UserPlus, Building2, Mail } from "lucide-react";

const Agents = () => {
  const [city, setCity] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);

      const { data: agentProfiles, error: agentProfilesError } = await (supabase.from("agent_profiles") as any).select("*");

      if (agentProfilesError) {
        setAgents([]);
        setLoading(false);
        return;
      }

      const agentRows = agentProfiles || [];
      const userIds = Array.from(new Set(agentRows.map((ap: any) => ap.user_id).filter(Boolean)));

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase.from("profiles").select("*").in("user_id", userIds);
        profiles = profileRows || [];
      }

      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const merged = agentRows.map((ap: any) => {
        const profile = profileMap.get(ap.user_id);
        const fallbackName = ap.agent_id ? `Agent ${String(ap.agent_id).slice(-4)}` : "Agent";

        return {
          id: ap.user_id,
          name: profile?.full_name || fallbackName,
          bio: profile?.bio || ap.specialization || "PropEstate Verified Agent",
          city: profile?.city || (ap.areas_served?.[0] ?? "India"),
          phone: profile?.phone || "",
          email: profile?.email || "",
          verified: Boolean(profile?.is_verified ?? true),
          avatarUrl: profile?.avatar_url || "",
          experience: ap?.experience_years || 0,
          specialization: ap?.specialization || "",
          totalSales: ap?.total_sales || 0,
          propertiesListed: ap?.properties_listed || 0,
          rating: ap?.rating || 0,
          totalReviews: ap?.total_reviews || 0,
          languages: ap?.languages || "",
          areasServed: ap?.areas_served || [],
          agentId: ap?.agent_id || "",
        };
      });

      setAgents(merged);
      setLoading(false);
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(a => {
    const matchCity = city === "All" || a.city === city;
    const matchSearch = !searchQuery || [a.name, a.city, a.bio, a.specialization].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCity && matchSearch;
  });

  const cities = [...new Set(agents.map(a => a.city).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">PROFESSIONALS</p>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Find Real Estate Agents</h1>
            <p className="text-white/60 text-sm mb-4">Connect with verified professionals across India</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, city, specialization..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none" />
              </div>
              {cities.length > 0 && (
                <select value={city} onChange={e => setCity(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none">
                  <option value="All" className="text-foreground bg-background">All Cities</option>
                  {cities.map(c => <option key={c} value={c} className="text-foreground bg-background">{c}</option>)}
                </select>
              )}
              <Link to="/become-agent" className="btn-gold px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 justify-center">
                <UserPlus className="w-4 h-4" /> Become an Agent
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-semibold text-foreground">{filteredAgents.length}</span> agents found
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Loading agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-display font-bold mb-2">No Agents Yet</p>
              <p className="text-muted-foreground">Agents will appear here once they're verified.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map(agent => (
                <div key={agent.id} className="bg-card rounded-2xl border border-border shadow-card p-5 property-card-hover">
                  <Link to={`/agent/${agent.id}`} className="block">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-navy flex items-center justify-center overflow-hidden flex-shrink-0">
                        {agent.avatarUrl ? (
                          <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xl font-bold">{agent.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-base">{agent.name}</h3>
                          {agent.verified && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{agent.specialization || agent.bio}</p>
                        {agent.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-bold">{agent.rating}</span>
                            {agent.totalReviews > 0 && <span className="text-xs text-muted-foreground">({agent.totalReviews} reviews)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{agent.areasServed?.length > 0 ? agent.areasServed.join(", ") : agent.city}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-muted rounded-xl p-2">
                        <p className="font-bold text-base">{agent.experience}</p>
                        <p className="text-xs text-muted-foreground">Yrs Exp</p>
                      </div>
                      <div className="bg-muted rounded-xl p-2">
                        <p className="font-bold text-base">{agent.totalSales}</p>
                        <p className="text-xs text-muted-foreground">Sales</p>
                      </div>
                      <div className="bg-muted rounded-xl p-2">
                        <p className="font-bold text-base">{agent.propertiesListed}</p>
                        <p className="text-xs text-muted-foreground">Listed</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} onClick={e => e.stopPropagation()} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                      </a>
                    )}
                    {agent.phone && (
                      <a href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                      </a>
                    )}
                    <Link to={`/agent/${agent.id}`} className="flex-1 py-2 rounded-xl btn-gold text-sm flex items-center justify-center gap-1.5">
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && agents.length > 0 && filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No agents found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Agents;
