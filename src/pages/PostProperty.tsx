import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Upload, MapPin, Home } from "lucide-react";

const PostProperty = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ listingType: "sell", propertyType: "Apartment", city: "", locality: "", bedrooms: "2", area: "", price: "", title: "", description: "", furnishing: "Unfurnished", contactName: "", phone: "" });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
            {["Property Info", "Details", "Contact"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${step > i + 1 ? "bg-gradient-gold text-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-xl mb-4">Property Information</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">I want to</label>
                  <div className="flex gap-3">
                    {[["sell", "Sell"], ["rent", "Rent Out"], ["pg", "Rent as PG"]].map(([v, l]) => (
                      <button key={v} onClick={() => update("listingType", v)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.listingType === v ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Apartment", "Villa", "Builder Floor", "Plot", "Studio", "Office"].map(t => (
                      <button key={t} onClick={() => update("propertyType", t)} className={`py-2 rounded-xl border text-sm font-medium transition-all ${form.propertyType === t ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Mumbai" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Locality</label>
                    <input value={form.locality} onChange={e => update("locality", e.target.value)} placeholder="e.g. Bandra West" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
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
                    <label className="block text-sm font-medium mb-2">Furnishing</label>
                    <select value={form.furnishing} onChange={e => update("furnishing", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none">
                      {["Unfurnished", "Semi-Furnished", "Fully Furnished"].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Area (sq.ft)</label>
                    <input type="number" value={form.area} onChange={e => update("area", e.target.value)} placeholder="e.g. 1200" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Expected Price (₹)</label>
                    <input type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder="e.g. 5000000" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Property Title</label>
                  <input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Spacious 3BHK with City View" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} placeholder="Describe your property..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload Property Photos</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB each. Max 20 photos.</p>
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
                <div className="bg-surface rounded-xl p-4 text-sm text-muted-foreground">
                  ✅ By submitting, your listing will go live on PropEstate after verification (usually within 24 hours).
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-5 border-t border-border">
              {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Back</button>}
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl btn-gold text-sm font-medium">Continue →</button>
              ) : (
                <button onClick={() => navigate("/")} className="flex-1 py-2.5 rounded-xl btn-navy text-sm font-medium">Submit Property Listing</button>
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
