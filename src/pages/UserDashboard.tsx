import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Home, Plus, Bell, Clock, CheckCircle, XCircle, Zap, TrendingUp,
  MapPin, Star, Eye, Edit, Trash2, ChevronRight, DollarSign, User, LogOut, Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [listings, setListings] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [listRes, sponsorRes, notifRes, plansRes, profileRes] = await Promise.all([
      supabase.from("property_listings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("sponsorships").select("*, property_listings(title, city)").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("sponsorship_plans").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    ]);
    setListings(listRes.data || []);
    setSponsorships(sponsorRes.data || []);
    setNotifications(notifRes.data || []);
    setPlans(plansRes.data || []);
    setProfile(profileRes.data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("property_listings").delete().eq("id", id);
    toast({ title: "Listing deleted" });
    fetchAll();
  };

  const handleSponsor = async (listingId: string, plan: any) => {
    const now = new Date();
    const expires = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("sponsorships").insert({
      user_id: user!.id,
      listing_id: listingId,
      plan_name: plan.name,
      amount: plan.price,
      duration_days: plan.duration_days,
      status: "pending",
      payment_status: "pending",
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sponsorship requested!", description: "Admin will review your sponsorship request." });
    fetchAll();
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id);
    fetchAll();
  };

  const stats = [
    { label: "Total Listings", value: listings.length, icon: Home, color: "text-blue-500" },
    { label: "Approved", value: listings.filter(l => l.status === "approved").length, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Pending Review", value: listings.filter(l => l.status === "pending").length, icon: Clock, color: "text-amber-500" },
    { label: "Active Sponsors", value: sponsorships.filter(s => s.status === "active").length, icon: Crown, color: "text-gold" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
      suspended: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "listings", label: "My Listings", icon: Home },
    { id: "sponsorships", label: "Sponsorships", icon: Crown },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Welcome back</p>
                <h1 className="text-3xl font-display font-bold text-white">{profile?.full_name || user?.email}</h1>
                <p className="text-white/50 text-xs mt-1 capitalize">{role} Account</p>
              </div>
              <div className="flex gap-3">
                <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Post Property
                </Link>
                {(role === "admin" || role === "moderator") && (
                  <Link to="/admin" className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Star className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-card rounded-2xl border border-border p-3 space-y-1 sticky top-24">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge ? <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span> : null}
                  </button>
                ))}
                <div className="pt-2 border-t border-border">
                  <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Overview */}
                  {tab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map(s => (
                          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                            <div className="flex items-center justify-between mb-3">
                              <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-display font-bold">{s.value}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-display font-semibold mb-4">Recent Listings</h3>
                        {listings.length === 0 ? (
                          <div className="text-center py-8">
                            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground mb-4">No listings yet</p>
                            <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium">Post Your First Property</Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {listings.slice(0, 5).map(l => (
                              <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                  <Home className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{l.title}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{l.locality}, {l.city}
                                  </p>
                                </div>
                                <span className={statusBadge(l.status)}>{l.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick tip for pending */}
                      {listings.some(l => l.status === "pending") && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-amber-700 dark:text-amber-400">Listing Pending Approval</p>
                            <p className="text-xs text-amber-600/70 mt-0.5">Your listing is under review. Admin typically approves within 24 hours.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* My Listings */}
                  {tab === "listings" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-display font-bold">My Listings</h2>
                        <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Add New
                        </Link>
                      </div>
                      {listings.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-12 text-center">
                          <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-display font-semibold mb-2">No listings yet</h3>
                          <p className="text-muted-foreground text-sm mb-6">Post your first property and reach thousands of buyers!</p>
                          <Link to="/post-property" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-medium">Post Property — FREE</Link>
                        </div>
                      ) : (
                        listings.map(l => (
                          <div key={l.id} className="bg-card rounded-2xl border border-border p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-display font-semibold truncate">{l.title}</h3>
                                  <span className={statusBadge(l.status)}>{l.status}</span>
                                  {l.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-amber-600 border border-gold/20">Sponsored</span>}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                  <MapPin className="w-3 h-3" />{l.locality}, {l.city}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>₹{Number(l.price).toLocaleString()}</span>
                                  <span>{l.property_type}</span>
                                  {l.bedrooms && <span>{l.bedrooms} BHK</span>}
                                  <span>{l.area} {l.area_unit}</span>
                                </div>
                                {l.status === "rejected" && l.admin_note && (
                                  <div className="mt-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                                    <p className="text-xs text-red-600">Admin note: {l.admin_note}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {l.status === "approved" && !sponsorships.some(s => s.listing_id === l.id && s.status === "active") && (
                                  <button
                                    onClick={() => setTab("sponsorships")}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/10 text-amber-600 border border-gold/20 hover:bg-gold/20 transition-colors flex items-center gap-1"
                                  >
                                    <Crown className="w-3 h-3" /> Sponsor
                                  </button>
                                )}
                                <button onClick={() => handleDelete(l.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sponsorships */}
                  {tab === "sponsorships" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-display font-bold">Sponsorship & Promotion</h2>

                      {/* Plans */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">Choose a plan to boost your approved listings to the top of search results.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {plans.map((plan, i) => (
                            <div key={plan.id} className={`bg-card rounded-2xl border p-6 ${i === 1 ? "border-accent shadow-lg relative" : "border-border"}`}>
                              {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-gold rounded-full text-xs font-bold text-navy">Most Popular</div>}
                              <h3 className="font-display font-bold text-lg mb-1">{plan.display_name}</h3>
                              <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                              <p className="text-3xl font-display font-bold text-accent mb-1">₹{Number(plan.price).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground mb-4">for {plan.duration_days} days</p>
                              <ul className="space-y-2 mb-5">
                                {plan.features?.map((f: string) => (
                                  <li key={f} className="flex items-center gap-2 text-xs">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                              {/* Listing selector */}
                              <div className="space-y-2">
                                {listings.filter(l => l.status === "approved").length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2">Get a listing approved first</p>
                                ) : (
                                  listings.filter(l => l.status === "approved").map(l => (
                                    <button
                                      key={l.id}
                                      onClick={() => handleSponsor(l.id, plan)}
                                      disabled={sponsorships.some(s => s.listing_id === l.id && ["pending", "active"].includes(s.status))}
                                      className="w-full text-xs px-3 py-2 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sponsorships.some(s => s.listing_id === l.id && ["pending", "active"].includes(s.status))
                                        ? `✓ ${l.title.slice(0, 30)}... (already sponsored)`
                                        : `Sponsor: ${l.title.slice(0, 30)}...`}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* My sponsorships */}
                      {sponsorships.length > 0 && (
                        <div>
                          <h3 className="font-display font-semibold mb-3">My Sponsorships</h3>
                          <div className="space-y-3">
                            {sponsorships.map(s => (
                              <div key={s.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                                <Crown className="w-8 h-8 text-gold flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{s.property_listings?.title}</p>
                                  <p className="text-xs text-muted-foreground">{s.plan_name} plan · {s.duration_days} days · ₹{Number(s.amount).toLocaleString()}</p>
                                </div>
                                <span className={statusBadge(s.status)}>{s.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notifications */}
                  {tab === "notifications" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-display font-bold">Notifications</h2>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-sm text-accent hover:underline">Mark all read</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-12 text-center">
                          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`bg-card rounded-2xl border p-4 flex items-start gap-3 ${!n.is_read ? "border-accent/30 bg-accent/5" : "border-border"}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-accent" : "bg-muted"}`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Profile */}
                  {tab === "profile" && (
                    <div className="bg-card rounded-2xl border border-border p-6">
                      <h2 className="text-xl font-display font-bold mb-6">My Profile</h2>
                      <div className="space-y-4 max-w-lg">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Full Name</label>
                          <p className="px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm">{profile?.full_name || "—"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Email</label>
                          <p className="px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm">{user?.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Phone</label>
                          <p className="px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm">{profile?.phone || "Not added"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Role</label>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize">{role}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Member Since</label>
                          <p className="px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
