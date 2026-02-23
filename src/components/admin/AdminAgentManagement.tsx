import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Phone, Mail, MessageSquare, Edit, Save, X, CheckCircle, MapPin, Star } from "lucide-react";

interface AdminAgentManagementProps {
  users: any[];
  userRoles: any[];
  onRefresh: () => void;
  adminId: string;
}

const AdminAgentManagement = ({ users, userRoles, onRefresh, adminId }: AdminAgentManagementProps) => {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", city: "", bio: "" });
  const [createForm, setCreateForm] = useState({ email: "", password: "", full_name: "", phone: "", city: "", bio: "" });
  const [loading, setLoading] = useState(false);

  const agents = users.filter(u => {
    const role = userRoles.find(r => r.user_id === u.user_id);
    return role?.role === "agent";
  });

  const createAgent = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Create user via edge function or directly
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: { data: { full_name: createForm.full_name } },
      });

      if (authErr) throw authErr;

      if (authData.user) {
        // Update profile
        await supabase.from("profiles").update({
          full_name: createForm.full_name,
          phone: createForm.phone || null,
          city: createForm.city || null,
          bio: createForm.bio || null,
          is_verified: true,
        }).eq("user_id", authData.user.id);

        // Set agent role
        await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "agent" as any,
          assigned_by: adminId,
        });

        await supabase.from("admin_activity_log").insert({
          admin_id: adminId, action: "create_agent", entity_type: "user", entity_id: authData.user.id,
          details: { email: createForm.email, name: createForm.full_name },
        });
      }

      toast({ title: "✅ Agent created successfully!" });
      setCreateForm({ email: "", password: "", full_name: "", phone: "", city: "", bio: "" });
      setShowCreateForm(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeAgent = async (userId: string) => {
    if (!confirm("Remove this agent? They will be demoted to regular user.")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: "user" as any, assigned_by: adminId });
    await supabase.from("admin_activity_log").insert({
      admin_id: adminId, action: "remove_agent", entity_type: "user", entity_id: userId,
    });
    toast({ title: "Agent removed (demoted to user)" });
    onRefresh();
  };

  const startEdit = (agent: any) => {
    setEditingId(agent.user_id);
    setEditForm({ full_name: agent.full_name || "", phone: agent.phone || "", city: agent.city || "", bio: agent.bio || "" });
  };

  const saveEdit = async (userId: string) => {
    await supabase.from("profiles").update({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      city: editForm.city || null,
      bio: editForm.bio || null,
    }).eq("user_id", userId);
    toast({ title: "Agent profile updated!" });
    setEditingId(null);
    onRefresh();
  };

  const fieldClass = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="space-y-4">
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
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label><input value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Rajesh Mehta" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label><input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="agent@email.com" type="email" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label><input value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" type="password" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label><input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City</label><input value={createForm.city} onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label><input value={createForm.bio} onChange={e => setCreateForm(f => ({ ...f, bio: e.target.value }))} placeholder="Specialization..." className={fieldClass} /></div>
          </div>
          <button onClick={createAgent} disabled={loading} className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {loading ? "Creating..." : "Create Agent Account"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {agents.map(agent => (
          <div key={agent.id} className="bg-card rounded-2xl border border-border p-5">
            {editingId === agent.user_id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full Name" className={fieldClass} />
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={fieldClass} />
                  <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className={fieldClass} />
                  <input value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio / Specialization" className={fieldClass} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(agent.user_id)} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-medium border border-emerald-500/20 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-lg">{(agent.full_name || "A")[0].toUpperCase()}</span>
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

                  {/* Action buttons - Call, Message, Email */}
                  <div className="flex gap-2 mt-3">
                    <a href={`tel:${agent.phone || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                    </a>
                    <a href={`sms:${agent.phone || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Message
                    </a>
                    <a href={`mailto:${agent.email || ""}`} className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted flex items-center gap-1.5 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-purple-500" /> Email
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(agent)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => removeAgent(agent.user_id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500" title="Remove agent"><Trash2 className="w-4 h-4" /></button>
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
    </div>
  );
};

export default AdminAgentManagement;
