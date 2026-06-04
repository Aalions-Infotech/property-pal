import { useState, useEffect, useRef } from "react";
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
  Upload,
  Star,
  AlertCircle,
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

const getProfileCompleteness = (agent: any) => {
  const fields = [
    { name: "Photo", complete: !!agent.avatar_url },
    { name: "Phone", complete: !!agent.phone },
    { name: "City", complete: !!agent.city },
    { name: "Bio", complete: !!agent.bio },
  ];
  const completedCount = fields.filter(f => f.complete).length;
  return { fields, completedCount, total: fields.length, percentage: Math.round((completedCount / fields.length) * 100) };
};

const AdminAgentManagement = ({ users, userRoles, onRefresh, adminId }: AdminAgentManagementProps) => {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", city: "", bio: "", rating: 0 });
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    city: "",
    bio: "",
    experience_years: 0,
    specialization: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"agents" | "applications">("agents");
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [agentProfiles, setAgentProfiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const getUserRole = (userId: string) => {
    const roles = userRoles.filter((r) => r.user_id === userId).map((r) => r.role);
    return resolveRole(roles);
  };

  const agents = users.filter((u) => getUserRole(u.user_id) === "agent");

  useEffect(() => {
    void fetchApplications();
    void fetchAgentProfiles();
  }, []);

  const fetchApplications = async () => {
    const { data } = await (supabase.from("agent_applications") as any)
      .select("*")
      .order("created_at", { ascending: false });
    setApplications(data || []);
  };

  const fetchAgentProfiles = async () => {
    const { data } = await (supabase.from("agent_profiles") as any).select("*");
    setAgentProfiles(data || []);
  };

  const getAgentProfile = (userId: string) => {
    return agentProfiles.find(ap => ap.user_id === userId);
  };

  const handlePhotoUpload = async (file: File, userId?: string) => {
    if (!file) return null;
    
    const fileExt = file.name.split(".").pop();
    const fileName = `agent-${userId || "new"}-${Date.now()}.${fileExt}`;
    const filePath = `agents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleCreatePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto("create");
    const url = await handlePhotoUpload(file);
    if (url) {
      setCreateForm(f => ({ ...f, avatar_url: url }));
    }
    setUploadingPhoto(null);
  };

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(userId);
    const url = await handlePhotoUpload(file, userId);
    if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
      toast({ title: "Photo updated!" });
      onRefresh();
    }
    setUploadingPhoto(null);
  };

  const updateAgentRating = async (userId: string, rating: number) => {
    const { error } = await (supabase.from("agent_profiles") as any)
      .update({ rating })
      .eq("user_id", userId);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rating updated!" });
      await fetchAgentProfiles();
    }
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
        const { error: profileUpsertError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: authData.user.id,
              full_name: createForm.full_name,
              email: createForm.email,
              phone: createForm.phone || null,
              city: createForm.city || null,
              bio: createForm.bio || null,
              avatar_url: createForm.avatar_url || null,
              is_verified: true,
            },
            { onConflict: "user_id" }
          );
        if (profileUpsertError) throw profileUpsertError;

        const { error: deleteRoleError } = await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        if (deleteRoleError) throw deleteRoleError;

        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: "agent" as any, assigned_by: adminId });
        if (insertRoleError) throw insertRoleError;

        const { error: agentProfileError } = await (supabase.from("agent_profiles") as any).insert({
          user_id: authData.user.id,
          agent_id: agentId,
          experience_years: createForm.experience_years || 0,
          specialization: createForm.specialization || null,
        });
        if (agentProfileError) throw agentProfileError;

        const { error: activityLogError } = await supabase.from("admin_activity_log").insert({
          admin_id: adminId,
          action: "create_agent",
          entity_type: "user",
          entity_id: authData.user.id,
          details: { email: createForm.email, name: createForm.full_name, agent_id: agentId },
        });
        if (activityLogError) throw activityLogError;

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
        avatar_url: "",
      });
      setShowCreateForm(false);
      onRefresh();
      await fetchAgentProfiles();
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
        .upsert(
          {
            user_id: app.user_id,
            full_name: app.full_name,
            email: app.email,
            phone: app.phone || null,
            city: app.city || null,
            bio: app.bio || null,
            is_verified: true,
          },
          { onConflict: "user_id" }
        );
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
      await fetchAgentProfiles();
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

  const deleteAgentPermanently = async (userId: string, name: string) => {
    const confirm1 = confirm(`⚠️ PERMANENTLY DELETE agent "${name}"?\n\nThis removes their profile, listings, sponsorships, reviews, leads and all data. This CANNOT be undone.`);
    if (!confirm1) return;
    const typed = prompt(`Type DELETE to confirm permanent deletion of "${name}":`);
    if (typed !== "DELETE") {
      toast({ title: "Cancelled (confirmation text did not match)" });
      return;
    }
    const { error } = await (supabase.rpc as any)("admin_delete_user", { _target_user_id: userId });
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Agent permanently deleted" });
    await fetchAgentProfiles();
    onRefresh();
  };

  const startEdit = (agent: any) => {
    const ap = getAgentProfile(agent.user_id);
    setEditingId(agent.user_id);
    setEditForm({
      full_name: agent.full_name || "",
      phone: agent.phone || "",
      city: agent.city || "",
      bio: agent.bio || "",
      rating: ap?.rating || 0,
    });
  };

  const saveEdit = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, phone: editForm.phone || null, city: editForm.city || null, bio: editForm.bio || null })
      .eq("user_id", userId);

    await (supabase.from("agent_profiles") as any)
      .update({ rating: editForm.rating })
      .eq("user_id", userId);

    toast({ title: "Agent profile updated!" });
    setEditingId(null);
    onRefresh();
    await fetchAgentProfiles();
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const fieldClass = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  const RatingStars = ({ rating, onRate, editable = false }: { rating: number; onRate?: (r: number) => void; editable?: boolean }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => editable && onRate?.(star)}
          className={`${editable ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          disabled={!editable}
        >
          <Star className={`w-4 h-4 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );

  const ProfileCompletenessBar = ({ agent }: { agent: any }) => {
    const completeness = getProfileCompleteness(agent);
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">Profile: {completeness.percentage}%</span>
          {completeness.percentage < 100 && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Incomplete
            </span>
          )}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${completeness.percentage === 100 ? "bg-emerald-500" : completeness.percentage >= 50 ? "bg-amber-500" : "bg-destructive"}`}
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>
        {completeness.percentage < 100 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Missing: {completeness.fields.filter(f => !f.complete).map(f => f.name).join(", ")}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleCreatePhotoChange} />
      <input type="file" ref={editFileInputRef} accept="image/*" className="hidden" />

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
              
              {/* Photo Upload */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-accent transition-colors overflow-hidden"
                >
                  {uploadingPhoto === "create" ? (
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : createForm.avatar_url ? (
                    <img src={createForm.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 text-muted-foreground mx-auto" />
                      <p className="text-[10px] text-muted-foreground mt-1">Photo</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">Click to upload agent photo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label><input value={createForm.full_name} onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Rajesh Mehta" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label><input value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="agent@email.com" type="email" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Password (auto-generated if empty)</label><input value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave empty for auto-generate" type="password" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label><input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className={fieldClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City</label><input value={createForm.city} onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))} placeholder="Lucknow" className={fieldClass} /></div>
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
            {agents.map((agent) => {
              const ap = getAgentProfile(agent.user_id);
              return (
                <div key={agent.id} className="bg-card rounded-2xl border border-border p-5">
                  {editingId === agent.user_id ? (
                    <div className="space-y-3">
                      {/* Photo edit */}
                      <div className="flex items-center gap-4 mb-2">
                        <div 
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e: any) => handleEditPhotoChange(e, agent.user_id);
                            input.click();
                          }}
                          className="w-16 h-16 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-accent transition-colors overflow-hidden"
                        >
                          {uploadingPhoto === agent.user_id ? (
                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          ) : agent.avatar_url ? (
                            <img src={agent.avatar_url} alt={agent.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Click photo to change</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Full Name" className={fieldClass} />
                        <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={fieldClass} />
                        <input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className={fieldClass} />
                        <input value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Bio" className={fieldClass} />
                      </div>

                      {/* Rating edit */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-muted-foreground">Rating:</label>
                        <RatingStars rating={editForm.rating} onRate={(r) => setEditForm(f => ({ ...f, rating: r }))} editable />
                        <span className="text-sm text-muted-foreground">({editForm.rating}/5)</span>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(agent.user_id)} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-medium border border-emerald-500/20 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div 
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e: any) => handleEditPhotoChange(e, agent.user_id);
                          input.click();
                        }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all group relative"
                      >
                        {uploadingPhoto === agent.user_id ? (
                          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        ) : agent.avatar_url ? (
                          <>
                            <img src={agent.avatar_url} alt={agent.full_name || "Agent"} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="font-display font-bold text-lg">{(agent.full_name || "A")[0].toUpperCase()}</span>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-sm">{agent.full_name || "No name"}</h4>
                          {agent.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20 font-medium">Agent</span>
                          {ap?.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              {ap.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          {agent.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.phone}</span>}
                          {agent.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agent.city}</span>}
                          {agent.bio && <span>{agent.bio}</span>}
                        </div>

                        <ProfileCompletenessBar agent={agent} />

                        <div className="flex gap-2 mt-3 flex-wrap">
                          {agent.phone && (
                            <a href={`tel:${agent.phone}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                            </a>
                          )}
                          {agent.phone && (
                            <a href={`sms:${agent.phone}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> SMS
                            </a>
                          )}
                          {agent.phone && (
                            <a href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                              <MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                            </a>
                          )}
                          <a href={`mailto:${agent.email || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                            <Mail className="w-3.5 h-3.5 text-accent" /> Email
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(agent)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => removeAgent(agent.user_id)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title="Demote to regular user"><X className="w-4 h-4" /></button>
                        <button onClick={() => deleteAgentPermanently(agent.user_id, agent.full_name || agent.email || "agent")} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive" title="Permanently delete agent and all data"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

                        {/* Contact buttons for applications */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {app.phone && (
                            <a href={`tel:${app.phone}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                            </a>
                          )}
                          {app.phone && (
                            <a href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                              <MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                            </a>
                          )}
                          <a href={`mailto:${app.email}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                            <Mail className="w-3.5 h-3.5 text-accent" /> Email
                          </a>
                        </div>
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
