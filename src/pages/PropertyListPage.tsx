import { useState, useEffect } from "react";
import { Grid3X3, List, SlidersHorizontal, MessageSquare } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, BedDouble, Bath, Maximize2, Heart, Shield, Zap, Phone, Eye, Star } from "lucide-react";

interface PropertyListPageProps {
  type: "buy" | "rent" | "commercial" | "pg";
  title: string;
  subtitle: string;
}

const formatPrice = (price: number, unit?: string) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}${unit === "monthly" ? "/mo" : ""}`;
};

const LivePropertyCard = ({ property, view = "grid" }: { property: any; view?: "grid" | "list" }) => {
  const [wishlisted, setWishlisted] = useState(false);
  const mainImage = property.images?.[0] || "/placeholder.svg";

  if (view === "list") {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex hover:shadow-md transition-all">
        <div className="relative w-64 flex-shrink-0">
          <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {property.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground">Featured</span>}
            {property.is_new && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">New</span>}
            {property.is_verified && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <Link to={`/property/${property.id}`} className="font-display font-semibold text-base hover:text-accent transition-colors line-clamp-1">{property.title}</Link>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5" />{property.locality}, {property.city}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {property.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.bedrooms} Beds</span>}
              {property.bathrooms && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms} Baths</span>}
              {property.area && <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4" />{property.area} {property.area_unit}</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div>
              <p className="text-xl font-display font-bold text-accent">{formatPrice(Number(property.price), property.price_unit)}</p>
              {property.price_per_sqft && <p className="text-xs text-muted-foreground">₹{Number(property.price_per_sqft).toLocaleString("en-IN")}/sq.ft</p>}
            </div>
            <Link to={`/property/${property.id}`} className="px-3 py-1.5 rounded-lg btn-gold text-sm flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> View
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group hover:shadow-md transition-all">
      <div className="relative h-52 overflow-hidden">
        <img src={mainImage} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {property.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground">Featured</span>}
          {property.is_new && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">New</span>}
          {property.is_verified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>
        <button onClick={() => setWishlisted(!wishlisted)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center shadow transition-transform hover:scale-110">
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-card/90 text-foreground font-medium">{property.furnishing || "Unfurnished"}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xl font-display font-bold text-accent mb-1">{formatPrice(Number(property.price), property.price_unit)}</p>
        {property.price_per_sqft && <span className="text-xs text-muted-foreground">₹{Number(property.price_per_sqft).toLocaleString("en-IN")}/sqft</span>}
        <Link to={`/property/${property.id}`} className="font-display font-semibold text-sm mb-1 hover:text-accent transition-colors line-clamp-2 block mt-1">{property.title}</Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />{property.locality}, {property.city}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
          {property.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} Beds</span>}
          {property.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} Baths</span>}
          {property.area && <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{property.area} {property.area_unit}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{property.property_type}</span>
          <Link to={`/property/${property.id}`} className="px-3 py-1.5 rounded-lg btn-gold text-xs flex items-center gap-1">View Details</Link>
        </div>
      </div>
    </div>
  );
};

const PropertyListPage = ({ type, title, subtitle }: PropertyListPageProps) => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [liveListings, setLiveListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [type, searchParams, filters, sortBy]);

  const PLAN_PRIORITY: Record<string, number> = {
    premium_showcase: 1, premium: 1,
    standard_spotlight: 2, standard: 2,
    basic_boost: 3, basic: 3,
  };

  const fetchListings = async () => {
    setLoading(true);

    // Fetch listings and active sponsorships in parallel
    let query = supabase.from("property_listings").select("*").eq("status", "approved");
    const typeMap: Record<string, string> = { buy: "sell", rent: "rent", commercial: "commercial", pg: "pg" };
    query = query.eq("listing_type", typeMap[type] || type);

    const city = searchParams.get("city");
    if (city) query = query.eq("city", city);
    if (filters.minPrice) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
    if (filters.bedrooms?.length) query = query.in("bedrooms", filters.bedrooms.map(Number));
    if (filters.furnishing?.length) query = query.in("furnishing", filters.furnishing);

    // Base sort for DB query
    if (sortBy === "price-asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
    else if (sortBy === "area-desc") query = query.order("area", { ascending: false, nullsFirst: false });
    else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

    const [listRes, sponsorRes] = await Promise.all([
      query.limit(100),
      supabase.from("sponsorships").select("listing_id, plan_name").eq("status", "active").eq("payment_status", "completed"),
    ]);

    const listings = listRes.data || [];
    const sponsors = sponsorRes.data || [];

    // Build sponsor map
    const sponsorMap = new Map<string, string>();
    sponsors.forEach((s: any) => { if (s.listing_id && s.plan_name) sponsorMap.set(s.listing_id, s.plan_name); });

    // Sort: sponsored first by tier, then apply user's sort
    const sorted = [...listings].sort((a, b) => {
      const aPlan = sponsorMap.get(a.id);
      const bPlan = sponsorMap.get(b.id);
      const aPri = aPlan ? (PLAN_PRIORITY[aPlan.toLowerCase().replace(/\s+/g, '_')] || 3) : 99;
      const bPri = bPlan ? (PLAN_PRIORITY[bPlan.toLowerCase().replace(/\s+/g, '_')] || 3) : 99;
      if (aPri !== bPri) return aPri - bPri;
      // Within same tier, use original DB order
      return 0;
    });

    setLiveListings(sorted.slice(0, 50));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 bg-gradient-navy">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-display font-bold text-white mb-1">{title}</h1>
          <p className="text-white/60 text-sm mb-6">{subtitle}</p>
          <SearchBar variant="page" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileFilters(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{loading ? "..." : liveListings.length}</span> properties found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="relevance">Sort: Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="area-desc">Area: Largest First</option>
            </select>
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar type={type} onFilterChange={setFilters} />
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : liveListings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No properties found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later for new listings.</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {liveListings.map(p => <LivePropertyCard key={p.id} property={p} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {liveListings.map(p => <LivePropertyCard key={p.id} property={p} view="list" />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <FilterSidebar type={type} onFilterChange={(f) => { setFilters(f); setShowMobileFilters(false); }} />
          </div>
        </div>
      )}

      {/* Floating Enquire Now Button */}
      <button
        onClick={() => setShowLeadForm(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
      >
        <MessageSquare className="w-5 h-5" />
        Enquire Now
      </button>

      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Enquire Now</DialogTitle>
          </DialogHeader>
          <LeadForm title="Enquire Now" />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PropertyListPage;
