import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Star, CheckCircle, Phone, Mail, Building2, Calendar, Users, Layers, ArrowLeft, Share2, Heart, Shield } from "lucide-react";

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryForm, setEnquiryForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [enquirySent, setEnquirySent] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const { data } = await (supabase.from("new_projects") as any)
        .select("*")
        .eq("id", id)
        .single();
      setProject(data);
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const handleEnquiry = () => {
    if (!enquiryForm.name || !enquiryForm.phone) return;
    setEnquirySent(true);
    setTimeout(() => setEnquirySent(false), 5000);
    setEnquiryForm({ name: "", email: "", phone: "", message: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">Project Not Found</h2>
            <Link to="/new-projects" className="text-accent hover:underline">← Back to Projects</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = project.images?.length > 0 ? project.images : (project.image ? [project.image] : []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/new-projects" className="hover:text-foreground">New Projects</Link>
            <span>/</span>
            <span className="text-foreground">{project.name}</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[450px] bg-muted">
            {images.length > 0 ? (
              <img src={images[activeImage] || images[0]} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-20 h-20 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <div className="flex gap-2 mb-2">
                  {project.is_new && <span className="badge-new">New Launch</span>}
                  {project.is_featured && <span className="badge-featured">Featured</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{project.name}</h1>
                <p className="text-white/70 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {project.locality}, {project.city}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white hover:bg-white/20">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white hover:bg-white/20">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === activeImage ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price & Key Details */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex flex-wrap items-baseline gap-4 mb-4">
                  <p className="text-3xl font-display font-bold text-accent">
                    {formatPrice(Number(project.min_price))} – {formatPrice(Number(project.max_price))}
                  </p>
                  {project.rating > 0 && (
                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2.5 py-1 rounded-lg text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{project.rating}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Building2 className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="font-bold text-sm">{project.type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Layers className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="font-bold text-sm">{project.total_units || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Units</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="font-bold text-sm">{project.available_units || 0}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="font-bold text-sm">{project.possession_date || "TBA"}</p>
                    <p className="text-xs text-muted-foreground">Possession</p>
                  </div>
                </div>
              </div>

              {/* Configs */}
              {project.configs?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">Available Configurations</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.configs.map((c: string) => (
                      <span key={c} className="px-4 py-2 rounded-xl bg-muted text-sm font-medium border border-border">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {project.description && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-3">About This Project</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
                </div>
              )}

              {/* Amenities */}
              {project.amenities?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-display font-semibold mb-4">Amenities & Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {project.amenities.map((a: string) => (
                      <div key={a} className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RERA */}
              {project.rera_id && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">RERA Registered</p>
                    <p className="text-xs text-muted-foreground">Registration No: {project.rera_id}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Builder Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-3">Builder</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-navy flex items-center justify-center">
                    <span className="text-white font-bold">{project.builder[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{project.builder}</p>
                    <p className="text-xs text-muted-foreground">{project.city}</p>
                  </div>
                </div>
              </div>

              {/* Enquiry Form */}
              <div className="bg-card rounded-2xl border border-accent/30 p-6 sticky top-24">
                <h3 className="font-display font-semibold mb-4">Interested? Get Details</h3>
                {enquirySent ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-sm">Enquiry Submitted!</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll get back to you shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input value={enquiryForm.name} onChange={e => setEnquiryForm(f => ({ ...f, name: e.target.value }))} placeholder="Your Name *" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                    <input value={enquiryForm.email} onChange={e => setEnquiryForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                    <input value={enquiryForm.phone} onChange={e => setEnquiryForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone Number *" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                    <textarea value={enquiryForm.message} onChange={e => setEnquiryForm(f => ({ ...f, message: e.target.value }))} placeholder="I'm interested in this project..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent" />
                    <button onClick={handleEnquiry} className="w-full py-3 rounded-xl btn-gold text-sm font-medium">Submit Enquiry</button>
                    <p className="text-xs text-muted-foreground text-center">By submitting, you agree to our terms</p>
                  </div>
                )}
              </div>

              {/* Quick Contact */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold mb-3">Quick Contact</h3>
                <div className="space-y-2">
                  <a href="tel:+919876543210" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Call Now</span>
                  </a>
                  <a href="mailto:enquiry@propestate.in" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Email Us</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProjectDetail;
