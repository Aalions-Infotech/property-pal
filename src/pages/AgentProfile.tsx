import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, Phone, Mail, MapPin, CheckCircle, Briefcase, Award, MessageSquare, Building2, Globe, Users, TrendingUp, Calendar, ExternalLink } from "lucide-react";

const AgentProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", message: "" });
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", id).single();
      const { data: ap } = await (supabase.from("agent_profiles") as any).select("*").eq("user_id", id).single();
      const { data: props } = await supabase.from("property_listings").select("*").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false }).limit(12);
      setProfile(prof);
      setAgentProfile(ap);
      setListings(props || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleEnquiry = () => {
    if (!enquiryForm.name || !enquiryForm.phone) return;
    setEnquirySent(true);
    setTimeout(() => { setEnquirySent(false); setShowEnquiry(false); }, 3000);
    setEnquiryForm({ name: "", phone: "", message: "" });
  };

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
        {/* Hero Header */}
        <div className="bg-gradient-navy py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-28 h-28 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-white/10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">{(profile.full_name || "A")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{profile.full_name || "Agent"}</h1>
                  {profile.is_verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-sm mt-1">{profile.bio || "PropEstate Verified Real Estate Professional"}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {profile.city && <span className="flex items-center gap-1 text-white/50 text-xs"><MapPin className="w-3 h-3" />{profile.city}</span>}
                  {agentProfile?.experience_years > 0 && <span className="flex items-center gap-1 text-white/50 text-xs"><Briefcase className="w-3 h-3" />{agentProfile.experience_years} Years Experience</span>}
                  {agentProfile?.specialization && <span className="flex items-center gap-1 text-white/50 text-xs"><Award className="w-3 h-3" />{agentProfile.specialization}</span>}
                  {agentProfile?.agent_id && <span className="flex items-center gap-1 text-white/40 text-xs"><Globe className="w-3 h-3" />ID: {agentProfile.agent_id}</span>}
                </div>

                {/* Quick Contact Buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                  <button onClick={() => setShowEnquiry(!showEnquiry)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/20">
                    <ExternalLink className="w-4 h-4" /> Send Enquiry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Enquiry Form */}
          {showEnquiry && (
            <div className="bg-card rounded-2xl border border-accent/30 p-6 mb-6">
              {enquirySent ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold">Enquiry sent successfully!</p>
                </div>
              ) : (
                <>
                  <h3 className="font-display font-semibold mb-4">Send Enquiry to {profile.full_name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input value={enquiryForm.name} onChange={e => setEnquiryForm(f => ({ ...f, name: e.target.value }))} placeholder="Your Name *" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                    <input value={enquiryForm.phone} onChange={e => setEnquiryForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone Number *" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                    <input value={enquiryForm.message} onChange={e => setEnquiryForm(f => ({ ...f, message: e.target.value }))} placeholder="Message (optional)" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <button onClick={handleEnquiry} className="mt-3 px-6 py-2.5 rounded-xl btn-gold text-sm font-medium">Submit Enquiry</button>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-4">Agent Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Active Listings</span>
                    <span className="font-bold text-sm">{listings.length}</span>
                  </div>
                  {agentProfile && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total Sales</span>
                        <span className="font-bold text-sm">{agentProfile.total_sales || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Experience</span>
                        <span className="font-bold text-sm">{agentProfile.experience_years || 0} Years</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Properties Listed</span>
                        <span className="font-bold text-sm">{agentProfile.properties_listed || 0}</span>
                      </div>
                      {agentProfile.rating > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-sm text-muted-foreground flex items-center gap-2"><Star className="w-4 h-4" /> Rating</span>
                          <span className="font-bold text-sm flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {agentProfile.rating}
                          </span>
                        </div>
                      )}
                      {agentProfile.languages && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> Languages</span>
                          <span className="font-bold text-sm">{agentProfile.languages}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">{profile.phone}</p>
                        <p className="text-xs text-muted-foreground">Tap to call</p>
                      </div>
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{profile.email}</p>
                        <p className="text-xs text-muted-foreground">Tap to email</p>
                      </div>
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-xs text-muted-foreground">Send a message</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Specialization */}
              {agentProfile?.specialization && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">Specialization</h3>
                  <p className="text-sm text-muted-foreground">{agentProfile.specialization}</p>
                </div>
              )}

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

              {agentProfile?.certifications?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {agentProfile.certifications.map((c: string) => (
                      <div key={c} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-accent" />
                        <span className="text-sm">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Listings */}
            <div className="md:col-span-2">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Properties by {profile.full_name || "Agent"} ({listings.length})
              </h3>
              {listings.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.map(l => (
                    <Link key={l.id} to={`/property/${l.id}`} className="bg-card rounded-2xl border border-border overflow-hidden property-card-hover group">
                      <div className="h-40 bg-muted overflow-hidden">
                        {l.images?.[0] ? (
                          <img src={l.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={l.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{l.locality}, {l.city}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-display font-bold text-accent">₹{Number(l.price).toLocaleString("en-IN")}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {l.bedrooms && <span>{l.bedrooms} BHK</span>}
                            {l.area && <span>{l.area} {l.area_unit}</span>}
                          </div>
                        </div>
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
