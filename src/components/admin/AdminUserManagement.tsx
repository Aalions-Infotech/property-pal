import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Search, UserCheck, UserX, Ban, Shield, Send, Eye, RotateCcw, ChevronDown, Trash2, Plus } from "lucide-react";

interface Props {
  users: any[];
  userRoles: any[];
  listings: any[];
  sponsorships: any[];
  adminId: string;
  onRefresh: () => void;
}

const AdminUserManagement = ({ users, userRoles, listings, sponsorships, adminId, onRefresh }: Props) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ userId: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [notifModal, setNotifModal] = useState<{ userId: string; name: string } | null>(null);
  const [notifForm, setNotifForm] = useState({ title: "", message: "" });
  const [deleteModal, setDeleteModal] = useState<{ userId: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", full_name: "", role: "admin" });
  const [creating, setCreating] = useState(false);

  const createUser = async () => {
    if (!createForm.email || createForm.password.length < 8) {
      toast({ title: "Email and password (min 8 chars) required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", { body: createForm });
    setCreating(false);
    if (error || (data as any)?.error) {
      toast({ title: "Create failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: `${createForm.role} account created for ${createForm.email}` });
    setCreateModal(false);
    setCreateForm({ email: "", password: "", full_name: "", role: "admin" });
    onRefresh();
  };

  const logAction = async (action: string, entityType: string, entityId: string, details?: any) => {
    await supabase.from("admin_activity_log").insert({
      admin_id: adminId, action, entity_type: entityType, entity_id: entityId, details: details || {},
    });
  };

  const filteredUsers = users.filter(u => {
    const ur = userRoles.find(r => r.user_id === u.user_id);
    const matchRole = filterRole === "all" || ur?.role === filterRole;
    const matchStatus = filterStatus === "all" || (filterStatus === "banned" ? u.is_banned : filterStatus === "verified" ? u.is_verified : !u.is_verified && !u.is_banned);
    const matchSearch = !searchQuery || [u.full_name, u.email, u.city, u.phone].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRole && matchSearch && matchStatus;
  });

  const changeUserRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any, assigned_by: adminId });
    await logAction("change_role", "user", userId, { new_role: newRole });
    toast({ title: `Role updated to ${newRole}` });
    onRefresh();
  };

  const verifyUser = async (userId: string, verified: boolean) => {
    await supabase.from("profiles").update({ is_verified: verified }).eq("user_id", userId);
    await logAction(verified ? "verify_user" : "unverify_user", "user", userId);
    toast({ title: verified ? "User verified ✓" : "Verification removed" });
    onRefresh();
  };

  const banUser = async () => {
    if (!banModal) return;
    await supabase.from("profiles").update({
      is_banned: true,
      ban_reason: banReason || "Violated platform terms",
      banned_at: new Date().toISOString(),
    }).eq("user_id", banModal.userId);
    await supabase.from("notifications").insert({
      user_id: banModal.userId,
      title: "🚫 Account Suspended",
      message: `Your account has been suspended. Reason: ${banReason || "Violated platform terms"}`,
      type: "error",
    });
    await logAction("ban_user", "user", banModal.userId, { reason: banReason });
    toast({ title: "User banned" });
    setBanModal(null);
    setBanReason("");
    onRefresh();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from("profiles").update({ is_banned: false, ban_reason: null, banned_at: null }).eq("user_id", userId);
    await supabase.from("notifications").insert({
      user_id: userId, title: "✅ Account Restored", message: "Your account has been restored. Welcome back!", type: "success",
    });
    await logAction("unban_user", "user", userId);
    toast({ title: "User unbanned" });
    onRefresh();
  };

  const sendNotification = async () => {
    if (!notifModal || !notifForm.title || !notifForm.message) return;
    await supabase.from("notifications").insert({
      user_id: notifModal.userId, title: notifForm.title, message: notifForm.message, type: "info",
    });
    await logAction("send_notification", "user", notifModal.userId, { title: notifForm.title });
    toast({ title: "Notification sent!" });
    setNotifModal(null);
    setNotifForm({ title: "", message: "" });
  };

  const deleteUser = async () => {
    if (!deleteModal) return;
    if (deleteConfirmText !== "DELETE") {
      toast({ title: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
    setDeleting(true);
    const { error } = await (supabase.rpc as any)("admin_delete_user", { _target_user_id: deleteModal.userId });
    setDeleting(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "User permanently deleted" });
    setDeleteModal(null);
    setDeleteConfirmText("");
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "admin", "moderator", "agent", "user"].map(r => (
            <button key={r} onClick={() => setFilterRole(r)} className={`px-3 py-2 rounded-xl text-xs font-medium capitalize ${filterRole === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "verified", "banned", "unverified"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-medium capitalize ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
      <div className="flex justify-end -mt-2">
        <button onClick={() => setCreateModal(true)} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Admin / User
        </button>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.map(u => {
          const ur = userRoles.find(r => r.user_id === u.user_id);
          const userListings = listings.filter(l => l.user_id === u.user_id);
          const userSponsors = sponsorships.filter(s => s.user_id === u.user_id);
          const isExpanded = expandedUser === u.user_id;

          return (
            <div key={u.id} className={`bg-card rounded-2xl border p-5 transition-all ${u.is_banned ? "border-red-500/30 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_banned ? "bg-red-500/20" : "bg-gradient-navy"}`}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className={`text-sm font-bold ${u.is_banned ? "text-red-500" : "text-white"}`}>{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{u.full_name || "No name"}</p>
                    {u.is_verified && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">✓ Verified</span>}
                    {u.is_banned && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-500 border border-red-500/20">🚫 Banned</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>{userListings.length} listings</span>
                    <span>{userSponsors.length} sponsorships</span>
                    <span>{u.city || "No city"}</span>
                    <span>Joined {new Date(u.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => verifyUser(u.user_id, !u.is_verified)} className={`p-1.5 rounded-lg text-xs ${u.is_verified ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"} hover:opacity-80`} title={u.is_verified ? "Remove verification" : "Verify user"}>
                    {u.is_verified ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                  {u.is_banned ? (
                    <button onClick={() => unbanUser(u.user_id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Unban
                    </button>
                  ) : (
                    <button onClick={() => setBanModal({ userId: u.user_id, name: u.full_name || u.email })} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Ban
                    </button>
                  )}
                  <select value={ur?.role || "user"} onChange={e => changeUserRole(u.user_id, e.target.value)} className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium outline-none focus:ring-2 focus:ring-accent">
                    {["user", "agent", "moderator", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => { setNotifModal({ userId: u.user_id, name: u.full_name || u.email }); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Send notification">
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ userId: u.user_id, name: u.full_name || u.email })}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                    title="Permanently delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedUser(isExpanded ? null : u.user_id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 ml-14 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                  <div><span className="text-xs text-muted-foreground">Phone</span><p className="text-sm font-medium">{u.phone || "N/A"}</p></div>
                  <div><span className="text-xs text-muted-foreground">City</span><p className="text-sm font-medium">{u.city || "N/A"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Role</span><p className="text-sm font-medium capitalize">{ur?.role || "user"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Status</span><p className="text-sm font-medium">{u.is_banned ? "Banned" : u.is_verified ? "Verified" : "Active"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Listings</span><p className="text-sm font-medium">{userListings.length} ({userListings.filter(l => l.status === "approved").length} live)</p></div>
                  <div><span className="text-xs text-muted-foreground">Sponsorships</span><p className="text-sm font-medium">{userSponsors.length}</p></div>
                  <div><span className="text-xs text-muted-foreground">Revenue</span><p className="text-sm font-medium">₹{userSponsors.filter(s => s.payment_status === "completed").reduce((a: number, s: any) => a + Number(s.amount), 0).toLocaleString("en-IN")}</p></div>
                  <div><span className="text-xs text-muted-foreground">Bio</span><p className="text-sm font-medium truncate">{u.bio || "N/A"}</p></div>
                  {u.is_banned && u.ban_reason && (
                    <div className="col-span-full"><span className="text-xs text-red-500">Ban Reason</span><p className="text-sm text-red-600">{u.ban_reason}</p></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBanModal(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold mb-2 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" /> Ban User</h3>
            <p className="text-sm text-muted-foreground mb-4">Ban <strong>{banModal.name}</strong>? They won't be able to access the platform.</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban (optional)..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent mb-3" />
            <div className="flex gap-2">
              <button onClick={banUser} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Confirm Ban</button>
              <button onClick={() => setBanModal(null)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNotifModal(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold mb-2">Send Notification to {notifModal.name}</h3>
            <div className="space-y-3">
              <input value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
              <textarea value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} placeholder="Message..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent" />
              <div className="flex gap-2">
                <button onClick={sendNotification} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Send</button>
                <button onClick={() => setNotifModal(null)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(""); }}>
          <div className="bg-card rounded-2xl border border-red-500/30 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Permanently Delete User
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Permanently remove <strong className="text-foreground">{deleteModal.name}</strong> and ALL their data:
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 mb-4 space-y-0.5">
              <li>Profile, role, and verification</li>
              <li>All property listings and sponsorships</li>
              <li>Saved properties, reviews, leads, notifications</li>
              <li>Agent profile and client data (if any)</li>
            </ul>
            <p className="text-xs text-red-600 mb-2">This action cannot be undone. Type <strong>DELETE</strong> to confirm:</p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 bg-background text-sm outline-none focus:ring-2 focus:ring-red-500 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={deleteUser}
                disabled={deleting || deleteConfirmText !== "DELETE"}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText(""); }} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
