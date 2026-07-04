import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, X, Building2 } from "lucide-react";

interface AdminAddPropertyProps {
  userId: string;
  onSuccess: () => void;
}

const AdminAddProperty = ({ userId, onSuccess }: AdminAddPropertyProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    listing_type: "buy",
    property_type: "Apartment",
    city: "",
    locality: "",
    address: "",
    price: "",
    area: "",
    area_unit: "sq.ft",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    total_floors: "",
    parking: "0",
    furnishing: "Unfurnished",
    facing: "",
    age_of_property: "",
    amenities: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    rera_id: "",
    society_name: "",
    builder_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.city || !form.locality || !form.price) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const amenitiesArr = form.amenities ? form.amenities.split(",").map(a => a.trim()).filter(Boolean) : [];

      const { error } = await supabase.from("property_listings").insert({
        user_id: userId,
        title: form.title,
        description: form.description,
        listing_type: form.listing_type,
        property_type: form.property_type,
        city: form.city,
        locality: form.locality,
        address: form.address,
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
        images: imageUrls.length > 0 ? imageUrls : null,
        status: "approved",
        is_verified: true,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: "✅ Property added and published!" });
      setForm({
        title: "", description: "", listing_type: "buy", property_type: "Apartment",
        city: "", locality: "", address: "", price: "", area: "", area_unit: "sq.ft",
        bedrooms: "", bathrooms: "", floor: "", total_floors: "", parking: "0",
        furnishing: "Unfurnished", facing: "", age_of_property: "", amenities: "",
        contact_name: "", contact_phone: "", contact_email: "", rera_id: "",
        society_name: "", builder_name: "",
      });
      setImages([]);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Basic Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g., Luxurious 3BHK Apartment" className={fieldClass} required />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Property description..." rows={3} className={`${fieldClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Listing Type *</label>
            <select name="listing_type" value={form.listing_type} onChange={handleChange} className={fieldClass}>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
              <option value="commercial">Commercial</option>
              <option value="pg">PG</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Property Type *</label>
            <select name="property_type" value={form.property_type} onChange={handleChange} className={fieldClass}>
              {["Apartment", "Villa", "Builder Floor", "Penthouse", "Row House", "Plot", "Studio", "Office Space", "Shop", "Warehouse", "Agriculture Land"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>City *</label><input name="city" value={form.city} onChange={handleChange} placeholder="Lucknow" className={fieldClass} required /></div>
          <div><label className={labelClass}>Locality *</label><input name="locality" value={form.locality} onChange={handleChange} placeholder="Bandra West" className={fieldClass} required /></div>
          <div><label className={labelClass}>Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="Full address" className={fieldClass} /></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4">Pricing & Area</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Price (₹) *</label><input name="price" type="number" value={form.price} onChange={handleChange} placeholder="1500000" className={fieldClass} required /></div>
          <div><label className={labelClass}>Area</label><input name="area" type="number" value={form.area} onChange={handleChange} placeholder="1200" className={fieldClass} /></div>
          <div><label className={labelClass}>Area Unit</label><select name="area_unit" value={form.area_unit} onChange={handleChange} className={fieldClass}><option value="sq.ft">sq.ft</option><option value="sq.m">sq.m</option><option value="sq.yd">sq.yard</option><option value="biswa">Biswa</option><option value="bigha">Bigha</option><option value="acre">Acre</option><option value="hectare">Hectare</option></select></div>
          <div><label className={labelClass}>Furnishing</label><select name="furnishing" value={form.furnishing} onChange={handleChange} className={fieldClass}><option value="Unfurnished">Unfurnished</option><option value="Semi-Furnished">Semi-Furnished</option><option value="Fully Furnished">Fully Furnished</option></select></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4">Property Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Bedrooms</label><input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Bathrooms</label><input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Floor</label><input name="floor" type="number" value={form.floor} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Total Floors</label><input name="total_floors" type="number" value={form.total_floors} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Parking</label><input name="parking" type="number" value={form.parking} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Facing</label><input name="facing" value={form.facing} onChange={handleChange} placeholder="East" className={fieldClass} /></div>
          <div><label className={labelClass}>Age</label><input name="age_of_property" value={form.age_of_property} onChange={handleChange} placeholder="3 Years" className={fieldClass} /></div>
          <div><label className={labelClass}>RERA ID</label><input name="rera_id" value={form.rera_id} onChange={handleChange} className={fieldClass} /></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4">Additional Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Society Name</label><input name="society_name" value={form.society_name} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Builder Name</label><input name="builder_name" value={form.builder_name} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Amenities (comma separated)</label><input name="amenities" value={form.amenities} onChange={handleChange} placeholder="Pool, Gym, Security" className={fieldClass} /></div>
          <div><label className={labelClass}>Contact Name</label><input name="contact_name" value={form.contact_name} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Contact Phone</label><input name="contact_phone" value={form.contact_phone} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Contact Email</label><input name="contact_email" value={form.contact_email} onChange={handleChange} className={fieldClass} /></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> Images</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((file, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl border border-border overflow-hidden group">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground" />
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Upload property images. Click + to add.</p>
      </div>

      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Publishing..." : "Add & Publish Property"}
      </button>
    </form>
  );
};

export default AdminAddProperty;
