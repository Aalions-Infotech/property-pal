import { useState } from "react";
import { Grid3X3, List, SlidersHorizontal, Map } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import SearchBar from "@/components/SearchBar";
import { properties } from "@/data/properties";

interface PropertyListPageProps {
  type: "buy" | "rent" | "commercial" | "pg";
  title: string;
  subtitle: string;
}

const PropertyListPage = ({ type, title, subtitle }: PropertyListPageProps) => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredProps = properties.filter(p => {
    if (type === "buy" && p.type !== "buy") return false;
    if (type === "rent" && p.type !== "rent") return false;
    if (type === "commercial" && p.type !== "commercial") return false;
    if (type === "pg" && p.type !== "pg") return false;

    const city = searchParams.get("city");
    if (city && p.city !== city) return false;

    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.bedrooms?.length && !filters.bedrooms.includes(String(p.bedrooms))) return false;
    if (filters.furnishing?.length && !filters.furnishing.includes(p.furnishing)) return false;
    if (filters.status?.length && !filters.status.includes(p.status)) return false;
    if (filters.postedBy?.length && !filters.postedBy.includes(p.postedBy)) return false;
    return true;
  });

  const sortedProps = [...filteredProps].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "area-desc") return b.area - a.area;
    return 0;
  });

  // Pad with duplicates for demo
  const displayProps = sortedProps.length > 0 ? sortedProps : properties.slice(0, 6);
  const allProps = [...displayProps, ...properties.slice(0, Math.max(0, 8 - displayProps.length))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-16 bg-gradient-navy">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-display font-bold text-white mb-1">{title}</h1>
          <p className="text-white/60 text-sm mb-6">{subtitle}</p>
          <SearchBar variant="page" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{allProps.length}</span> properties found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="area-desc">Area: Largest First</option>
            </select>
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 ${view === "grid" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 ${view === "list" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar type={type} onFilterChange={setFilters} />
          </aside>

          {/* Property Grid */}
          <div className="flex-1">
            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {allProps.map((p, i) => <PropertyCard key={`${p.id}-${i}`} property={p} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {allProps.map((p, i) => <PropertyCard key={`${p.id}-${i}`} property={p} view="list" />)}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(page => (
                <button
                  key={page}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    page === 1 ? "btn-gold" : "border border-border hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-4 h-9 rounded-lg border border-border text-sm hover:bg-muted">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
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

      <Footer />
    </div>
  );
};

export default PropertyListPage;
