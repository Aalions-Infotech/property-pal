import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterSidebarProps {
  type: "buy" | "rent" | "commercial" | "pg";
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string[];
  propertyType?: string[];
  furnishing?: string[];
  postedBy?: string[];
  amenities?: string[];
  status?: string[];
  minArea?: number;
  maxArea?: number;
}

const FilterSidebar = ({ type, onFilterChange }: FilterSidebarProps) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [sections, setSections] = useState({
    price: true,
    bedrooms: true,
    propertyType: true,
    furnishing: true,
    postedBy: true,
    status: true,
    amenities: false,
    area: false,
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const current = (filters[key] as string[] | undefined) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated.length ? updated : undefined);
  };

  const clearAll = () => {
    setFilters({});
    onFilterChange({});
  };

  const priceRangesBuy = [
    { label: "Under ₹40 Lakh", min: 0, max: 4000000 },
    { label: "₹40L - ₹80L", min: 4000000, max: 8000000 },
    { label: "₹80L - ₹1.5 Cr", min: 8000000, max: 15000000 },
    { label: "₹1.5 Cr - ₹3 Cr", min: 15000000, max: 30000000 },
    { label: "Above ₹3 Cr", min: 30000000, max: undefined },
  ];

  const priceRangesRent = [
    { label: "Under ₹10K", min: 0, max: 10000 },
    { label: "₹10K - ₹20K", min: 10000, max: 20000 },
    { label: "₹20K - ₹40K", min: 20000, max: 40000 },
    { label: "₹40K - ₹75K", min: 40000, max: 75000 },
    { label: "Above ₹75K", min: 75000, max: undefined },
  ];

  const priceRanges = type === "rent" || type === "pg" ? priceRangesRent : priceRangesBuy;

  const FilterSection = ({ title, sectionKey, children }: { title: string; sectionKey: keyof typeof sections; children: React.ReactNode }) => (
    <div className="border-b border-border pb-4 mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-sm font-semibold mb-3"
      >
        {title}
        {sections[sectionKey] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {sections[sectionKey] && children}
    </div>
  );

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <h3 className="font-display font-semibold text-sm">Filters</h3>
        </div>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-accent font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      {/* Price */}
      <FilterSection title="Budget" sectionKey="price">
        <div className="space-y-1.5">
          {priceRanges.map(range => (
            <button
              key={range.label}
              onClick={() => updateFilter("minPrice", range.min)}
              className={`filter-chip w-full text-left ${filters.minPrice === range.min ? "active" : ""}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Bedrooms */}
      {(type === "buy" || type === "rent") && (
        <FilterSection title="Bedrooms" sectionKey="bedrooms">
          <div className="flex flex-wrap gap-2">
            {["1", "2", "3", "4", "5+"].map(bed => (
              <button
                key={bed}
                onClick={() => toggleArrayFilter("bedrooms", bed)}
                className={`filter-chip ${(filters.bedrooms as string[] | undefined)?.includes(bed) ? "active" : ""}`}
              >
                {bed} BHK
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Property Type */}
      <FilterSection title="Property Type" sectionKey="propertyType">
        <div className="space-y-1.5">
          {(type === "buy" || type === "rent" 
            ? ["Apartment", "Villa", "Builder Floor", "Penthouse", "Studio", "Row House"]
            : type === "commercial" 
              ? ["Office Space", "Shop/Retail", "Showroom", "Warehouse", "Plot"]
              : ["Single Room", "Double Sharing", "Triple Sharing"]).map(ptype => (
            <label key={ptype} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.propertyType as string[] | undefined)?.includes(ptype) || false}
                onChange={() => toggleArrayFilter("propertyType", ptype)}
                className="rounded border-border accent-accent"
              />
              <span className="text-sm">{ptype}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Furnishing */}
      <FilterSection title="Furnishing" sectionKey="furnishing">
        <div className="space-y-1.5">
          {["Fully Furnished", "Semi-Furnished", "Unfurnished"].map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.furnishing as string[] | undefined)?.includes(f) || false}
                onChange={() => toggleArrayFilter("furnishing", f)}
                className="rounded border-border accent-accent"
              />
              <span className="text-sm">{f}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Posted By */}
      <FilterSection title="Posted By" sectionKey="postedBy">
        <div className="space-y-1.5">
          {["Owner", "Agent", "Builder"].map(by => (
            <label key={by} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.postedBy as string[] | undefined)?.includes(by) || false}
                onChange={() => toggleArrayFilter("postedBy", by)}
                className="rounded border-border accent-accent"
              />
              <span className="text-sm">{by}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Status */}
      <FilterSection title="Possession Status" sectionKey="status">
        <div className="space-y-1.5">
          {["Ready to Move", "Under Construction", "New Launch"].map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.status as string[] | undefined)?.includes(s) || false}
                onChange={() => toggleArrayFilter("status", s)}
                className="rounded border-border accent-accent"
              />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Amenities */}
      <FilterSection title="Amenities" sectionKey="amenities">
        <div className="space-y-1.5">
          {["Swimming Pool", "Gym", "Club House", "Parking", "Security", "Power Backup", "Lift", "Garden"].map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.amenities as string[] | undefined)?.includes(a) || false}
                onChange={() => toggleArrayFilter("amenities", a)}
                className="rounded border-border accent-accent"
              />
              <span className="text-sm">{a}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default FilterSidebar;
