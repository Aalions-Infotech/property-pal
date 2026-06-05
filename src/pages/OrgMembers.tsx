import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/context/OrgContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, UserPlus, Trash2, Mail, Copy, Building, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Member = { id: string; user_id: string; role: string; branch_id: string | null; is_active: boolean; joined_at: string };
type Invite = { id: string; email: string; role: string; status: string; token: string; expires_at: string; created_at: string };
type Branch = { id: string; name: string; locality: string | null; address: string | null; is_active: boolean };

export default function OrgMembers() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [profilesByUser, setProfilesByUser] = useState<Record<string, { full_name: string | null; email: string | null }>>({});
  const [invites, setInvites] = useState<Invite[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "agent">("agent");
  const [inviteBranch, setInviteBranch] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocality, setNewBranchLocality] = useState("");

  const canManage = currentOrg && ["owner", "admin"].includes(currentOrg.role);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/org/members", { replace: true });
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    const orgId = currentOrg.org_id;
    const [m, inv, br] = await Promise.all([
      (supabase as any).from("org_members").select("*").eq("org_id", orgId).order("joined_at"),
      (supabase as any).from("org_invites").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      (supabase as any).from("org_branches").select("*").eq("org_id", orgId).order("created_at"),
    ]);
    const mems = (m.data || []) as Member[];
    setMembers(mems);
    setInvites((inv.data || []) as Invite[]);
    setBranches((br.data || []) as Branch[]);
    const userIds = mems.map((x) => x.user_id);
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const map: Record<string, { full_name: string | null; email: string | null }> = {};
      (profs || []).forEach((p: any) => (map[p.user_id] = { full_name: p.full_name, email: p.email }));
      setProfilesByUser(map);
    }
    setLoading(false);
  }, [currentOrg]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !user || !canManage) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setInviting(true);
    const { error } = await (supabase as any).from("org_invites").insert({
      org_id: currentOrg.org_id,
      email,
      role: inviteRole,
      branch_id: inviteBranch || null,
      invited_by: user.id,
    });
    setInviting(false);
    if (error) {
      toast({ title: "Could not invite", description: error.message, variant: "destructive" });
      return;
    }
    setInviteEmail("");
    toast({ title: "Invite created", description: "Share the link with the invitee." });
    void load();
  };

  const removeMember = async (m: Member) => {
    if (!confirm("Remove this member from the agency?")) return;
    const { error } = await (supabase as any).from("org_members").delete().eq("id", m.id);
    if (error) return toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    void load();
  };

  const updateRole = async (m: Member, role: string) => {
    const { error } = await (supabase as any).from("org_members").update({ role }).eq("id", m.id);
    if (error) return toast({ title: "Could not update", description: error.message, variant: "destructive" });
    void load();
  };

  const revokeInvite = async (i: Invite) => {
    const { error } = await (supabase as any).from("org_invites").update({ status: "revoked" }).eq("id", i.id);
    if (error) return toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
    void load();
  };

  const copyInvite = async (i: Invite) => {
    const url = `${window.location.origin}/org/invite/${i.token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied", description: url });
  };

  const addBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !canManage || newBranchName.trim().length < 2) return;
    const { error } = await (supabase as any).from("org_branches").insert({
      org_id: currentOrg.org_id,
      name: newBranchName.trim(),
      locality: newBranchLocality.trim() || null,
      city: "Lucknow",
    });
    if (error) return toast({ title: "Could not add branch", description: error.message, variant: "destructive" });
    setNewBranchName("");
    setNewBranchLocality("");
    void load();
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto pt-28 px-6 text-center">
          <p className="text-muted-foreground mb-4">No agency selected.</p>
          <button onClick={() => navigate("/org/create")} className="px-4 py-2 btn-gold rounded-xl text-sm">Create one</button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Members & Branches</h1>
          <p className="text-sm text-muted-foreground">{currentOrg.organization.name}</p>
        </div>

        {/* Invite */}
        {canManage && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite a teammate</h2>
            <form onSubmit={sendInvite} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_160px_auto] gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
              <select
                value={inviteBranch}
                onChange={(e) => setInviteBranch(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              >
                <option value="">No branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button disabled={inviting} className="px-4 py-2 btn-gold rounded-xl text-sm font-semibold flex items-center gap-2">
                {inviting && <Loader2 className="w-4 h-4 animate-spin" />} Invite
              </button>
            </form>
          </section>
        )}

        {/* Pending invites */}
        {invites.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Mail className="w-4 h-4" /> Invites</h2>
            <div className="divide-y divide-border">
              {invites.map((i) => (
                <div key={i.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{i.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {i.role} • {i.status} • expires {new Date(i.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {i.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => copyInvite(i)} className="px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy link
                      </button>
                      {canManage && (
                        <button onClick={() => revokeInvite(i)} className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs">
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Members */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Members ({members.length})</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => {
                const p = profilesByUser[m.user_id];
                return (
                  <div key={m.id} className="py-3 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p?.full_name || p?.email || m.user_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground truncate">{p?.email}</p>
                    </div>
                    {canManage && m.role !== "owner" ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateRole(m, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-border bg-background text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-muted text-xs capitalize">{m.role}</span>
                    )}
                    {canManage && m.role !== "owner" && (
                      <button onClick={() => removeMember(m)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Branches */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Building className="w-4 h-4" /> Branches</h2>
          {branches.length === 0 && <p className="text-sm text-muted-foreground mb-3">No branches yet.</p>}
          <div className="space-y-2 mb-4">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-border text-sm">
                <div className="flex-1">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.locality || "—"}</p>
                </div>
              </div>
            ))}
          </div>
          {canManage && (
            <form onSubmit={addBranch} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Branch name (e.g. Gomti Nagar Office)"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <input
                value={newBranchLocality}
                onChange={(e) => setNewBranchLocality(e.target.value)}
                placeholder="Locality"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <button className="px-4 py-2 btn-navy rounded-xl text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}