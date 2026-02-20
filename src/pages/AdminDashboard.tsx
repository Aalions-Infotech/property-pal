import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Home, Users, Crown, Bell, BarChart3, Settings,
  CheckCircle, XCircle, Clock, Eye, Trash2, LogOut, Star,
  TrendingUp, DollarSign, MapPin, Building2, Shield, AlertTriangle,
  ChevronDown, Search, Filter, RefreshCw, Zap, Activity, Database,
  Edit, Lock, Unlock, Award, FileText, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user, isAdmin, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [realtimeAlerts, setRealtimeAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!isAdmin) { navigate("/dashboard"); return; }
    fetchAll();

    // Realtime subscriptions for admin alerts
    const listingSub = supabase
      .channel("admin-listings")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "property_listings" }, (payload) => {
        setRealtimeAlerts(prev => [`🏠 New listing submitted: "${payload.new.title}"`, ...prev.slice(0, 9)]);
        setListings(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const sponsorSub = supabase
      .channel("admin-sponsorships")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sponsorships" }, (payload) => {
        setRealtimeAlerts(prev => [`💰 New sponsorship payment received`, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listingSub);
      supabase.removeChannel(sponsorSub);
    };
  }, [user, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [listRes, profileRes, rolesRes, sponsorRes, plansRes, notifRes] = await Promise.all([
      supabase.from("property_listings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("sponsorships").select("*, property_listings(title, city)").order("created_at", { ascending: false }),
      supabase.from("sponsorship_plans").select("*").order("sort_order"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setListings(listRes.data || []);
    setUsers(profileRes.data || []);
    setUserRoles(rolesRes.data || []);
    setSponsorships(sponsorRes.data || []);
    setPlans(plansRes.data || []);
    setNotifications(notifRes.data || []);
    setLoading(false);
  };

  const approveListing = async (id: string) => {
    const { error } = await supabase.from("property_listings").update({
      status: "approved",
      is_verified: true,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      admin_note: null,
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const listing = listings.find(l => l.id === id);
    if (listing) {
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        title: "🎉 Listing Approved & Live!",
        message: `Your listing "${listing.title}" has been approved and is now visible to millions of buyers/tenants.`,
        type: "success",
        link: `/property/${id}`,
      });
      await supabase.from("admin_activity_log").insert({
        admin_id: user!.id,
        action: "approve_listing",
        entity_type: "property_listing",
        entity_id: id,
        details: { title: listing.title },
      });
    }
    toast({ title: "✅ Listing approved and is now live!" });
    fetchAll();
    setReviewingId(null);
  };

  const rejectListing = async (id: string, note: string) => {
    if (!note.trim()) { toast({ title: "Please provide a rejection reason", variant: "destructive" }); return; }
    await supabase.from("property_listings").update({
      status: "rejected",
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      admin_note: note,
    }).eq("id", id);
    const listing = listings.find(l => l.id === id);
    if (listing) {
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        title: "📋 Listing Requires Changes",
        message: `Your listing "${listing.title}" needs changes. Admin note: ${note}`,
        type: "error",
      });
    }
    toast({ title: "Listing rejected with note" });
    fetchAll();
    setReviewingId(null);
    setReviewNote("");
  };

  const suspendListing = async (id: string) => {
    await supabase.from("property_listings").update({ status: "suspended" }).eq("id", id);
    toast({ title: "Listing suspended" });
    fetchAll();
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Permanently delete this listing? This cannot be undone.")) return;
    await supabase.from("property_listings").delete().eq("id", id);
    await supabase.from("admin_activity_log").insert({
      admin_id: user!.id,
      action: "delete_listing",
      entity_type: "property_listing",
      entity_id: id,
    });
    toast({ title: "Listing permanently deleted" });
    fetchAll();
  };

  const featureListing = async (id: string, featured: boolean) => {
    await supabase.from("property_listings").update({ is_featured: featured }).eq("id", id);
    toast({ title: featured ? "Listing featured!" : "Feature removed" });
    fetchAll();
  };

  const activateSponsorship = async (id: string) => {
    const s = sponsorships.find(x => x.id === id);
    const now = new Date();
    const expires = new Date(now.getTime() + (s?.duration_days || 30) * 24 * 60 * 60 * 1000);
    await supabase.from("sponsorships").update({
      status: "active",
      payment_status: "completed",
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }).eq("id", id);
    if (s?.listing_id) {
      await supabase.from("property_listings").update({ is_featured: true }).eq("id", s.listing_id);
      await supabase.from("notifications").insert({
        user_id: s.user_id,
        title: "🚀 Sponsorship Activated!",
        message: `Your ${s.plan_name} sponsorship is now active until ${expires.toLocaleDateString('en-IN')}.`,
        type: "success",
      });
    }
    toast({ title: "Sponsorship activated!" });
    fetchAll();
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any, assigned_by: user!.id });
    await supabase.from("admin_activity_log").insert({
      admin_id: user!.id,
      action: "change_user_role",
      entity_type: "user",
      entity_id: userId,
      details: { new_role: newRole },
    });
    toast({ title: `User role updated to ${newRole}` });
    fetchAll();
  };

  const sendNotificationToUser = async (userId: string, title: string, message: string) => {
    await supabase.from("notifications").insert({ user_id: userId, title, message, type: "info" });
    toast({ title: "Notification sent!" });
  };

  // Stats
  const pendingCount = listings.filter(l => l.status === "pending").length;
  const approvedCount = listings.filter(l => l.status === "approved").length;
  const totalRevenue = sponsorships.filter(s => s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0);
  const activeSponsors = sponsorships.filter(s => s.status === "active").length;

  const stats = [
    { label: "Total Listings", value: listings.length, sub: `${approvedCount} live`, icon: Home, color: "from-blue-500/20 to-blue-600/5", to: "listings" },
    { label: "Pending Review", value: pendingCount, sub: pendingCount > 0 ? "⚠️ Needs attention" : "All clear", icon: Clock, color: "from-amber-500/20 to-amber-600/5", urgent: pendingCount > 0, to: "listings" },
    { label: "Registered Users", value: users.length, sub: `${userRoles.filter(r => r.role === "admin").length} admins`, icon: Users, color: "from-emerald-500/20 to-emerald-600/5", to: "users" },
    { label: "Revenue (INR)", value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: `${activeSponsors} active sponsors`, icon: DollarSign, color: "from-yellow-500/20 to-yellow-600/5", to: "sponsorships" },
  ];

  const filteredListings = listings.filter(l => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.city?.toLowerCase().includes(searchQuery.toLowerCase()) || l.locality?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
      suspended: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`;
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "listings", label: "Listings", icon: Home, badge: pendingCount },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "sponsorships", label: "Sponsorships", icon: Crown },
    { id: "realtime", label: "Live Alerts", icon: Activity, badge: realtimeAlerts.length },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "plans", label: "Pricing Plans", icon: DollarSign },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-navy flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">PropEstate</span>
          </Link>
          <div className="mt-3 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-primary flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin Control Panel
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 flex-shrink-0">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all hover:text-foreground">
            <Home className="w-4 h-4" /> View Site
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all hover:text-foreground">
            <LayoutDashboard className="w-4 h-4" /> User Dashboard
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl">{navItems.find(n => n.id === tab)?.label}</h1>
            <p className="text-xs text-muted-foreground">PropEstate Admin · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {realtimeAlerts.length > 0 && (
              <button
                onClick={() => setTab("realtime")}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {realtimeAlerts.length} New Alert{realtimeAlerts.length > 1 ? "s" : ""}
              </button>
            )}
            <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.email?.[0]?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setTab(s.to)}
                    className={`bg-gradient-to-br ${s.color} rounded-2xl border border-border p-5 text-left hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <s.icon className="w-5 h-5 text-foreground/70" />
                      {(s as any).urgent && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-3xl font-display font-bold">{s.value}</p>
                    <p className="text-sm font-medium mt-0.5">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </button>
                ))}
              </div>

              {/* Realtime alerts preview */}
              {realtimeAlerts.length > 0 && (
                <div className="bg-card rounded-2xl border border-primary/30 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <h3 className="font-display font-semibold text-sm">Live Activity Feed</h3>
                    </div>
                    <button onClick={() => setRealtimeAlerts([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                  </div>
                  <div className="space-y-2">
                    {realtimeAlerts.slice(0, 4).map((alert, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                        {alert}
                        <span className="ml-auto text-[10px] opacity-60">just now</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Approvals urgent */}
              {pendingCount > 0 && (
                <div className="bg-card rounded-2xl border border-amber-500/30 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display font-semibold">Pending Approvals ({pendingCount})</h3>
                    <span className="ml-auto text-xs text-amber-600 font-medium">Action required</span>
                  </div>
                  <div className="space-y-3">
                    {listings.filter(l => l.status === "pending").slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{l.title}</p>
                          <p className="text-xs text-muted-foreground">{l.locality}, {l.city} · {l.property_type} · ₹{Number(l.price).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approveListing(l.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => { setReviewingId(l.id); setTab("listings"); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingCount > 5 && (
                    <button onClick={() => setTab("listings")} className="mt-3 text-accent text-sm hover:underline">View all {pendingCount} pending →</button>
                  )}
                </div>
              )}

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-display font-semibold mb-3 text-sm">Listing Status Breakdown</h3>
                  {["approved", "pending", "rejected", "suspended"].map(s => (
                    <div key={s} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className={statusBadge(s)}>{s}</span>
                      <span className="font-semibold text-sm">{listings.filter(l => l.status === s).length}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-display font-semibold mb-3 text-sm">User Roles Distribution</h3>
                  {["admin", "moderator", "agent", "user"].map(r => (
                    <div key={r} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm capitalize text-muted-foreground">{r}s</span>
                      <span className="font-semibold text-sm">{userRoles.filter(ur => ur.role === r).length}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-display font-semibold mb-3 text-sm">Sponsorship Revenue</h3>
                  {plans.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{p.display_name}</span>
                      <span className="font-semibold text-sm text-accent">₹{sponsorships.filter(s => s.plan_name === p.name && s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between font-bold text-sm border-t border-border mt-1">
                    <span>Total Revenue</span>
                    <span className="text-accent">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LISTINGS TAB */}
          {tab === "listings" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title, city, locality..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "pending", "approved", "rejected", "suspended"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {s} {s !== "all" && <span className="ml-1 opacity-60">({listings.filter(l => l.status === s).length})</span>}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{filteredListings.length} listings found</p>

              <div className="space-y-3">
                {filteredListings.map(l => (
                  <div key={l.id} className={`bg-card rounded-2xl border p-5 ${l.status === "pending" ? "border-amber-500/30" : "border-border"}`}>
                    {reviewingId === l.id ? (
                      <div className="space-y-3">
                        <p className="font-medium text-sm">Rejection reason for: <strong>{l.title}</strong></p>
                        <textarea
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="Explain why this listing is being rejected..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => rejectListing(l.id, reviewNote)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Confirm Reject</button>
                          <button onClick={() => { setReviewingId(null); setReviewNote(""); }} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display font-semibold text-sm truncate">{l.title}</h3>
                            <span className={statusBadge(l.status)}>{l.status}</span>
                            {l.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">⭐ Featured</span>}
                            {l.is_verified && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">✓ Verified</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{l.locality}, {l.city} · {l.property_type} · {l.listing_type}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">₹{Number(l.price).toLocaleString('en-IN')}</span>
                            {l.bedrooms && <span>{l.bedrooms} BHK</span>}
                            {l.area && <span>{l.area} {l.area_unit}</span>}
                            <span>{new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                          {l.admin_note && (
                            <div className="mt-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                              <p className="text-xs text-red-600">Admin note: {l.admin_note}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                          {l.status === "pending" && (
                            <>
                              <button onClick={() => approveListing(l.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">✓ Approve</button>
                              <button onClick={() => setReviewingId(l.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors">✗ Reject</button>
                            </>
                          )}
                          {l.status === "approved" && (
                            <button onClick={() => suspendListing(l.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20 transition-colors">Suspend</button>
                          )}
                          {l.status === "suspended" && (
                            <button onClick={() => approveListing(l.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Restore</button>
                          )}
                          <button onClick={() => featureListing(l.id, !l.is_featured)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${l.is_featured ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                            {l.is_featured ? "⭐ Unfeature" : "☆ Feature"}
                          </button>
                          <button onClick={() => deleteListing(l.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredListings.length === 0 && (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No listings found for current filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === "users" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{users.length} registered users</p>
              <div className="space-y-3">
                {users.map(u => {
                  const ur = userRoles.find(r => r.user_id === u.user_id);
                  const userListings = listings.filter(l => l.user_id === u.user_id);
                  return (
                    <div key={u.id} className="bg-card rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-navy flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{u.full_name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{userListings.length} listings</span>
                            <span>{u.city || "No city"}</span>
                            <span>{new Date(u.created_at).toLocaleDateString('en-IN')}</span>
                            {u.is_verified && <span className="text-emerald-500">✓ Verified</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={ur?.role || "user"}
                            onChange={e => changeUserRole(u.user_id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium outline-none focus:ring-2 focus:ring-accent"
                          >
                            {["user", "agent", "moderator", "admin"].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPONSORSHIPS TAB */}
          {tab === "sponsorships" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {["pending", "active", "expired"].map(s => (
                  <div key={s} className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-2xl font-display font-bold">{sponsorships.filter(sp => sp.status === s).length}</p>
                    <p className="text-sm text-muted-foreground capitalize">{s} Sponsorships</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {sponsorships.map(s => (
                  <div key={s.id} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{s.property_listings?.title || "Unknown listing"}</p>
                          <span className={statusBadge(s.status)}>{s.status}</span>
                          <span className={statusBadge(s.payment_status)}>{s.payment_status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.plan_name} · {s.duration_days} days · ₹{Number(s.amount).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.starts_at && `Active: ${new Date(s.starts_at).toLocaleDateString('en-IN')} → `}
                          {s.expires_at && new Date(s.expires_at).toLocaleDateString('en-IN')}
                        </p>
                        {s.checkout_session_id && <p className="text-xs text-muted-foreground mt-0.5">Stripe: {s.checkout_session_id.substring(0, 20)}...</p>}
                      </div>
                      {s.status === "pending" && (
                        <button onClick={() => activateSponsorship(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 flex-shrink-0">
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sponsorships.length === 0 && (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No sponsorships yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REALTIME ALERTS */}
          {tab === "realtime" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="font-display font-bold">Live Activity Feed</h2>
                <button onClick={() => setRealtimeAlerts([])} className="ml-auto text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1 rounded-lg">Clear All</button>
              </div>
              {realtimeAlerts.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No live alerts yet. New listings, sponsorships, and user actions will appear here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {realtimeAlerts.map((alert, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                      <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                      <p className="text-sm flex-1">{alert}</p>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === "notifications" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{notifications.length} notifications sent</p>
              <div className="space-y-3">
                {notifications.slice(0, 30).map(n => (
                  <div key={n.id} className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${n.type === "success" ? "bg-emerald-500/10 text-emerald-500" : n.type === "error" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                        {n.type === "success" ? "✓" : n.type === "error" ? "✗" : "ℹ"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.is_read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        {n.is_read ? "read" : "unread"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRICING PLANS */}
          {tab === "plans" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan, i) => (
                  <div key={plan.id} className={`bg-card rounded-2xl border p-6 ${i === 1 ? "border-accent" : "border-border"}`}>
                    <h3 className="font-display font-bold text-lg mb-1">{plan.display_name}</h3>
                    <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                    <p className="text-3xl font-display font-bold text-accent mb-1">₹{Number(plan.price).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground mb-3">for {plan.duration_days} days</p>
                    {plan.stripe_price_id && <p className="text-xs text-muted-foreground mb-3 font-mono bg-muted/50 px-2 py-1 rounded">Stripe: {plan.stripe_price_id}</p>}
                    <ul className="space-y-1.5 mb-4">
                      {plan.features?.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{sponsorships.filter(s => s.plan_name === plan.name).length} total purchases</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plan.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{plan.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === "settings" && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-bold mb-4">Admin Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Admin Email</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{role}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">WhatsApp Support Number</p>
                      <p className="text-xs text-muted-foreground">Currently: +91 99999 99999 (update in code)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-bold mb-4">Platform Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Listings", val: listings.length },
                    { label: "Approved", val: approvedCount },
                    { label: "Total Users", val: users.length },
                    { label: "Total Revenue", val: `₹${totalRevenue.toLocaleString('en-IN')}` },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-display font-bold">{s.val}</p>
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
  );
};

export default AdminDashboard;
