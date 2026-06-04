import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, CheckCircle, Shield, TrendingUp, Building2, Loader2, Camera } from "lucide-react";

const BecomeAgent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    bio: "",
    experience_years: 0,
    specialization: "",
    languages: "",
    reason: "",
    rera_number: "",
  });

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => ({ ...prev, email: prev.email || user.email || "" }));
  }, [user?.email]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Profile photo must be under 5MB", variant: "destructive" });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadProfilePhoto = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${userId}/agent-profile/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(path, avatarFile, { contentType: avatarFile.type, upsert: false });

    setUploadingAvatar(false);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("property-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth?redirect=/become-agent");
      return;
    }

    if (!form.full_name || !form.email || !form.phone || !avatarFile) {
      toast({ title: "Please fill all required fields (including profile photo)", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: existingApplications, error: existingError } = await supabase
        .from("agent_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingError) throw existingError;

      const existing = existingApplications?.[0];

      if (existing?.status === "approved") {
        toast({
          title: "Already approved",
          description: "Your account is already approved as an agent. Redirecting to dashboard...",
        });
        navigate("/agent-dashboard");
        return;
      }

      if (existing?.status === "pending") {
        toast({
          title: "Application already submitted",
          description: "Your application is under review. Please wait for admin approval.",
        });
        return;
      }

      const avatarUrl = await uploadProfilePhoto(user.id);

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            city: form.city || null,
            bio: form.bio || null,
            avatar_url: avatarUrl,
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      const { error: applicationError } = await supabase.from("agent_applications").insert({
        user_id: user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        city: form.city || null,
        bio: form.bio || null,
        experience_years: form.experience_years || 0,
        specialization: form.specialization || null,
        languages: form.languages || null,
        reason: form.reason || null,
        rera_number: form.rera_number || null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        admin_note: null,
      });

      if (applicationError) throw applicationError;

      setSubmitted(true);
      toast({
        title: "🎉 Application Submitted!",
        description: "Our team will review your profile and approve your agent account soon.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Building2, title: "List Properties", desc: "Add and manage property listings for your clients" },
    { icon: TrendingUp, title: "Track Performance", desc: "Monitor your sales, commissions, and client pipeline" },
    { icon: Shield, title: "Verified Badge", desc: "Get a verified agent badge that builds client trust" },
    { icon: UserPlus, title: "Dedicated Dashboard", desc: "Access an enterprise agent dashboard with full analytics" },
  ];

  const fieldClass = "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent transition-all";

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[80vh]">
          <div className="max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">Your application to become an Ekananda Estate agent has been submitted. Our admin team will review it soon and notify you after approval.</p>
            <button onClick={() => navigate("/")} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-medium">Back to Home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-gold text-xs font-bold tracking-widest mb-3">BECOME AN EKANANDA ESTATE AGENT</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Join India's Largest<br /><span className="text-gold">Real Estate Network</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">Get verified, list properties, track sales, and grow your real estate business with our enterprise tools.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 -mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="bg-card rounded-2xl border border-border p-5 text-center shadow-card">
                <b.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <h3 className="font-display font-bold text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <h2 className="text-xl font-display font-bold mb-1">Agent Application Form</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill in your details and upload your profile photo. Admin will review and approve your profile.</p>

            {!user && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You need to be logged in to complete self-registration.</p>
                <button onClick={() => navigate("/auth?redirect=/become-agent")} className="mt-2 btn-gold px-4 py-2 rounded-xl text-sm font-medium">Sign In / Sign Up</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Profile Photo *</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Selected profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                    <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                      {avatarPreview ? "Change Photo" : "Upload Photo"}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                  <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your full name" required className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" type="email" required className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone *</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" required className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">City</label>
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Lucknow" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Experience (Years)</label>
                  <input value={form.experience_years} onChange={(e) => update("experience_years", parseInt(e.target.value) || 0)} type="number" min={0} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Specialization</label>
                  <input value={form.specialization} onChange={(e) => update("specialization", e.target.value)} placeholder="Residential, Commercial, Luxury..." className={fieldClass} />
                </div>
                 <div>
                   <label className="block text-sm font-medium mb-1.5">Languages</label>
                   <input value={form.languages} onChange={(e) => update("languages", e.target.value)} placeholder="English, Hindi, Marathi..." className={fieldClass} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1.5">RERA Registration No.</label>
                   <input value={form.rera_number} onChange={(e) => update("rera_number", e.target.value)} placeholder="e.g. P52100026542" className={fieldClass} />
                   <p className="text-xs text-muted-foreground mt-1">If you are RERA registered, enter your number for verification badge</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Bio / About You</label>
                <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell us about your real estate experience..." rows={3} className={fieldClass + " resize-none"} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Why do you want to join Ekananda Estate?</label>
                <textarea value={form.reason} onChange={(e) => update("reason", e.target.value)} placeholder="Your motivation..." rows={2} className={fieldClass + " resize-none"} />
              </div>

              <button type="submit" disabled={loading || uploadingAvatar || !user} className="w-full py-3 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {(loading || uploadingAvatar) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Application
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BecomeAgent;
