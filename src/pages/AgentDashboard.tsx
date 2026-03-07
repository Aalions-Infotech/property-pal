import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Home, Users, Bell, TrendingUp, DollarSign,
  Plus, LogOut, RefreshCw, User, Camera, Save, X,
  CheckCircle, Clock, Star, Building2, Phone, Mail,
  MapPin, Globe, Briefcase, Award, Edit
} from "lucide-react";

const AgentDashboard = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", city: "", bio: "" });
  const [agentForm, setAgentForm] = useState({ experience_years: 0, specialization: "", languages: "", areas_served: "" });
  const [clientForm, setClientForm] = useState({ client_name: "", client_email: "", client_phone: "", status: "lead", notes: "", deal_value: 0 });
  const [showClientForm, setShowClientForm] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (role !== "agent") {
      navigate("/dashboard");
      return;
    }
    void fetchAll();
  }, [user, role, authLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const [profileRes, agentRes, listRes, clientRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      (supabase.from("agent_profiles") as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase.from("property_listings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      (supabase.from("agent_clients") as any).select("*").eq("agent_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30),
    ]);
    const p = profileRes.data;
    setProfile(p);
    if (p) setProfileForm({ full_name: p.full_name || "", phone: p.phone || "", city: p.city || "", bio: p.bio || "" });
    const ap = agentRes.data?.[0] || null;
    setAgentProfile(ap);
    if (ap) setAgentForm({ experience_years: ap.experience_years || 0, specialization: ap.specialization || "", languages: ap.languages || "", areas_served: ap.areas_served?.join(", ") || "" });
    setListings(listRes.data || []);
    setClients(clientRes.data || []);
    setNotifications(notifRes.data || []);
    setLoading(false);
  };

  const saveProfile = async () => {
    await supabase.from("profiles").update(profileForm).eq("user_id", user!.id);
    if (agentProfile) {
      await (supabase.from("agent_profiles") as any).update({
        experience_years: agentForm.experience_years,
        specialization: agentForm.specialization || null,
        languages: agentForm.languages || null,
        areas_served: agentForm.areas_served ? agentForm.areas_served.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      }).eq("user_id", user!.id);
    }
    toast({ title: "Profile updated!" });
    setEditMode(false);
    fetchAll();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user!.id}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file, { upsert: true });
    if (uploadErr) { toast({ title: "Upload failed", variant: "destructive" }); setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user!.id);
    toast({ title: "Avatar updated!" });
    setAvatarUploading(false);
    fetchAll();
  };

  const addClient = async () => {
    if (!clientForm.client_name) { toast({ title: "Client name required", variant: "destructive" }); return; }
    await (supabase.from("agent_clients") as any).insert({
      agent_id: user!.id,
      client_name: clientForm.client_name,
      client_email: clientForm.client_email || null,
      client_phone: clientForm.client_phone || null,
      status: clientForm.status,
      notes: clientForm.notes || null,
      deal_value: clientForm.deal_value || 0,
    });
    toast({ title: "Client added!" });
    setClientForm({ client_name: "", client_email: "", client_phone: "", status: "lead", notes: "", deal_value: 0 });
    setShowClientForm(false);
    fetchAll();
  };

  const updateClientStatus = async (id: string, status: string) => {
    await (supabase.from("agent_clients") as any).update({ status }).eq("id", id);
    fetchAll();
  };

  const approvedListings = listings.filter(l => l.status === "approved").length;
  const pendingListings = listings.filter(l => l.status === "pending").length;
  const totalDeals = clients.filter(c => c.status === "closed").length;
  const totalRevenue = clients.filter(c => c.status === "closed").reduce((acc, c) => acc + Number(c.deal_value || 0), 0);
  const activeLeads = clients.filter(c => c.status === "lead" || c.status === "active").length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const stats = [
    { label: "Active Listings", value: approvedListings, icon: Home, color: "text-blue-500" },
    { label: "Pending", value: pendingListings, icon: Clock, color: "text-amber-500" },
    { label: "Deals Closed", value: totalDeals, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-accent" },
    { label: "Active Leads", value: activeLeads, icon: Users, color: "text-purple-500" },
    { label: "Total Clients", value: clients.length, icon: Briefcase, color: "text-pink-500" },
  ];

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", icon: Home },
    { id: "clients", label: "Clients & Leads", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifs },
    { id: "profile", label: "My Profile", icon: User },
  ];

  const fieldClass = "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-display font-bold hidden sm:inline">PropEstate</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20 font-semibold">AGENT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post Property
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{(profile?.full_name || "A")[0].toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-navy rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">{(profile?.full_name || "A")[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-white/60 text-sm">Agent Dashboard</p>
              <h1 className="text-xl font-display font-bold text-white">{profile?.full_name || "Agent"}</h1>
              <p className="text-white/40 text-xs">Agent ID: {agentProfile?.agent_id || "N/A"} · {profile?.city || "India"}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <div className="bg-card rounded-2xl border border-border p-3 space-y-0.5 sticky top-24">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">{item.badge}</span> : null}
                </button>
              ))}
              <div className="pt-2 border-t border-border">
                <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-40">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium relative ${tab === item.id ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-20 md:pb-0">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                      <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                      <p className="text-2xl font-display font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Listings */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold">Recent Listings</h3>
                    <button onClick={() => setTab("listings")} className="text-xs text-accent hover:underline">View all →</button>
                  </div>
                  {listings.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No listings yet</p>
                      <Link to="/post-property" className="text-accent text-sm hover:underline">Post your first property →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.slice(0, 5).map(l => (
                        <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.status === "approved" ? "bg-emerald-500" : l.status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{l.title}</p>
                            <p className="text-xs text-muted-foreground">{l.locality}, {l.city} · ₹{Number(l.price).toLocaleString("en-IN")}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${l.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Clients */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold">Recent Leads</h3>
                    <button onClick={() => setTab("clients")} className="text-xs text-accent hover:underline">View all →</button>
                  </div>
                  {clients.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No clients yet. Add your first lead!</p>
                  ) : (
                    <div className="space-y-2">
                      {clients.slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{c.client_name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{c.client_name}</p>
                            <p className="text-xs text-muted-foreground">{c.client_phone || c.client_email || "No contact"}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${c.status === "closed" ? "bg-emerald-500/10 text-emerald-600" : c.status === "active" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LISTINGS */}
            {tab === "listings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">My Property Listings</h2>
                  <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New
                  </Link>
                </div>
                {listings.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No listings yet</p>
                    <Link to="/post-property" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-medium">Post Property</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listings.map(l => (
                      <div key={l.id} className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                            {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 m-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{l.title}</p>
                            <p className="text-xs text-muted-foreground">{l.locality}, {l.city}</p>
                            <p className="text-sm font-bold text-accent mt-1">₹{Number(l.price).toLocaleString("en-IN")}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${l.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : l.status === "pending" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}>{l.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CLIENTS */}
            {tab === "clients" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">Clients & Leads</h2>
                  <button onClick={() => setShowClientForm(!showClientForm)} className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {showClientForm ? "Cancel" : "Add Client"}
                  </button>
                </div>

                {showClientForm && (
                  <div className="bg-card rounded-2xl border border-accent/30 p-6">
                    <h3 className="font-display font-semibold mb-4">Add New Client</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={clientForm.client_name} onChange={e => setClientForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client Name *" className={fieldClass} />
                      <input value={clientForm.client_email} onChange={e => setClientForm(f => ({ ...f, client_email: e.target.value }))} placeholder="Email" type="email" className={fieldClass} />
                      <input value={clientForm.client_phone} onChange={e => setClientForm(f => ({ ...f, client_phone: e.target.value }))} placeholder="Phone" className={fieldClass} />
                      <select value={clientForm.status} onChange={e => setClientForm(f => ({ ...f, status: e.target.value }))} className={fieldClass}>
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed">Closed</option>
                        <option value="lost">Lost</option>
                      </select>
                      <input value={clientForm.deal_value} onChange={e => setClientForm(f => ({ ...f, deal_value: Number(e.target.value) || 0 }))} placeholder="Deal Value (₹)" type="number" className={fieldClass} />
                      <input value={clientForm.notes} onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" className={fieldClass} />
                    </div>
                    <button onClick={addClient} className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Save Client</button>
                  </div>
                )}

                {clients.length === 0 && !showClientForm ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No clients yet. Add your first lead!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.map(c => (
                      <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-navy flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">{c.client_name[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{c.client_name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {c.client_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.client_phone}</span>}
                              {c.client_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.client_email}</span>}
                              {c.deal_value > 0 && <span className="font-medium text-accent">₹{Number(c.deal_value).toLocaleString("en-IN")}</span>}
                            </div>
                            {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                          </div>
                          <select value={c.status} onChange={e => updateClientStatus(c.id, e.target.value)} className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium outline-none">
                            <option value="lead">Lead</option>
                            <option value="active">Active</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed">Closed</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === "notifications" && (
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold">Notifications</h2>
                {notifications.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className={`bg-card rounded-2xl border p-4 ${n.is_read ? "border-border" : "border-accent/30"}`}>
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {tab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">Agent Profile</h2>
                  <button onClick={() => editMode ? saveProfile() : setEditMode(true)} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground">
                    {editMode ? <><Save className="w-4 h-4" /> Save</> : <><Edit className="w-4 h-4" /> Edit</>}
                  </button>
                </div>

                {/* Avatar */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-navy flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-2xl font-bold">{(profile?.full_name || "A")[0].toUpperCase()}</span>
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:opacity-80">
                        <Camera className="w-4 h-4 text-accent-foreground" />
                        <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">{profile?.full_name || "Agent"}</h3>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20 font-medium">Agent</span>
                        {profile?.is_verified && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                        {agentProfile?.agent_id && <span className="text-xs text-muted-foreground">ID: {agentProfile.agent_id}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-4">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                      <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                      <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                      <input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
                      <input value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                  </div>
                </div>

                {/* Agent Details */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-4">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Experience (Years)</label>
                      <input value={agentForm.experience_years} onChange={e => setAgentForm(f => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))} type="number" disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Specialization</label>
                      <input value={agentForm.specialization} onChange={e => setAgentForm(f => ({ ...f, specialization: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Languages</label>
                      <input value={agentForm.languages} onChange={e => setAgentForm(f => ({ ...f, languages: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Areas Served (comma-separated)</label>
                      <input value={agentForm.areas_served} onChange={e => setAgentForm(f => ({ ...f, areas_served: e.target.value }))} disabled={!editMode} className={fieldClass + (editMode ? "" : " opacity-70")} />
                    </div>
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-3">
                    <button onClick={saveProfile} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button onClick={() => setEditMode(false)} className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
