import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Edit,
  Save,
  X,
  CheckCircle,
  MapPin,
  Clock,
  XCircle,
  Camera,
} from "lucide-react";

interface AdminAgentManagementProps {
  users: any[];
  userRoles: any[];
  onRefresh: () => void;
  adminId: string;
}

const generateAgentId = () => `AGT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const resolveRole = (roles: string[]) => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";
  if (roles.includes("agent")) return "agent";
  return "user";
};

const AdminAgentManagement = ({ users, userRoles, onRefresh, adminId }: AdminAgentManagementProps) => {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", city: "", bio: "" });
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    city: "",
    bio: "",
    experience_years: 0,
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"agents" | "applications">("agents");

  const getUserRole = (userId: string) => {
    const roles = userRoles.filter((r) => r.user_id === userId).map((r) => r.role);
    return resolveRole(roles);
  };

  const agents = users.filter((u) => getUserRole(u.user_id) === "agent");

  useEffect(() => {
    void fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data } = await (supabase.from("agent_applications") as any)
      .select("*")
      .order("created_at", { ascending: false });
    setApplications(data || []);
  };

  const createAgent = async () => {
    if (!createForm.email || !createForm.full_name) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const password = createForm.password || generatePassword();
    const agentId = generateAgentId();

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: createForm.email,
        password,
        options: { data: { full_name: createForm.full_name } },
      });
      if (authErr) throw authErr;

      if (authData.user) {
        await supabase
          .from("profiles")
          .update({
            full_name: createForm.full_name,
            phone: createForm.phone || null,
            city: createForm.city || null,
            bio: createForm.bio || null,
            is_verified: true,
          })
          .eq("user_id", authData.user.id);

        await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: "agent" as any, assigned_by: adminId });

        await (supabase.from("agent_profiles") as any).insert({
          user_id: authData.user.id,
          agent_id: agentId,
          experience_years: createForm.experience_years || 0,
          specialization: createForm.specialization || null,
        });

        await supabase.from("admin_activity_log").insert({
          admin_id: adminId,
          action: "create_agent",
          entity_type: "user",
          entity_id: authData.user.id,
          details: { email: createForm.email, name: createForm.full_name, agent_id: agentId },
        });

        try {
          await supabase.functions.invoke("agent-approval-email", {
            body: {
              to: createForm.email,
              agentName: createForm.full_name,
              agentId,
              password,
              loginUrl: `${window.location.origin}/auth`,
            },
          });
        } catch {
          // optional email
        }
      }

      toast({ title: "✅ Agent created!", description: `Agent ID: ${agentId}` });
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        city: "",
        bio: "",
        experience_years: 0,
        specialization: "",
      });
      setShowCreateForm(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (app: any) => {
    setLoading(true);

    try {
      const { data: existingAgentProfiles } = await (supabase.from("agent_profiles") as any)
        .select("id, agent_id")
        .eq("user_id", app.user_id)
        .order("created_at", { ascending: false })
        .limit(1);

      const existingAgentProfile = existingAgentProfiles?.[0];
      const agentId = existingAgentProfile?.agent_id || generateAgentId();

      const { error: roleDeleteError } = await supabase.from("user_roles").delete().eq("user_id", app.user_id);
      if (roleDeleteError) throw roleDeleteError;

      const { error: roleInsertError } = await supabase
        .from("user_roles")
        .insert({ user_id: app.user_id, role: "agent" as any, assigned_by: adminId });
      if (roleInsertError) throw roleInsertError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: app.full_name,
          phone: app.phone || null,
          city: app.city || null,
          bio: app.bio || null,
          is_verified: true,
        })
        .eq("user_id", app.user_id);
      if (profileError) throw profileError;

      if (existingAgentProfile?.id) {
        const { error: updateAgentProfileError } = await (supabase.from("agent_profiles") as any)
          .update({
            experience_years: app.experience_years || 0,
            specialization: app.specialization || null,
            languages: app.languages || null,
          })
          .eq("id", existingAgentProfile.id);
        if (updateAgentProfileError) throw updateAgentProfileError;
      } else {
        const { error: createAgentProfileError } = await (supabase.from("agent_profiles") as any).insert({
          user_id: app.user_id,
          agent_id: agentId,
          experience_years: app.experience_years || 0,
          specialization: app.specialization || null,
          languages: app.languages || null,
        });
        if (createAgentProfileError) throw createAgentProfileError;
      }

      const { error: applicationError } = await (supabase.from("agent_applications") as any)
        .update({
          status: "approved",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          generated_password: null,
        })
        .eq("id", app.id);
      if (applicationError) throw applicationError;

      await supabase.from("admin_activity_log").insert({
        admin_id: adminId,
        action: "approve_agent_application",
        entity_type: "user",
        entity_id: app.user_id,
        details: { email: app.email, name: app.full_name, agent_id: agentId },
      });

      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "🎉 Agent Application Approved!",
        message: `Congratulations! Your agent application is approved. Agent ID: ${agentId}. You can now sign in and access Agent Dashboard.`,
        type: "success",
      });

      try {
        await supabase.functions.invoke("agent-approval-email", {
          body: {
            to: app.email,
            agentName: app.full_name,
            agentId,
            loginUrl: `${window.location.origin}/auth`,
          },
        });
      } catch {
        // optional email
      }

      toast({ title: "✅ Application Approved!", description: `Agent ID: ${agentId}` });
      await fetchApplications();
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const rejectApplication = async (id: string, userId: string) => {
    await (supabase.from("agent_applications") as any)
      .update({ status: "rejected", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Agent Application Update",
      message: "Your agent application was not approved at this time. Please contact support for more details.",
      type: "error",
    });

    await supabase.from("admin_activity_log").insert({
      admin_id: adminId,
      action: "reject_agent_application",
      entity_type: "user",
      entity_id: userId,
    });

    toast({ title: "Application rejected" });
    await fetchApplications();
  };

  const removeAgent = async (userId: string) => {
    if (!confirm("Remove this agent? They will be demoted to regular user.")) return;

    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: "user" as any, assigned_by: adminId });
    await supabase.from("admin_activity_log").insert({
      admin_id: adminId,
      action: "remove_agent",
      entity_type: "user",
      entity_id: userId,
    });

    toast({ title: "Agent removed (demoted to user)" });
    onRefresh();
  };

  const startEdit = (agent: any) => {
    setEditingId(agent.user_id);
    setEditForm({
      full_name: agent.full_name || "",
      phone: agent.phone || "",
      city: agent.city || "",
      bio: agent.bio || "",
    });
  };

  const saveEdit = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, phone: editForm.phone || null, city: editForm.city || null, bio: editForm.bio || null })
      .eq("user_id", userId);

    toast({ title: "Agent profile updated!" });
    setEditingId(null);
    onRefresh();
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const fieldClass = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("agents")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === "agents" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Agents ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 rounded-xl text-sm font-medium relative ${activeTab === "applications" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Applications ({pendingApps.length})
          {pendingApps.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
              {pendingApps.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "agents" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">{agents.length} Agents</h3>
              <p className="text-xs text-muted-foreground">Create, manage and remove sales agents</p>
            </div>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> {showCreateForm ? "Cancel" : "Create Agent"}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-card rounded-2xl border border-accent/30 p-6">
              <h4 className="font-display font-semibold mb-4">Create New Agent</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label><input value={createForm.full_name} onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Rajesh Mehta" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label><input value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="agent@email.com" type="email" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Password (auto-generated if empty)</label><input value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave empty for auto-generate" type="password" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label><input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City</label><input value={createForm.city} onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))} placeholder="Mumbai" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Experience (Years)</label><input value={createForm.experience_years} onChange={(e) => setCreateForm((f) => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))} type="number" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Specialization</label><input value={createForm.specialization} onChange={(e) => setCreateForm((f) => ({ ...f, specialization: e.target.value }))} placeholder="Residential, Commercial..." className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label><input value={createForm.bio} onChange={(e) => setCreateForm((f) => ({ ...f, bio: e.target.value }))} placeholder="About the agent..." className={fieldClass} /></div>
              </div>
              <button onClick={createAgent} disabled={loading} className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {loading ? "Creating..." : "Create Agent Account"}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-card rounded-2xl border border-border p-5">
                {editingId === agent.user_id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Full Name" className={fieldClass} />
                      <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={fieldClass} />
                      <input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className={fieldClass} />
                      <input value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Bio" className={fieldClass} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(agent.user_id)} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-medium border border-emerald-500/20 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.full_name || "Agent"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-lg">{(agent.full_name || "A")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm">{agent.full_name || "No name"}</h4>
                        {agent.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20 font-medium">Agent</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        {agent.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.phone}</span>}
                        {agent.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agent.city}</span>}
                        {agent.bio && <span>{agent.bio}</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <a href={`tel:${agent.phone || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                        </a>
                        <a href={`sms:${agent.phone || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Message
                        </a>
                        <a href={`mailto:${agent.email || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                          <Mail className="w-3.5 h-3.5 text-accent" /> Email
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(agent)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => removeAgent(agent.user_id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive" title="Remove agent"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {agents.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No agents yet. Click "Create Agent" to add your first sales agent.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "applications" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg">Agent Applications</h3>
            <p className="text-xs text-muted-foreground">Review and approve/reject "Become an Agent" requests</p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No applications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const applicantProfile = users.find((u) => u.user_id === app.user_id);

                return (
                  <div key={app.id} className={`bg-card rounded-2xl border p-5 ${app.status === "pending" ? "border-amber-500/30" : "border-border"}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                        {applicantProfile?.avatar_url ? (
                          <img src={applicantProfile.avatar_url} alt={app.full_name || "Applicant"} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-sm">{app.full_name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${app.status === "pending" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : app.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>{app.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          {app.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>}
                          {app.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.city}</span>}
                          {app.experience_years > 0 && <span>{app.experience_years} yrs experience</span>}
                          {app.specialization && <span>{app.specialization}</span>}
                        </div>
                        {app.reason && <p className="text-xs text-muted-foreground mt-2 italic">"{app.reason}"</p>}
                        <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(app.created_at).toLocaleDateString("en-IN")}</p>
                      </div>

                      {app.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approveApplication(app)} disabled={loading} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1 disabled:opacity-50">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => rejectApplication(app.id, app.user_id)} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAgentManagement;
