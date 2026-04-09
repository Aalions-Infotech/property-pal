import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Upload, Clock, Info, X, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PostProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    listingType: "sell",
    propertyType: "Apartment",
    city: "",
    locality: "",
    address: "",
    bedrooms: "2",
    bathrooms: "2",
    area: "",
    furnishing: "Unfurnished",
    facing: "",
    parking: "1",
    price: "",
    title: "",
    description: "",
    amenities: [] as string[],
    contactName: "",
    phone: "",
    contactEmail: "",
    reraId: "",
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

  const amenitiesList = ["Swimming Pool", "Gym", "Security", "Parking", "Lift", "Power Backup", "Club House", "Garden", "Kids Play Area", "WiFi", "Modular Kitchen", "AC", "Laundry", "Visitor Parking"];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: `${f.name} is too large (max 10MB)`, variant: "destructive" });
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(f.type)) {
        toast({ title: `${f.name} is not a supported format`, variant: "destructive" });
        return false;
      }
      return true;
    });

    const totalImages = images.length + validFiles.length;
    if (totalImages > 20) {
      toast({ title: "Maximum 20 photos allowed", variant: "destructive" });
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (listingId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { contentType: file.type });
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!form.city || !form.locality || !form.price || !form.title) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const listingId = crypto.randomUUID();
      let imageUrls: string[] = [];

      if (images.length > 0) {
        setUploadingImages(true);
        imageUrls = await uploadImages(listingId);
        setUploadingImages(false);
      }

      const { error } = await supabase.from("property_listings").insert({
        id: listingId,
        user_id: user.id,
        title: form.title,
        description: form.description,
        listing_type: form.listingType,
        property_type: form.propertyType,
        city: form.city,
        locality: form.locality,
        address: form.address,
        bedrooms: parseInt(form.bedrooms) || null,
        bathrooms: parseInt(form.bathrooms) || null,
        area: parseFloat(form.area) || null,
        area_unit: "sq.ft",
        furnishing: form.furnishing,
        facing: form.facing || null,
        parking: parseInt(form.parking) || 0,
        price: parseFloat(form.price),
        price_unit: form.listingType === "sell" ? "total" : "monthly",
        price_per_sqft: form.area && form.price ? Math.round(parseFloat(form.price) / parseFloat(form.area)) : null,
        amenities: form.amenities,
        images: imageUrls.length > 0 ? imageUrls : null,
        contact_name: form.contactName || null,
        contact_phone: form.phone || null,
        contact_email: form.contactEmail || user.email,
        rera_id: form.reraId || null,
        status: "pending",
        is_new: true,
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Property Submitted Successfully!",
        message: `Your listing "${form.title}" has been submitted and is pending admin approval. You'll be notified once it's reviewed.`,
        type: "info",
      });
      toast({ title: "Property submitted!", description: "Your listing is pending admin approval." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-display font-bold text-white mb-2">Post Your Property</h1>
            <p className="text-white/60 text-sm">List for FREE and connect with 5L+ buyers & tenants</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {["Property Info", "Details & Photos", "Contact"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${step > i + 1 ? "bg-gradient-gold text-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && !user && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You need to <button onClick={() => navigate("/auth")} className="underline font-medium">sign in</button> to submit a property listing.
              </p>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-xl mb-4">Property Information</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">I want to</label>
                  <div className="flex gap-3">
                    {[["sell", "Sell"], ["rent", "Rent Out"], ["pg", "Rent as PG"], ["commercial", "Commercial"]].map(([v, l]) => (
                      <button key={v} onClick={() => update("listingType", v)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.listingType === v ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Apartment", "Villa", "Builder Floor", "Plot", "Studio", "Office", "Shop", "Warehouse", "PG", "Agriculture Land"].map(t => (
                      <button key={t} onClick={() => update("propertyType", t)} className={`py-2 rounded-xl border text-sm font-medium transition-all ${form.propertyType === t ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City <span className="text-red-500">*</span></label>
                    <input value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Mumbai" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Locality <span className="text-red-500">*</span></label>
                    <input value={form.locality} onChange={e => update("locality", e.target.value)} placeholder="e.g. Bandra West" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Address</label>
                  <input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Street, building, landmark..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">RERA Registration Number (optional)</label>
                  <input value={form.reraId} onChange={e => update("reraId", e.target.value)} placeholder="e.g. P52100026542" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-xl mb-4">Property Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bedrooms</label>
                    <div className="flex gap-2">
                      {["1", "2", "3", "4", "5+"].map(b => (
                        <button key={b} onClick={() => update("bedrooms", b)} className={`flex-1 py-2 rounded-lg border text-sm font-medium ${form.bedrooms === b ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bathrooms</label>
                    <div className="flex gap-2">
                      {["1", "2", "3", "4+"].map(b => (
                        <button key={b} onClick={() => update("bathrooms", b)} className={`flex-1 py-2 rounded-lg border text-sm font-medium ${form.bathrooms === b ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Furnishing</label>
                    <select value={form.furnishing} onChange={e => update("furnishing", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none">
                      {["Unfurnished", "Semi-Furnished", "Fully Furnished"].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Facing</label>
                    <select value={form.facing} onChange={e => update("facing", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none">
                      <option value="">Select facing</option>
                      {["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Area (sq.ft) <span className="text-red-500">*</span></label>
                    <input type="number" value={form.area} onChange={e => update("area", e.target.value)} placeholder="e.g. 1200" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {form.listingType === "sell" ? "Expected Price (₹)" : "Monthly Rent (₹)"} <span className="text-red-500">*</span>
                    </label>
                    <input type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder={form.listingType === "sell" ? "e.g. 5000000" : "e.g. 25000"} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Property Title <span className="text-red-500">*</span></label>
                  <input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Spacious 3BHK with City View in Bandra West" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} placeholder="Describe your property, unique features, nearby landmarks..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map(a => (
                      <button key={a} onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${form.amenities.includes(a) ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{a}</button>
                    ))}
                  </div>
                </div>

                {/* Multi-photo upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Property Photos ({images.length}/20)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {imagePreviews.map((preview, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                          <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-medium">Cover</span>
                          )}
                        </div>
                      ))}
                      {images.length < 20 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <ImagePlus className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Add More</span>
                        </button>
                      )}
                    </div>
                  )}
                  {imagePreviews.length === 0 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Upload Property Photos</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 10MB each. Max 20 photos.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-xl mb-4">Contact Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Name</label>
                    <input value={form.contactName} onChange={e => update("contactName", e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} placeholder={user?.email || "your@email.com"} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-blue-700 dark:text-blue-400">Pending Admin Approval</p>
                      <p className="text-xs text-blue-600/70 mt-1">
                        Your listing will be reviewed by our team within 24 hours. You'll receive a notification once it's approved or if any changes are needed. Approved listings go live immediately!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
                  ✅ Listing on Ekananda Estate is <strong>completely FREE</strong>. Optional sponsorship is available to boost your listing to the top.
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-5 border-t border-border">
              {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Back</button>}
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl btn-gold text-sm font-medium">Continue →</button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl btn-navy text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadingImages ? "Uploading photos..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit for Approval"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PostProperty;
