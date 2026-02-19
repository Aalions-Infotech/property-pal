import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Home, Users, Crown, Bell, BarChart3, Settings,
  CheckCircle, XCircle, Clock, Eye, Trash2, LogOut, Star,
  TrendingUp, DollarSign, MapPin, Building2, Shield, AlertTriangle,
  ChevronDown, Search, Filter, RefreshCw
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
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!isAdmin) { navigate("/dashboard"); return; }
    fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [listRes, profileRes, rolesRes, sponsorRes, plansRes] = await Promise.all([
      supabase.from("property_listings").select("*, profiles(full_name, email)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("sponsorships").select("*, property_listings(title, city), profiles(full_name)").order("created_at", { ascending: false }),
      supabase.from("sponsorship_plans").select("*").order("sort_order"),
    ]);
    setListings(listRes.data || []);
    setUsers(profileRes.data || []);
    setUserRoles(rolesRes.data || []);
    setSponsorships(sponsorRes.data || []);
    setPlans(plansRes.data || []);
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
    // Send notification to user
    const listing = listings.find(l => l.id === id);
    if (listing) {
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        title: "Listing Approved! 🎉",
        message: `Your listing "${listing.title}" has been approved and is now live.`,
        type: "success",
        link: `/property/${id}`,
      });
    }
    toast({ title: "Listing approved and is now live!" });
    fetchAll();
    setReviewingId(null);
  };

  const rejectListing = async (id: string, note: string) => {
    if (!note.trim()) { toast({ title: "Please provide a rejection reason", variant: "destructive" }); return; }
    const { error } = await supabase.from("property_listings").update({
      status: "rejected",
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      admin_note: note,
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const listing = listings.find(l => l.id === id);
    if (listing) {
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        title: "Listing Requires Changes",
        message: `Your listing "${listing.title}" was not approved. Reason: ${note}`,
        type: "error",
      });
    }
    toast({ title: "Listing rejected" });
    fetchAll();
    setReviewingId(null);
    setReviewNote("");
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Permanently delete this listing?")) return;
    await supabase.from("property_listings").delete().eq("id", id);
    toast({ title: "Listing deleted" });
    fetchAll();
  };

  const approveSponsorship = async (id: string) => {
    const s = sponsorships.find(x => x.id === id);
    await supabase.from("sponsorships").update({ status: "active", payment_status: "completed" }).eq("id", id);
    if (s) {
      await supabase.from("property_listings").update({ is_featured: true }).eq("id", s.listing_id);
      await supabase.from("notifications").insert({
        user_id: s.user_id,
        title: "Sponsorship Activated! 🚀",
        message: `Your ${s.plan_name} sponsorship is now active. Your listing will appear at the top of search results.`,
        type: "success",
      });
    }
    toast({ title: "Sponsorship activated!" });
    fetchAll();
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    // Remove old roles and set new one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any, assigned_by: user!.id });
    toast({ title: `User role updated to ${newRole}` });
    fetchAll();
  };

  const stats = [
    { label: "Total Listings", value: listings.length, sub: `${listings.filter(l => l.status === "approved").length} approved`, icon: Home, color: "from-blue-500/20 to-blue-600/10" },
    { label: "Pending Review", value: listings.filter(l => l.status === "pending").length, sub: "Needs attention", icon: Clock, color: "from-amber-500/20 to-amber-600/10", urgent: listings.filter(l => l.status === "pending").length > 0 },
    { label: "Total Users", value: users.length, sub: `${userRoles.filter(r => r.role === "admin").length} admins`, icon: Users, color: "from-emerald-500/20 to-emerald-600/10" },
    { label: "Active Sponsors", value: sponsorships.filter(s => s.status === "active").length, sub: `₹${sponsorships.filter(s => s.status === "active").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString()} revenue`, icon: Crown, color: "from-gold/20 to-amber-600/10" },
  ];

  const filteredListings = listings.filter(l => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
      suspended: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`;
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "listings", label: "Listings", icon: Home, badge: listings.filter(l => l.status === "pending").length },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "sponsorships", label: "Sponsorships", icon: Crown },
    { id: "plans", label: "Pricing Plans", icon: DollarSign },
    { id: "settings", label: "Platform Settings", icon: Settings },
  ];

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
            <p className="text-xs font-medium text-primary flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
            <Home className="w-4 h-4" /> User Dashboard
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl">{navItems.find(n => n.id === tab)?.label}</h1>
            <p className="text-xs text-muted-foreground">Welcome, {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.email?.[0]?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(s => (
                      <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl border border-border p-5`}>
                        <div className="flex items-center justify-between mb-3">
                          <s.icon className="w-5 h-5 text-foreground/70" />
                          {(s as any).urgent && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                        <p className="text-3xl font-display font-bold">{s.value}</p>
                        <p className="text-sm font-medium mt-0.5">{s.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Urgent: Pending Listings */}
                  {listings.filter(l => l.status === "pending").length > 0 && (
                    <div className="bg-card rounded-2xl border border-amber-500/30 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-display font-semibold">Pending Approvals ({listings.filter(l => l.status === "pending").length})</h3>
                      </div>
                      <div className="space-y-3">
                        {listings.filter(l => l.status === "pending").slice(0, 5).map(l => (
                          <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{l.title}</p>
                              <p className="text-xs text-muted-foreground">{l.city} · {l.property_type} · ₹{Number(l.price).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => approveListing(l.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => { setReviewingId(l.id); setTab("listings"); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setTab("listings")} className="mt-3 text-accent text-sm hover:underline">View all pending →</button>
                    </div>
                  )}

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="font-display font-semibold mb-3">Listing Status Breakdown</h3>
                      {["approved", "pending", "rejected", "suspended"].map(s => (
                        <div key={s} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm capitalize text-muted-foreground">{s}</span>
                          <span className="font-semibold text-sm">{listings.filter(l => l.status === s).length}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="font-display font-semibold mb-3">User Roles</h3>
                      {["admin", "moderator", "agent", "user"].map(r => (
                        <div key={r} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm capitalize text-muted-foreground">{r}s</span>
                          <span className="font-semibold text-sm">{userRoles.filter(ur => ur.role === r).length}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="font-display font-semibold mb-3">Sponsorship Revenue</h3>
                      {plans.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">{p.display_name}</span>
                          <span className="font-semibold text-sm">₹{sponsorships.filter(s => s.plan_name === p.name && s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center justify-between font-bold text-sm">
                        <span>Total</span>
                        <span className="text-accent">₹{sponsorships.filter(s => s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTINGS */}
              {tab === "listings" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search listings by title or city..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {["all", "pending", "approved", "rejected", "suspended"].map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                        >
                          {s} {s !== "all" && `(${listings.filter(l => l.status === s).length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredListings.map(l => (
                      <div key={l.id} className={`bg-card rounded-2xl border p-5 ${l.id === reviewingId ? "border-accent ring-1 ring-accent/30" : "border-border"}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-display font-semibold text-sm">{l.title}</h3>
                              <span className={statusBadge(l.status)}>{l.status}</span>
                              {l.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-amber-600 border border-gold/20">Sponsored</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.locality}, {l.city}</span>
                              <span>₹{Number(l.price).toLocaleString()}</span>
                              <span>{l.property_type}</span>
                              {l.bedrooms && <span>{l.bedrooms} BHK</span>}
                              <span>By: {l.profiles?.full_name || l.profiles?.email || "Unknown"}</span>
                              <span>{new Date(l.created_at).toLocaleDateString()}</span>
                            </div>
                            {l.admin_note && (
                              <p className="mt-1 text-xs text-muted-foreground italic">Note: {l.admin_note}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                            {l.status === "pending" && (
                              <>
                                <button onClick={() => approveListing(l.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => setReviewingId(reviewingId === l.id ? null : l.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {l.status === "approved" && (
                              <button onClick={async () => {
                                await supabase.from("property_listings").update({ status: "suspended" }).eq("id", l.id);
                                toast({ title: "Listing suspended" }); fetchAll();
                              }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                                Suspend
                              </button>
                            )}
                            {l.status === "suspended" && (
                              <button onClick={() => approveListing(l.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                Restore
                              </button>
                            )}
                            <button onClick={() => deleteListing(l.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Reject panel */}
                        {reviewingId === l.id && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <label className="block text-sm font-medium">Rejection Reason (required)</label>
                            <textarea
                              value={reviewNote}
                              onChange={e => setReviewNote(e.target.value)}
                              rows={2}
                              placeholder="Explain why the listing is rejected (e.g., incomplete details, suspicious pricing, fake address)..."
                              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => rejectListing(l.id, reviewNote)} className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                                Confirm Rejection
                              </button>
                              <button onClick={() => { setReviewingId(null); setReviewNote(""); }} className="px-4 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredListings.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">No listings found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* USERS */}
              {tab === "users" && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-lg">Users & Role Management ({users.length} users)</h2>
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => {
                            const ur = userRoles.find(r => r.user_id === u.user_id);
                            return (
                              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center text-white text-xs font-bold">
                                      {u.full_name?.[0] || u.email?.[0] || "?"}
                                    </div>
                                    <span className="text-sm font-medium">{u.full_name || "—"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                <td className="px-4 py-3">
                                  <span className={statusBadge(ur?.role || "user")}>{ur?.role || "user"}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                  <select
                                    value={ur?.role || "user"}
                                    onChange={e => changeUserRole(u.user_id, e.target.value)}
                                    disabled={u.user_id === user!.id}
                                    className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                                  >
                                    <option value="user">User</option>
                                    <option value="agent">Agent</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SPONSORSHIPS */}
              {tab === "sponsorships" && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-lg">Sponsorship Management</h2>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-card rounded-2xl border border-border p-4">
                      <p className="text-2xl font-bold text-emerald-500">{sponsorships.filter(s => s.status === "active").length}</p>
                      <p className="text-sm text-muted-foreground">Active Sponsorships</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4">
                      <p className="text-2xl font-bold text-amber-500">{sponsorships.filter(s => s.status === "pending").length}</p>
                      <p className="text-sm text-muted-foreground">Pending Approval</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4">
                      <p className="text-2xl font-bold text-accent">₹{sponsorships.filter(s => s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sponsorships.map(s => (
                      <div key={s.id} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
                        <Crown className={`w-8 h-8 flex-shrink-0 ${s.status === "active" ? "text-gold" : "text-muted-foreground"}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{s.property_listings?.title || "Unknown listing"}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.profiles?.full_name || "Unknown user"} · {s.plan_name} plan · ₹{Number(s.amount).toLocaleString()} · {s.duration_days} days
                          </p>
                          {s.expires_at && <p className="text-xs text-muted-foreground">Expires: {new Date(s.expires_at).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={statusBadge(s.status)}>{s.status}</span>
                          {s.status === "pending" && (
                            <button onClick={() => approveSponsorship(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                              Activate
                            </button>
                          )}
                          {s.status === "active" && (
                            <button onClick={async () => {
                              await supabase.from("sponsorships").update({ status: "cancelled" }).eq("id", s.id);
                              await supabase.from("property_listings").update({ is_featured: false }).eq("id", s.listing_id);
                              fetchAll();
                            }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {sponsorships.length === 0 && <div className="text-center py-16 text-muted-foreground">No sponsorships yet.</div>}
                  </div>
                </div>
              )}

              {/* PLANS */}
              {tab === "plans" && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-lg">Sponsorship Plans</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan, i) => (
                      <div key={plan.id} className="bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display font-bold">{plan.display_name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted text-muted-foreground border border-border"}`}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-3xl font-display font-bold text-accent mb-1">₹{Number(plan.price).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mb-4">{plan.duration_days} days · {plan.description}</p>
                        <ul className="space-y-2 mb-4">
                          {plan.features?.map((f: string) => (
                            <li key={f} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {sponsorships.filter(s => s.plan_name === plan.name).length} total subscriptions ·
                            ₹{sponsorships.filter(s => s.plan_name === plan.name && s.payment_status === "completed").reduce((acc, s) => acc + Number(s.amount), 0).toLocaleString()} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {tab === "settings" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-display font-semibold mb-4">Platform Settings</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Auto-approve listings", desc: "Skip manual approval for verified users", enabled: false },
                        { label: "Email notifications", desc: "Send email when listing is approved/rejected", enabled: true },
                        { label: "Sponsorship payments", desc: "Accept sponsorship upgrade requests", enabled: true },
                        { label: "New user registrations", desc: "Allow new users to sign up", enabled: true },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                          </div>
                          <div className={`w-10 h-5 rounded-full transition-colors ${s.enabled ? "bg-emerald-500" : "bg-muted"} relative cursor-pointer`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-display font-semibold mb-4">Admin Account</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Email</span>
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Role</span>
                        <span className="capitalize font-medium">{role}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs">{user?.id?.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
