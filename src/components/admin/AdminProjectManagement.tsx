import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Star, Building2, Upload, Image } from "lucide-react";

interface AdminProjectManagementProps {
  adminId: string;
}

const AdminProjectManagement = ({ adminId }: AdminProjectManagementProps) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", builder: "", city: "", locality: "", type: "Residential",
    configs: "", min_price: 0, max_price: 0, image: "",
    images: [] as string[],
    possession_date: "", rera_id: "", amenities: "", rating: 0,
    total_units: 0, available_units: 0, is_featured: false, is_new: true,
    description: "", status: "draft",
  });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await (supabase.from("new_projects") as any).select("*").order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: "", builder: "", city: "", locality: "", type: "Residential", configs: "", min_price: 0, max_price: 0, image: "", images: [], possession_date: "", rera_id: "", amenities: "", rating: 0, total_units: 0, available_units: 0, is_featured: false, is_new: true, description: "", status: "draft" });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: any) => {
    setForm({
      name: p.name, builder: p.builder, city: p.city, locality: p.locality, type: p.type,
      configs: (p.configs || []).join(", "), min_price: p.min_price, max_price: p.max_price,
      image: p.image || "", images: p.images || [],
      possession_date: p.possession_date || "", rera_id: p.rera_id || "",
      amenities: (p.amenities || []).join(", "), rating: p.rating || 0, total_units: p.total_units || 0,
      available_units: p.available_units || 0, is_featured: p.is_featured, is_new: p.is_new,
      description: p.description || "", status: p.status,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        newImages.push(urlData.publicUrl);
      }
    }
    setForm(f => ({
      ...f,
      images: [...f.images, ...newImages],
      image: f.image || newImages[0] || "",
    }));
    setUploading(false);
    toast({ title: `${newImages.length} image(s) uploaded` });
  };

  const removeImage = (idx: number) => {
    setForm(f => {
      const updated = f.images.filter((_, i) => i !== idx);
      return { ...f, images: updated, image: updated[0] || "" };
    });
  };

  const saveProject = async () => {
    if (!form.name || !form.builder || !form.city || !form.locality) {
      toast({ title: "Fill required fields", variant: "destructive" }); return;
    }
    const payload = {
      name: form.name, builder: form.builder, city: form.city, locality: form.locality,
      type: form.type, configs: form.configs.split(",").map(s => s.trim()).filter(Boolean),
      min_price: form.min_price, max_price: form.max_price,
      image: form.images[0] || form.image || null,
      images: form.images.length > 0 ? form.images : (form.image ? [form.image] : []),
      possession_date: form.possession_date || null, rera_id: form.rera_id || null,
      amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean),
      rating: form.rating, total_units: form.total_units, available_units: form.available_units,
      is_featured: form.is_featured, is_new: form.is_new, description: form.description || null,
      status: form.status, created_by: adminId,
    };

    let error;
    if (editingId) {
      ({ error } = await (supabase.from("new_projects") as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase.from("new_projects") as any).insert(payload));
    }

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    await supabase.from("admin_activity_log").insert({
      admin_id: adminId, action: editingId ? "update_project" : "create_project",
      entity_type: "new_project", entity_id: editingId || "new", details: { name: form.name },
    });

    toast({ title: editingId ? "Project updated!" : "Project created!" });
    resetForm();
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project permanently?")) return;
    await (supabase.from("new_projects") as any).delete().eq("id", id);
    await supabase.from("admin_activity_log").insert({
      admin_id: adminId, action: "delete_project", entity_type: "new_project", entity_id: id,
    });
    toast({ title: "Project deleted" }); fetchProjects();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    await (supabase.from("new_projects") as any).update({ status: newStatus }).eq("id", id);
    toast({ title: `Project ${newStatus}` }); fetchProjects();
  };

  const fieldClass = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg">{projects.length} Projects</h3>
          <p className="text-xs text-muted-foreground">Manage new builder projects visible on /new-projects</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm && !editingId ? "Cancel" : "Add Project"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-accent/30 p-6">
          <h4 className="font-display font-semibold mb-4">{editingId ? "Edit Project" : "Add New Project"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Project Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Godrej Meridian" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Builder *</label><input value={form.builder} onChange={e => setForm(f => ({ ...f, builder: e.target.value }))} placeholder="Godrej Properties" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City *</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Locality *</label><input value={form.locality} onChange={e => setForm(f => ({ ...f, locality: e.target.value }))} placeholder="Bandra West" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={fieldClass}>
                <option>Residential</option><option>Commercial</option><option>Mixed Use</option><option>Luxury Residential</option><option>Township</option>
              </select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Configs (comma-separated)</label><input value={form.configs} onChange={e => setForm(f => ({ ...f, configs: e.target.value }))} placeholder="1 BHK, 2 BHK, 3 BHK" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Min Price (₹)</label><input type="number" value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: Number(e.target.value) }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Max Price (₹)</label><input type="number" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: Number(e.target.value) }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Possession Date</label><input value={form.possession_date} onChange={e => setForm(f => ({ ...f, possession_date: e.target.value }))} placeholder="Dec 2026" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">RERA ID</label><input value={form.rera_id} onChange={e => setForm(f => ({ ...f, rera_id: e.target.value }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Amenities (comma-separated)</label><input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="Swimming Pool, Gym, Club House" className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Rating</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Total Units</label><input type="number" value={form.total_units} onChange={e => setForm(f => ({ ...f, total_units: Number(e.target.value) }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Available Units</label><input type="number" value={form.available_units} onChange={e => setForm(f => ({ ...f, available_units: Number(e.target.value) }))} className={fieldClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={fieldClass}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_new} onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} /> New Launch</label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Project Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border border-border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">Cover</span>}
                </div>
              ))}
              <label className={`w-24 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">First image is used as cover. Upload up to 10 images.</p>
          </div>

          <div className="mt-3"><label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Project description..." className={fieldClass + " resize-none"} /></div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveProject} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> {editingId ? "Update" : "Create"}</button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No projects yet. Click "Add Project" to create your first builder project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className={`bg-card rounded-2xl border p-5 ${p.status === "published" ? "border-emerald-500/20" : "border-border"}`}>
              <div className="flex items-start gap-4">
                {(p.image || p.images?.[0]) && <img src={p.images?.[0] || p.image} alt={p.name} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-display font-bold text-sm">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${p.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : p.status === "archived" ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>{p.status}</span>
                    {p.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">⭐ Featured</span>}
                    {p.is_new && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">New</span>}
                    {p.images?.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20"><Image className="w-3 h-3 inline" /> {p.images.length}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.builder} · {p.locality}, {p.city}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ₹{Number(p.min_price).toLocaleString("en-IN")} – ₹{Number(p.max_price).toLocaleString("en-IN")} · {p.total_units} units · {p.available_units} available
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleStatus(p.id, p.status)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title={p.status === "published" ? "Unpublish" : "Publish"}>
                    {p.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteProject(p.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectManagement;
