import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Save, MapPin, DollarSign, Building2, Star, Eye, Sliders } from "lucide-react";

interface AdminListingEditorProps {
  listing: any;
  onSave: () => void;
  onClose: () => void;
  adminId: string;
}

const AdminListingEditor = ({ listing, onSave, onClose, adminId }: AdminListingEditorProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: listing.title || "",
    description: listing.description || "",
    listing_type: listing.listing_type || "buy",
    property_type: listing.property_type || "Apartment",
    city: listing.city || "",
    locality: listing.locality || "",
    address: listing.address || "",
    price: listing.price || 0,
    area: listing.area || "",
    area_unit: listing.area_unit || "sq.ft",
    bedrooms: listing.bedrooms ?? "",
    bathrooms: listing.bathrooms ?? "",
    floor: listing.floor ?? "",
    total_floors: listing.total_floors ?? "",
    parking: listing.parking ?? 0,
    furnishing: listing.furnishing || "Unfurnished",
    facing: listing.facing || "",
    age_of_property: listing.age_of_property || "",
    amenities: listing.amenities?.join(", ") || "",
    contact_name: listing.contact_name || "",
    contact_phone: listing.contact_phone || "",
    contact_email: listing.contact_email || "",
    rera_id: listing.rera_id || "",
    society_name: listing.society_name || "",
    builder_name: listing.builder_name || "",
    // Admin-only controls
    status: listing.status || "pending",
    is_featured: listing.is_featured || false,
    is_verified: listing.is_verified || false,
    is_new: listing.is_new || false,
    admin_note: listing.admin_note || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const amenitiesArr = form.amenities ? form.amenities.split(",").map(a => a.trim()).filter(Boolean) : [];

      const { error } = await supabase.from("property_listings").update({
        title: form.title,
        description: form.description || null,
        listing_type: form.listing_type,
        property_type: form.property_type,
        city: form.city,
        locality: form.locality,
        address: form.address || null,
        price: Number(form.price),
        area: form.area ? Number(form.area) : null,
        area_unit: form.area_unit,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floor: form.floor ? Number(form.floor) : null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        parking: Number(form.parking),
        furnishing: form.furnishing,
        facing: form.facing || null,
        age_of_property: form.age_of_property || null,
        amenities: amenitiesArr.length > 0 ? amenitiesArr : null,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        rera_id: form.rera_id || null,
        society_name: form.society_name || null,
        builder_name: form.builder_name || null,
        status: form.status as any,
        is_featured: form.is_featured,
        is_verified: form.is_verified,
        is_new: form.is_new,
        admin_note: form.admin_note || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      }).eq("id", listing.id);

      if (error) throw error;

      await supabase.from("admin_activity_log").insert({
        admin_id: adminId,
        action: "edit_listing",
        entity_type: "property_listing",
        entity_id: listing.id,
        details: { title: form.title, status: form.status, is_featured: form.is_featured },
      });

      toast({ title: "✅ Listing updated!" });
      onSave();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl my-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card rounded-t-2xl border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Sliders className="w-5 h-5" /> Edit Listing (Full Control)
            </h2>
            <p className="text-xs text-muted-foreground">ID: {listing.id.substring(0, 8)}... · Owner: {listing.contact_email || listing.user_id.substring(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Admin Controls - Priority Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> Admin Controls (Placement & Priority)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={fieldClass}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved (Live)</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="rounded" />
                  <span className="text-xs font-medium">⭐ Featured (Top Priority)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="is_verified" checked={form.is_verified} onChange={handleChange} className="rounded" />
                  <span className="text-xs font-medium">✓ Verified</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} className="rounded" />
                  <span className="text-xs font-medium">🆕 New Badge</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Admin Note</label>
                <textarea name="admin_note" value={form.admin_note} onChange={handleChange} rows={2} className={`${fieldClass} resize-none`} placeholder="Internal note or rejection reason..." />
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className={labelClass}>Title</label>
                <input name="title" value={form.title} onChange={handleChange} className={fieldClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={`${fieldClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Listing Type</label>
                <select name="listing_type" value={form.listing_type} onChange={handleChange} className={fieldClass}>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                  <option value="commercial">Commercial</option>
                  <option value="pg">PG</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Property Type</label>
                <select name="property_type" value={form.property_type} onChange={handleChange} className={fieldClass}>
                  {["Apartment", "Villa", "Builder Floor", "Penthouse", "Row House", "Plot", "Studio", "Office Space", "Shop", "Warehouse"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Location (Change Placement Area)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelClass}>City</label><input name="city" value={form.city} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Locality</label><input name="locality" value={form.locality} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Address</label><input name="address" value={form.address} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pricing & Specs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className={labelClass}>Price (₹)</label><input name="price" type="number" value={form.price} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Area</label><input name="area" type="number" value={form.area} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Bedrooms</label><input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Bathrooms</label><input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Floor</label><input name="floor" type="number" value={form.floor} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Total Floors</label><input name="total_floors" type="number" value={form.total_floors} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Parking</label><input name="parking" type="number" value={form.parking} onChange={handleChange} className={fieldClass} /></div>
              <div>
                <label className={labelClass}>Furnishing</label>
                <select name="furnishing" value={form.furnishing} onChange={handleChange} className={fieldClass}>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional */}
          <div className="border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> Additional Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelClass}>Facing</label><input name="facing" value={form.facing} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Age</label><input name="age_of_property" value={form.age_of_property} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>RERA ID</label><input name="rera_id" value={form.rera_id} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Society</label><input name="society_name" value={form.society_name} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Builder</label><input name="builder_name" value={form.builder_name} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Amenities (comma sep)</label><input name="amenities" value={form.amenities} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Contact Name</label><input name="contact_name" value={form.contact_name} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Contact Phone</label><input name="contact_phone" value={form.contact_phone} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>Contact Email</label><input name="contact_email" value={form.contact_email} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card rounded-b-2xl border-t border-border p-5 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminListingEditor;
