import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { newProjects, formatPrice } from "@/data/properties";
import { MapPin, Star, CheckCircle, Phone, ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

const NewProjects = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "New Launch", "Under Construction", "Ready to Move", "Luxury", "Affordable"];
  const allProjects = [...newProjects, ...newProjects, ...newProjects].slice(0, 9);

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
          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`filter-chip flex-shrink-0 ${activeFilter === f ? "active" : ""}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProjects.map((project, i) => (
              <div key={`${project.id}-${i}`} className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden group">
                <div className="relative h-56 overflow-hidden">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {project.isNew && <span className="badge-new">New Launch</span>}
                    {project.featured && <span className="badge-featured">Featured</span>}
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
                      <p className="price-tag text-lg">{formatPrice(project.minPrice)} – {formatPrice(project.maxPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gold/10 text-gold px-2 py-1 rounded-lg text-sm">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{project.rating}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    {project.configs.map(c => <span key={c} className="amenity-chip">{c}</span>)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">{project.totalUnits}</span> Total Units</div>
                    <div><span className="font-medium text-foreground">{project.availableUnits}</span> Available</div>
                    <div>Possession: <span className="font-medium text-foreground">{project.possessionDate}</span></div>
                    <div>By: <span className="font-medium text-foreground">{project.builder}</span></div>
                  </div>

                  {project.reraId && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>RERA: {project.reraId.slice(0, 20)}...</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Enquire
                    </button>
                    <button className="flex-1 py-2 rounded-xl btn-gold text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewProjects;
