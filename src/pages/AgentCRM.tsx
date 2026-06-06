import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Phone, Mail, IndianRupee, Calendar, CheckCircle2, Trash2, X, Clock, Target } from "lucide-react";

const STAGES = [
  { id: "new", label: "New", color: "border-blue-500/40 bg-blue-500/5" },
  { id: "contacted", label: "Contacted", color: "border-amber-500/40 bg-amber-500/5" },
  { id: "qualified", label: "Qualified", color: "border-purple-500/40 bg-purple-500/5" },
  { id: "viewing", label: "Viewing", color: "border-cyan-500/40 bg-cyan-500/5" },
  { id: "negotiation", label: "Negotiation", color: "border-orange-500/40 bg-orange-500/5" },
  { id: "won", label: "Won", color: "border-emerald-500/40 bg-emerald-500/5" },
  { id: "lost", label: "Lost", color: "border-red-500/40 bg-red-500/5" },
];

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  budget: string | null;
  stage: string;
  status: string;
  deal_value: number | null;
  commission: number | null;
  expected_close_date: string | null;
  notes: string | null;
  property_id: string | null;
  created_at: string;
  org_id: string | null;
};

type Task = {
  id: string;
  lead_id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
};

export default function AgentCRM() {
  const { user, role, loading: authLoading } = useAuth();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [scope, setScope] = useState<"mine" | "org">("mine");
  const [newTask, setNewTask] = useState({ title: "", due_at: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    if (role !== "agent" && role !== "admin" && role !== "moderator") { navigate("/dashboard"); return; }
    void load();
  }, [user, role, authLoading, scope, currentOrg?.org_id]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("leads").select("*").order("stage_updated_at", { ascending: false } as any);
    if (scope === "org" && currentOrg) q = q.eq("org_id", currentOrg.org_id);
    else q = q.eq("agent_id", user!.id);
    const { data: leadData } = await q;
    setLeads((leadData as Lead[]) || []);

    const { data: taskData } = await (supabase as any)
      .from("lead_tasks")
      .select("*")
      .order("due_at", { ascending: true });
    setTasks((taskData as Task[]) || []);
    setLoading(false);
  };

  const moveStage = async (id: string, stage: string) => {
    const prev = leads;
    setLeads(prev.map(l => l.id === id ? { ...l, stage } : l));
    const status = stage === "won" ? "converted" : stage === "lost" ? "closed" : stage === "contacted" ? "contacted" : "new";
    const { error } = await (supabase as any).from("leads").update({ stage, status, stage_updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { setLeads(prev); toast({ title: "Move failed", variant: "destructive" }); }
  };

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    if (selected?.id === id) setSelected({ ...selected, ...patch } as Lead);
    await (supabase as any).from("leads").update(patch).eq("id", id);
  };

  const addTask = async () => {
    if (!selected || !newTask.title.trim()) return;
    const { data, error } = await (supabase as any).from("lead_tasks").insert({
      lead_id: selected.id,
      agent_id: user!.id,
      org_id: selected.org_id,
      title: newTask.title.trim(),
      due_at: newTask.due_at || null,
    }).select().single();
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setTasks(t => [...t, data as Task]);
    setNewTask({ title: "", due_at: "" });
  };

  const toggleTask = async (t: Task) => {
    const completed_at = t.completed_at ? null : new Date().toISOString();
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, completed_at } : x));
    await (supabase as any).from("lead_tasks").update({ completed_at }).eq("id", t.id);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await (supabase as any).from("lead_tasks").delete().eq("id", id);
  };

  const commission = useMemo(() => {
    const won = leads.filter(l => l.stage === "won");
    const total = won.reduce((s, l) => s + Number(l.commission || 0), 0);
    const pipeline = leads.filter(l => !["won", "lost"].includes(l.stage)).reduce((s, l) => s + Number(l.deal_value || 0), 0);
    return { total, won: won.length, pipeline };
  }, [leads]);

  const tasksByLead = useMemo(() => {
    const m: Record<string, Task[]> = {};
    tasks.forEach(t => { (m[t.lead_id] ||= []).push(t); });
    return m;
  }, [tasks]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/agent-dashboard" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg truncate">Lead Pipeline</h1>
              <p className="text-[11px] text-muted-foreground">Drag cards across stages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentOrg && (
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button onClick={() => setScope("mine")} className={`px-3 py-1.5 ${scope === "mine" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Mine</button>
                <button onClick={() => setScope("org")} className={`px-3 py-1.5 ${scope === "org" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{currentOrg.organization.name}</button>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border">
          <div className="bg-card rounded-xl border border-border p-3"><p className="text-[10px] text-muted-foreground uppercase">Total Leads</p><p className="font-display font-bold text-lg">{leads.length}</p></div>
          <div className="bg-card rounded-xl border border-border p-3"><p className="text-[10px] text-muted-foreground uppercase">Pipeline Value</p><p className="font-display font-bold text-lg">₹{commission.pipeline.toLocaleString("en-IN")}</p></div>
          <div className="bg-card rounded-xl border border-border p-3"><p className="text-[10px] text-muted-foreground uppercase">Deals Won</p><p className="font-display font-bold text-lg">{commission.won}</p></div>
          <div className="bg-card rounded-xl border border-border p-3"><p className="text-[10px] text-muted-foreground uppercase">Commission Earned</p><p className="font-display font-bold text-lg text-emerald-600">₹{commission.total.toLocaleString("en-IN")}</p></div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(stage => {
            const items = leads.filter(l => l.stage === stage.id);
            const value = items.reduce((s, l) => s + Number(l.deal_value || 0), 0);
            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-2xl border-2 ${stage.color} ${dragOver === stage.id ? "ring-2 ring-accent" : ""} p-3 flex flex-col`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => { if (dragId) moveStage(dragId, stage.id); setDragId(null); setDragOver(null); }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <p className="font-semibold text-sm">{stage.label}</p>
                    <p className="text-[10px] text-muted-foreground">{items.length} · ₹{value.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.map(lead => {
                    const taskCount = tasksByLead[lead.id]?.filter(t => !t.completed_at).length || 0;
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDragId(lead.id)}
                        onClick={() => setSelected(lead)}
                        className="bg-card rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing hover:border-accent transition-all"
                      >
                        <p className="font-medium text-sm truncate">{lead.full_name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                        {lead.deal_value ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                            <IndianRupee className="w-3 h-3" />{Number(lead.deal_value).toLocaleString("en-IN")}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                          {taskCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{taskCount} task{taskCount > 1 ? "s" : ""}</span>}
                          {lead.expected_close_date && <span className="text-muted-foreground">Close {new Date(lead.expected_close_date).toLocaleDateString("en-IN")}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Drop leads here</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div className="w-full max-w-md bg-card border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold">{selected.full_name}</h3>
                <p className="text-xs text-muted-foreground capitalize">Stage: {selected.stage}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="w-4 h-4" />{selected.phone}</a>
                {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="w-4 h-4" />{selected.email}</a>}
                {selected.budget && <p className="text-muted-foreground">Budget: {selected.budget}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Deal Value (₹)</label>
                  <input type="number" defaultValue={selected.deal_value || 0} onBlur={(e) => updateLead(selected.id, { deal_value: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Commission (₹)</label>
                  <input type="number" defaultValue={selected.commission || 0} onBlur={(e) => updateLead(selected.id, { commission: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Expected Close</label>
                <input type="date" defaultValue={selected.expected_close_date || ""} onBlur={(e) => updateLead(selected.id, { expected_close_date: e.target.value || null })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Notes</label>
                <textarea defaultValue={selected.notes || ""} onBlur={(e) => updateLead(selected.id, { notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground uppercase">Move to stage</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => moveStage(selected.id, s.id)} className={`px-2.5 py-1 rounded-lg text-xs border ${selected.stage === s.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-accent" />
                  <h4 className="font-semibold text-sm">Follow-up Tasks</h4>
                </div>
                <div className="space-y-2">
                  {(tasksByLead[selected.id] || []).map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <button onClick={() => toggleTask(t)} className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${t.completed_at ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"}`}>
                        {t.completed_at && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${t.completed_at ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                        {t.due_at && <p className="text-[10px] text-muted-foreground"><Calendar className="w-2.5 h-2.5 inline" /> {new Date(t.due_at).toLocaleString("en-IN")}</p>}
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="New task..." className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                  <input type="datetime-local" value={newTask.due_at} onChange={e => setNewTask({ ...newTask, due_at: e.target.value })} className="px-2 py-2 rounded-lg border border-border bg-background text-xs" />
                  <button onClick={addTask} className="px-3 rounded-lg bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}