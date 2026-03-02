import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, Phone, Mail, MapPin, CheckCircle, Briefcase, Award, MessageSquare, Building2 } from "lucide-react";

const AgentProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", id).single();
      const { data: ap } = await (supabase.from("agent_profiles") as any).select("*").eq("user_id", id).single();
      const { data: props } = await supabase.from("property_listings").select("*").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false }).limit(12);
      setProfile(prof);
      setAgentProfile(ap);
      setListings(props || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold mb-2">Agent Not Found</h2>
            <Link to="/agents" className="text-accent hover:underline">← Back to Agents</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-gradient-navy py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{(profile.full_name || "A")[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{profile.full_name || "Agent"}</h1>
                  {profile.is_verified && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                </div>
                <p className="text-white/60 text-sm mt-1">{profile.bio || "PropEstate Verified Agent"}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {profile.city && <span className="flex items-center gap-1 text-white/50 text-xs"><MapPin className="w-3 h-3" />{profile.city}</span>}
                  {agentProfile?.experience_years > 0 && <span className="flex items-center gap-1 text-white/50 text-xs"><Briefcase className="w-3 h-3" />{agentProfile.experience_years} Yrs Experience</span>}
                  {agentProfile?.specialization && <span className="flex items-center gap-1 text-white/50 text-xs"><Award className="w-3 h-3" />{agentProfile.specialization}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Contact Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-4">Contact Agent</h3>
                <div className="space-y-3">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">{profile.phone}</span>
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{profile.email}</span>
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`sms:${profile.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Send Message</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-4">Agent Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Active Listings</span>
                    <span className="font-bold text-sm">{listings.length}</span>
                  </div>
                  {agentProfile && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Total Sales</span>
                        <span className="font-bold text-sm">{agentProfile.total_sales || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Experience</span>
                        <span className="font-bold text-sm">{agentProfile.experience_years || 0} Years</span>
                      </div>
                      {agentProfile.languages && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Languages</span>
                          <span className="font-bold text-sm">{agentProfile.languages}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {agentProfile?.areas_served?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">Areas Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {agentProfile.areas_served.map((a: string) => (
                      <span key={a} className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground border border-border">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Listings */}
            <div className="md:col-span-2">
              <h3 className="font-display font-semibold mb-4">Properties by {profile.full_name || "Agent"}</h3>
              {listings.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.map(l => (
                    <Link key={l.id} to={`/property/${l.id}`} className="bg-card rounded-2xl border border-border overflow-hidden property-card-hover">
                      <div className="h-36 bg-muted overflow-hidden">
                        {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-muted-foreground" /></div>}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{l.locality}, {l.city}</p>
                        <p className="font-display font-bold text-accent mt-2">₹{Number(l.price).toLocaleString("en-IN")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AgentProfile;
