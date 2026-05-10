import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, ShieldAlert } from "lucide-react";

const APPROVAL_AUTHORITIES = ["RERA", "LDA", "Gram Panchayat", "Nagar Nigam", "Free Hold", "Other"];
const AMENITIES = ["Swimming Pool", "Gym", "Security", "Parking", "Lift", "Power Backup", "Club House", "Garden", "Kids Play Area", "WiFi", "Modular Kitchen", "AC", "Laundry", "Visitor Parking"];

interface Props {
  listing: any;
  userId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const RequestListingUpdateModal = ({ listing, userId, onClose, onSubmitted }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: listing.title || "",
    description: listing.description || "",
    price: listing.price?.toString() || "",
    area: listing.area?.toString() || "",
    bedrooms: listing.bedrooms?.toString() || "",
    bathrooms: listing.bathrooms?.toString() || "",
    parking: listing.parking?.toString() || "0",
    furnishing: listing.furnishing || "Unfurnished",
    facing: listing.facing || "",
    age_of_property: listing.age_of_property || "",
    contact_name: listing.contact_name || "",
    contact_phone: listing.contact_phone || "",
    contact_email: listing.contact_email || "",
    rera_id: listing.rera_id || "",
    approval_authority: listing.approval_authority || "",
    amenities: (listing.amenities || []) as string[],
  });

  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) =>
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));

  const submit = async () => {
    setSubmitting(true);
    try {
      // Build only changed fields
      const proposed: Record<string, any> = {};
      const numericKeys = ["price", "area", "bedrooms", "bathrooms", "parking"];
      const stringKeys = ["title", "description", "furnishing", "facing", "age_of_property", "contact_name", "contact_phone", "contact_email", "rera_id", "approval_authority"];

      for (const k of stringKeys) {
        if ((form as any)[k] !== (listing[k] || "")) proposed[k] = (form as any)[k];
      }
      for (const k of numericKeys) {
        const v = (form as any)[k];
        const nv = v === "" ? null : Number(v);
        if (nv !== (listing[k] ?? null)) proposed[k] = nv;
      }
      const oldAm = JSON.stringify((listing.amenities || []).slice().sort());
      const newAm = JSON.stringify(form.amenities.slice().sort());
      if (oldAm !== newAm) proposed.amenities = form.amenities;

      if (Object.keys(proposed).length === 0) {
        toast({ title: "No changes detected", description: "Modify at least one field before submitting." });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("property_update_requests").insert({
        listing_id: listing.id,
        user_id: userId,
        proposed_changes: proposed,
        status: "pending",
      });
      if (error) throw error;

      toast({ title: "Update request submitted", description: "Super Admin will review your changes shortly." });
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Request Listing Update</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Your changes will be sent to Super Admin for approval. The live listing will only be updated after admin approval.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Title</label>
            <input value={form.title} onChange={e => upd("title", e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => upd("description", e.target.value)} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium mb-1.5">Price (₹)</label><input type="number" value={form.price} onChange={e => upd("price", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Area</label><input type="number" value={form.area} onChange={e => upd("area", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Bedrooms</label><input type="number" value={form.bedrooms} onChange={e => upd("bedrooms", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Bathrooms</label><input type="number" value={form.bathrooms} onChange={e => upd("bathrooms", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Parking</label><input type="number" value={form.parking} onChange={e => upd("parking", e.target.value)} className={inp} /></div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Furnishing</label>
              <select value={form.furnishing} onChange={e => upd("furnishing", e.target.value)} className={inp}>
                {["Unfurnished", "Semi-Furnished", "Fully Furnished"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium mb-1.5">Facing</label><input value={form.facing} onChange={e => upd("facing", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Age</label><input value={form.age_of_property} onChange={e => upd("age_of_property", e.target.value)} placeholder="e.g. 3 Years" className={inp} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5">Approval Authority</label>
              <select value={form.approval_authority} onChange={e => upd("approval_authority", e.target.value)} className={inp}>
                <option value="">Select authority</option>
                {APPROVAL_AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Registration / RERA Number</label>
              <input value={form.rera_id} onChange={e => upd("rera_id", e.target.value)} className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium mb-1.5">Contact Name</label><input value={form.contact_name} onChange={e => upd("contact_name", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Contact Phone</label><input value={form.contact_phone} onChange={e => upd("contact_phone", e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Contact Email</label><input value={form.contact_email} onChange={e => upd("contact_email", e.target.value)} className={inp} /></div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${form.amenities.includes(a) ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{a}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 rounded-xl btn-navy text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit for Admin Approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestListingUpdateModal;