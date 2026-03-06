import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Star, CheckCircle, Phone, Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const NewProjects = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const filters = ["All", "New Launch", "Under Construction", "Ready to Move", "Luxury", "Affordable"];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await (supabase.from("new_projects") as any)
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    if (activeFilter !== "All") {
      if (activeFilter === "New Launch" && !p.is_new) return false;
      if (activeFilter === "Under Construction" && p.possession_date && new Date(p.possession_date) < new Date()) return false;
      if (activeFilter === "Ready to Move" && p.possession_date && new Date(p.possession_date) > new Date()) return false;
      if (activeFilter === "Luxury" && p.max_price < 50000000) return false;
      if (activeFilter === "Affordable" && p.min_price > 10000000) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (![p.name, p.builder, p.city, p.locality].some(f => f?.toLowerCase().includes(q))) return false;
    }
    if (cityFilter && p.city !== cityFilter) return false;
    if (priceRange === "under-1cr" && p.min_price >= 10000000) return false;
    if (priceRange === "1-5cr" && (p.min_price >= 50000000 || p.max_price < 10000000)) return false;
    if (priceRange === "above-5cr" && p.max_price < 50000000) return false;
    return true;
  });

  const cities = [...new Set(projects.map(p => p.city))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">NEW LAUNCH</p>
            <h1 className="text-4xl font-display font-bold text-white mb-2">New Projects in India</h1>
            <p className="text-white/60 text-sm">Discover RERA-verified new launch projects from top builders</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search & Filters */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by project name, builder, city..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
                <option value="">Any Budget</option>
                <option value="under-1cr">Under ₹1 Cr</option>
                <option value="1-5cr">₹1 Cr – ₹5 Cr</option>
                <option value="above-5cr">Above ₹5 Cr</option>
              </select>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`filter-chip flex-shrink-0 ${activeFilter === f ? "active" : ""}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-semibold text-foreground">{filteredProjects.length}</span> projects found
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <SlidersHorizontal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-2">No projects found</h3>
              <p className="text-muted-foreground text-sm">New projects will appear here once added by the admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden group">
                  <div className="relative h-56 overflow-hidden">
                    <img src={project.image || "/placeholder.svg"} alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {project.is_new && <span className="badge-new">New Launch</span>}
                      {project.is_featured && <span className="badge-featured">Featured</span>}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                      <p className="text-white font-display font-bold text-lg">{project.name}</p>
                      <p className="text-white/70 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{project.locality}, {project.city}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Price Range</p>
                        <p className="price-tag text-lg">{formatPrice(Number(project.min_price))} – {formatPrice(Number(project.max_price))}</p>
                      </div>
                      {project.rating > 0 && (
                        <div className="flex items-center gap-1 bg-gold/10 text-gold px-2 py-1 rounded-lg text-sm">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold">{project.rating}</span>
                        </div>
                      )}
                    </div>

                    {project.configs?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {project.configs.map((c: string) => <span key={c} className="amenity-chip">{c}</span>)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
                      <div><span className="font-medium text-foreground">{project.total_units}</span> Total Units</div>
                      <div><span className="font-medium text-foreground">{project.available_units}</span> Available</div>
                      {project.possession_date && <div>Possession: <span className="font-medium text-foreground">{project.possession_date}</span></div>}
                      <div>By: <span className="font-medium text-foreground">{project.builder}</span></div>
                    </div>

                    {project.rera_id && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>RERA: {project.rera_id.length > 20 ? project.rera_id.slice(0, 20) + "..." : project.rera_id}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to={`/project/${project.id}`} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> Enquire
                      </Link>
                      <Link to={`/project/${project.id}`} className="flex-1 py-2 rounded-xl btn-gold text-sm text-center">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewProjects;
