import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Home, Eye, DollarSign, Clock, CheckCircle, XCircle, MapPin, Search, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  users: any[];
  userRoles: any[];
  listings: any[];
  sponsorships: any[];
}

const AdminUserDashboardView = ({ users, userRoles, listings, sponsorships }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userListings, setUserListings] = useState<any[]>([]);
  const [userSponsorships, setUserSponsorships] = useState<any[]>([]);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter to regular users only (not admin/agent)
  const regularUsers = users.filter(u => {
    const role = userRoles.find(r => r.user_id === u.user_id);
    return !role || role.role === "user";
  });

  const filteredUsers = regularUsers.filter(u =>
    !searchQuery || [u.full_name, u.email, u.city].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUser = users.find(u => u.user_id === selectedUserId);

  useEffect(() => {
    if (!selectedUserId) return;
    setLoading(true);
    Promise.all([
      supabase.from("property_listings").select("*").eq("user_id", selectedUserId).order("created_at", { ascending: false }),
      supabase.from("sponsorships").select("*, property_listings(title, city)").eq("user_id", selectedUserId).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", selectedUserId).order("created_at", { ascending: false }).limit(20),
    ]).then(([listRes, sponsorRes, notifRes]) => {
      setUserListings(listRes.data || []);
      setUserSponsorships(sponsorRes.data || []);
      setUserNotifications(notifRes.data || []);
      setLoading(false);
    });
  }, [selectedUserId]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600",
      approved: "bg-emerald-500/10 text-emerald-600",
      rejected: "bg-red-500/10 text-red-600",
      suspended: "bg-gray-500/10 text-gray-500",
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`;
  };

  if (selectedUserId && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedUserId(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">← Back to Users</button>
          <h2 className="font-display font-bold text-lg">Viewing: {selectedUser.full_name || selectedUser.email}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* User Profile Card */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedUser.full_name || "N/A"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.phone || "No phone"} · {selectedUser.city || "No city"}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <Home className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold">{userListings.length}</p>
                <p className="text-xs text-muted-foreground">Total Listings</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <CheckCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-2xl font-bold">{userListings.filter(l => l.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <Clock className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold">{userListings.filter(l => l.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <DollarSign className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
                <p className="text-2xl font-bold">{userSponsorships.length}</p>
                <p className="text-xs text-muted-foreground">Sponsorships</p>
              </div>
            </div>

            {/* User's Listings */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Property Listings ({userListings.length})</h3>
              {userListings.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No listings found</p>
              ) : (
                <div className="space-y-3">
                  {userListings.map(l => (
                    <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{l.locality}, {l.city} · ₹{Number(l.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className={statusBadge(l.status)}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User's Sponsorships */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Sponsorships ({userSponsorships.length})</h3>
              {userSponsorships.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No sponsorships found</p>
              ) : (
                <div className="space-y-3">
                  {userSponsorships.map(s => (
                    <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{s.plan_name} - {s.property_listings?.title || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">₹{Number(s.amount).toLocaleString("en-IN")} · {s.payment_status}</p>
                      </div>
                      <span className={statusBadge(s.status || "pending")}>{s.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User's Notifications */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-display font-semibold mb-4">Recent Notifications</h3>
              {userNotifications.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No notifications</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userNotifications.map(n => (
                    <div key={n.id} className={`p-3 rounded-lg border text-sm ${n.is_read ? "border-border" : "border-primary/30 bg-primary/5"}`}>
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</p>
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
        <h2 className="font-display font-bold text-lg">All User Dashboards</h2>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>User</span><span>Contact</span><span>Listings</span><span>Action</span>
        </div>
        {filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
        ) : (
          filteredUsers.slice(0, 50).map(u => {
            const userListingCount = listings.filter(l => l.user_id === u.user_id).length;
            return (
              <div key={u.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border last:border-0 items-center hover:bg-muted/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.city || "No city"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.phone || "No phone"}</p>
                </div>
                <span className="text-sm font-medium text-center min-w-[40px]">{userListingCount}</span>
                <button
                  onClick={() => setSelectedUserId(u.user_id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View Dashboard
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminUserDashboardView;
