import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, Plus, Bell, Clock, CheckCircle, XCircle, Zap, TrendingUp,
  MapPin, Star, Eye, Edit, Trash2, ChevronRight, DollarSign, User, LogOut, Crown,
  Activity, RefreshCw, Camera, CreditCard, AlertCircle, FileText, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: "Under Review", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", emoji: "⏳" },
  approved: { label: "Live", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", emoji: "✅" },
  rejected: { label: "Changes Needed", color: "bg-red-500/10 text-red-600 border-red-500/20", emoji: "❌" },
  suspended: { label: "Suspended", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", emoji: "🚫" },
};

const STRIPE_PLANS = [
  { name: "basic", priceId: "price_1T2lRSIk4qgoIBK1Bixe90ur", duration: 7, amount: 499, label: "Basic Boost" },
  { name: "standard", priceId: "price_1T2lS6Ik4qgoIBK1UGLy8JPg", duration: 30, amount: 1499, label: "Standard Spotlight" },
  { name: "premium", priceId: "price_1T2lSzIk4qgoIBK1VlktvDrM", duration: 60, amount: 3499, label: "Premium Showcase" },
];

const UserDashboard = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [listings, setListings] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sponsorLoading, setSponsorLoading] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", city: "", bio: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    if (role === "agent") {
      navigate("/agent-dashboard", { replace: true });
      return;
    }

    if (role === "admin" || role === "moderator") {
      navigate("/admin", { replace: true });
      return;
    }

    fetchAll();

    const sponsorStatus = searchParams.get("sponsorship");
    const listingId = searchParams.get("listing");
    if (sponsorStatus === "success" && listingId) {
      const sessionId = localStorage.getItem("pendingCheckoutSession");
      if (sessionId) {
        verifyPayment(sessionId);
        localStorage.removeItem("pendingCheckoutSession");
      }
      toast({ title: "🎉 Payment Successful!", description: "Your sponsorship is being activated." });
      setTab("sponsorships");
    } else if (sponsorStatus === "cancelled") {
      toast({ title: "Payment cancelled", description: "Your sponsorship was not activated.", variant: "destructive" });
    }

    const notifSub = supabase
      .channel(`user-notifs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        toast({ title: (payload.new as any).title, description: (payload.new as any).message });
      })
      .subscribe();

    return () => { supabase.removeChannel(notifSub); };
  }, [user, role, authLoading]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data } = await supabase.functions.invoke("verify-sponsorship-payment", {
        body: { sessionId },
      });
      if (data?.success) {
        toast({ title: "✅ Sponsorship Activated!", description: "Your listing is now featured." });
        fetchAll();
      }
    } catch (e) {
      console.error("Payment verification error:", e);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    const [listRes, sponsorRes, notifRes, plansRes, profileRes] = await Promise.all([
      supabase.from("property_listings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("sponsorships").select("*, property_listings(title, city)").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("sponsorship_plans").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    ]);
    setListings(listRes.data || []);
    setSponsorships(sponsorRes.data || []);
    setNotifications(notifRes.data || []);
    setPlans(plansRes.data || []);
    const p = profileRes.data;
    setProfile(p);
    if (p) setProfileForm({ full_name: p.full_name || "", phone: p.phone || "", city: p.city || "", bio: p.bio || "" });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    await supabase.from("property_listings").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Listing deleted" });
    fetchAll();
  };

  const handleStripeCheckout = async (listingId: string, plan: typeof STRIPE_PLANS[0]) => {
    setSponsorLoading(listingId + plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("create-sponsorship-checkout", {
        body: {
          priceId: plan.priceId,
          listingId,
          planName: plan.name,
          durationDays: plan.duration,
          amount: plan.amount,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to create checkout");
      // Store session for verification on return
      if (data.sessionId) localStorage.setItem("pendingCheckoutSession", data.sessionId);
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Payment Error", description: e.message, variant: "destructive" });
    } finally {
      setSponsorLoading(null);
    }
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id);
    fetchAll();
  };

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update(profileForm).eq("user_id", user!.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile updated!" });
    setEditProfile(false);
    fetchAll();
  };

  const stats = [
    { label: "Total Listings", value: listings.length, icon: Home, color: "text-blue-500", sub: "All properties" },
    { label: "Live", value: listings.filter(l => l.status === "approved").length, icon: CheckCircle, color: "text-emerald-500", sub: "Publicly visible" },
    { label: "Under Review", value: listings.filter(l => l.status === "pending").length, icon: Clock, color: "text-amber-500", sub: "Awaiting admin" },
    { label: "Sponsored", value: sponsorships.filter(s => s.status === "active").length, icon: Crown, color: "text-yellow-500", sub: "Featured listings" },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "listings", label: "My Listings", icon: Home, badge: listings.filter(l => l.status === "pending").length },
    { id: "sponsorships", label: "Boost Listing", icon: Crown },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "profile", label: "My Profile", icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-display font-bold hidden sm:inline">PropEstate</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post Property
            </Link>
            {(role === "admin" || role === "moderator") && (
              <Link to="/admin" className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Star className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center">
                <span className="text-white text-xs font-bold">{(profile?.full_name || user?.email || "U")[0].toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-navy rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Welcome back 👋</p>
              <h1 className="text-2xl font-display font-bold text-white">{profile?.full_name || user?.email?.split("@")[0]}</h1>
              <p className="text-white/50 text-xs mt-1 capitalize">{role} Account · Member since {new Date(user?.created_at || "").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <div className="bg-card rounded-2xl border border-border p-3 space-y-0.5 sticky top-24">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
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

          {/* Mobile tab strip */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-40">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium relative transition-colors ${tab === item.id ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label.split(" ")[0]}</span>
                {item.badge ? <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span> : null}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-20 md:pb-0">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                      <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                      <p className="text-2xl font-display font-bold">{s.value}</p>
                      <p className="text-sm font-medium mt-0.5">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Listings */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold">My Properties</h3>
                    <button onClick={() => setTab("listings")} className="text-xs text-accent hover:underline">View all →</button>
                  </div>
                  {listings.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4 text-sm">No listings yet. Post for FREE!</p>
                      <Link to="/post-property" className="btn-gold px-4 py-2 rounded-xl text-sm font-medium">Post Your First Property</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.slice(0, 4).map(l => {
                        const sc = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
                        return (
                          <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                              {sc.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{l.title}</p>
                              <p className="text-xs text-muted-foreground">{l.locality}, {l.city} · ₹{Number(l.price).toLocaleString('en-IN')}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Status info */}
                {listings.some(l => l.status === "pending") && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-amber-700 dark:text-amber-400">Listing Under Review</p>
                      <p className="text-xs text-amber-600/70 mt-0.5">Admin typically reviews within 24 hours. You'll get a notification once it's live.</p>
                    </div>
                  </div>
                )}
                {listings.some(l => l.status === "rejected") && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-red-700 dark:text-red-400">Listing Requires Changes</p>
                      <p className="text-xs text-red-600/70 mt-0.5">Check admin notes in your listings tab and resubmit after making changes.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY LISTINGS */}
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
                    <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display font-semibold mb-2">No listings yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">Post your first property and reach thousands of buyers!</p>
                    <Link to="/post-property" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-medium">Post Property — FREE</Link>
                  </div>
                ) : (
                  listings.map(l => {
                    const sc = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
                    const hasActiveSponsor = sponsorships.some(s => s.listing_id === l.id && s.status === "active");
                    return (
                      <div key={l.id} className={`bg-card rounded-2xl border p-5 transition-all ${l.status === "pending" ? "border-amber-500/30" : l.status === "rejected" ? "border-red-500/30" : "border-border"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-lg">{sc.emoji}</span>
                              <h3 className="font-display font-semibold truncate">{l.title}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>{sc.label}</span>
                              {hasActiveSponsor && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">⭐ Featured</span>}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" />{l.locality}, {l.city}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="font-semibold text-foreground">₹{Number(l.price).toLocaleString('en-IN')}</span>
                              <span>{l.property_type}</span>
                              {l.bedrooms && <span>{l.bedrooms} BHK</span>}
                              {l.area && <span>{l.area} {l.area_unit}</span>}
                              <span>{new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                            </div>
                            {l.status === "rejected" && l.admin_note && (
                              <div className="mt-2 p-2.5 bg-red-500/5 rounded-xl border border-red-500/10">
                                <p className="text-xs text-red-600 font-medium">📋 Admin note: {l.admin_note}</p>
                                <p className="text-xs text-red-500/70 mt-0.5">Please make the required changes and submit a new listing.</p>
                              </div>
                            )}
                            {l.status === "pending" && (
                              <div className="mt-2 p-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                <p className="text-xs text-amber-600">⏳ Under review — typically approved within 24 hours</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-col">
                            {l.status === "approved" && !hasActiveSponsor && (
                              <button onClick={() => setTab("sponsorships")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors flex items-center gap-1 whitespace-nowrap">
                                <Crown className="w-3 h-3" /> Boost Listing
                              </button>
                            )}
                            {l.status === "approved" && (
                              <Link to={`/property/${l.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View Live
                              </Link>
                            )}
                            <button onClick={() => handleDelete(l.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SPONSORSHIPS / BOOST */}
            {tab === "sponsorships" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-display font-bold">Boost Your Listing</h2>
                  <p className="text-sm text-muted-foreground mt-1">Feature your approved listings at the top of search results with Stripe-secured payments.</p>
                </div>

                {/* Active Sponsorships */}
                {sponsorships.filter(s => s.status === "active").length > 0 && (
                  <div className="bg-card rounded-2xl border border-yellow-500/30 p-5">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" /> Active Sponsorships
                    </h3>
                    <div className="space-y-2">
                      {sponsorships.filter(s => s.status === "active").map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{s.property_listings?.title}</p>
                            <p className="text-xs text-muted-foreground">{s.plan_name} · Expires {new Date(s.expires_at).toLocaleDateString('en-IN')}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plans */}
                {listings.filter(l => l.status === "approved").length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-10 text-center">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-display font-semibold mb-2">No approved listings yet</h3>
                    <p className="text-muted-foreground text-sm">Get your listing approved first, then you can boost it.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {plans.map((plan, i) => {
                      const stripePlan = STRIPE_PLANS.find(p => p.name === plan.name);
                      return (
                        <div key={plan.id} className={`bg-card rounded-2xl border p-6 relative ${i === 1 ? "border-accent shadow-lg" : "border-border"}`}>
                          {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-gold rounded-full text-xs font-bold text-navy">Most Popular</div>}
                          <h3 className="font-display font-bold text-lg mb-1">{plan.display_name}</h3>
                          <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                          <p className="text-3xl font-display font-bold text-accent mb-1">₹{Number(plan.price).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground mb-4">for {plan.duration_days} days · Secure via Stripe</p>
                          <ul className="space-y-2 mb-5">
                            {plan.features?.map((f: string) => (
                              <li key={f} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="space-y-2">
                            {listings.filter(l => l.status === "approved").map(l => {
                              const alreadySponsored = sponsorships.some(s => s.listing_id === l.id && ["pending", "active"].includes(s.status));
                              const isLoading = sponsorLoading === l.id + plan.name;
                              return (
                                <button
                                  key={l.id}
                                  onClick={() => stripePlan && handleStripeCheckout(l.id, stripePlan)}
                                  disabled={alreadySponsored || isLoading || !stripePlan}
                                  className="w-full text-xs px-3 py-2.5 rounded-xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:border-accent hover:bg-accent/5 border-border"
                                >
                                  {isLoading ? (
                                    <><div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" /> Processing...</>
                                  ) : (
                                    <><CreditCard className="w-3 h-3 text-muted-foreground flex-shrink-0" /><span className="truncate">{alreadySponsored ? `${l.title} (Active)` : `Pay & Boost: ${l.title}`}</span></>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sponsorship history */}
                {sponsorships.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="font-display font-semibold mb-3 text-sm">Payment History</h3>
                    <div className="space-y-2">
                      {sponsorships.map(s => (
                        <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                          <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{s.property_listings?.title}</p>
                            <p className="text-xs text-muted-foreground">{s.plan_name} · {new Date(s.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold">₹{Number(s.amount).toLocaleString('en-IN')}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-500/10 text-emerald-600" : s.payment_status === "pending" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                              {s.status === "active" ? "Active" : s.payment_status === "pending" ? "Pending" : s.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === "notifications" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">Notifications</h2>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent hover:underline">Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`bg-card rounded-2xl border p-4 flex items-start gap-3 transition-all ${!n.is_read ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${n.type === "success" ? "bg-emerald-500/10" : n.type === "error" ? "bg-red-500/10" : "bg-blue-500/10"}`}>
                        {n.type === "success" ? "🎉" : n.type === "error" ? "⚠️" : "ℹ️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PROFILE */}
            {tab === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">My Profile</h2>
                  <button onClick={() => setEditProfile(!editProfile)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                    {editProfile ? "Cancel" : "Edit Profile"}
                  </button>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-navy flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">{(profile?.full_name || user?.email || "U")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">{profile?.full_name || "No name set"}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">{role}</span>
                    </div>
                  </div>
                  {editProfile ? (
                    <div className="space-y-4">
                      {[
                        { label: "Full Name", key: "full_name", placeholder: "Your full name" },
                        { label: "Phone Number", key: "phone", placeholder: "+91 98765 43210" },
                        { label: "City", key: "city", placeholder: "e.g. Mumbai" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                          <input
                            value={(profileForm as any)[f.key]}
                            onChange={e => setProfileForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell buyers/tenants about yourself..."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <button onClick={saveProfile} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: "Email", value: user?.email },
                        { label: "Phone", value: profile?.phone || "Not set" },
                        { label: "City", value: profile?.city || "Not set" },
                        { label: "Bio", value: profile?.bio || "No bio added" },
                      ].map(f => (
                        <div key={f.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">{f.label}</span>
                          <span className="text-sm font-medium text-right max-w-xs">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">Account Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Properties Listed", value: listings.length },
                      { label: "Live Listings", value: listings.filter(l => l.status === "approved").length },
                      { label: "Total Spent on Boosts", value: `₹${sponsorships.filter(s => s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString('en-IN')}` },
                      { label: "Member Since", value: new Date(user?.created_at || "").toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-display font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
