import { useState } from "react";
import { Search, Mic, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cities, propertyTypes } from "@/data/properties";

interface SearchBarProps {
  variant?: "hero" | "page";
}

const SearchBar = ({ variant = "hero" }: SearchBarProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "commercial" | "plot" | "pg" | "new-launch">("buy");
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All India");
  const [cityOpen, setCityOpen] = useState(false);
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("All Residential");

  const tabs = [
    { key: "buy", label: "Buy" },
    { key: "rent", label: "Rent" },
    { key: "new-launch", label: "New Launch", badge: true },
    { key: "commercial", label: "Commercial" },
    { key: "plot", label: "Plots/Land" },
    { key: "pg", label: "PG/Co-Living" },
  ] as const;

  const handleSearch = () => {
    const path = activeTab === "buy" ? "/buy" : 
                 activeTab === "rent" ? "/rent" :
                 activeTab === "commercial" ? "/commercial" :
                 activeTab === "plot" ? "/buy?type=plot" :
                 activeTab === "pg" ? "/pg" :
                 "/new-projects";
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCity !== "All India") params.set("city", selectedCity);
    navigate(`${path}?${params.toString()}`);
  };

  return (
    <div className={`${variant === "hero" ? "w-full max-w-3xl" : "w-full"}`}>
      {/* Tabs */}
      <div className={`flex items-center gap-1 mb-0 overflow-x-auto scrollbar-hide ${variant === "hero" ? "" : ""}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-1 flex-shrink-0 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-card text-accent border-t-2 border-t-accent shadow-sm"
                : variant === "hero"
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {"badge" in tab && tab.badge && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            )}
          </button>
        ))}
        <div className="ml-auto hidden md:block">
          <button
            onClick={() => navigate("/post-property")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all flex items-center gap-1 ${
              variant === "hero" ? "text-gold hover:text-gold/80" : "text-accent hover:text-accent/80"
            }`}
          >
            Post Property
            <span className="badge-new ml-1">FREE</span>
          </button>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-card rounded-b-2xl rounded-tr-2xl shadow-lg border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center">
          {/* Property Type Selector */}
          <div className="relative flex-shrink-0 border-b sm:border-b-0 sm:border-r border-border">
            <button
              onClick={() => setPropertyTypeOpen(!propertyTypeOpen)}
              className="w-full sm:w-auto flex items-center gap-2 px-4 py-3 sm:py-4 text-sm font-medium hover:bg-muted transition-colors"
            >
              <span className="truncate max-w-28">{selectedType}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
            {propertyTypeOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg p-2 w-48 z-50">
                {["All Residential", "Apartment", "Villa", "Plot/Land", "Builder Floor", "Studio", "Penthouse"].map(type => (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setPropertyTypeOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-0 flex items-center px-3 sm:px-4 gap-2 border-b sm:border-b-0 border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search city, locality, project, landmark..."
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 py-3 sm:py-4"
            />
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors hidden sm:block">
              <Mic className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors hidden sm:block">
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-3 sm:py-4 btn-navy text-sm font-medium flex-shrink-0 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
