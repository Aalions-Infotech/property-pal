import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, TrendingUp, MapPin, Star, Shield, Zap, 
  Building2, Home, DollarSign, Users, ChevronRight,
  PlayCircle, Award, CheckCircle, ChevronLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-bg.jpg";
import prop1 from "@/assets/property1.jpg";
import prop2 from "@/assets/property2.jpg";
import prop3 from "@/assets/property3.jpg";
import prop4 from "@/assets/property4.jpg";
import prop5 from "@/assets/property5.jpg";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { newProjects, newsArticles, cities, formatPrice, priceData, properties as dummyProperties } from "@/data/properties";

const Index = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCityTab, setActiveCityTab] = useState("Mumbai");
  const [dbProperties, setDbProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    const fetchApprovedProperties = async () => {
      const { data } = await supabase
        .from("property_listings")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      setDbProperties(data || []);
      setLoadingProps(false);
    };
    fetchApprovedProperties();
  }, []);

  // Convert DB properties to PropertyCard format
  const mapDbProp = (p: any) => ({
    id: p.id,
    title: p.title,
    type: p.listing_type as any,
    category: p.property_type,
    price: Number(p.price),
    priceUnit: p.price_unit === "monthly" ? "monthly" as const : "total" as const,
    area: Number(p.area) || 0,
    areaUnit: p.area_unit || "sq.ft",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    floor: p.floor,
    totalFloors: p.total_floors,
    city: p.city,
    locality: p.locality,
    address: p.address || "",
    image: p.images?.[0] || prop1,
    images: p.images || [prop1],
    amenities: p.amenities || [],
    furnishing: p.furnishing || "Unfurnished",
    status: "Ready to Move" as const,
    postedBy: "Owner" as const,
    postedDate: new Date(p.created_at).toLocaleDateString("en-IN"),
    verified: p.is_verified || false,
    featured: p.is_featured || false,
    isNew: p.is_new || false,
    description: p.description || "",
    facing: p.facing || "",
    parking: p.parking || 0,
    ageOfProperty: p.age_of_property || "",
    societyName: p.society_name,
    builderName: p.builder_name,
    reraId: p.rera_id,
    nearbyPlaces: [],
    pricePerSqft: p.price_per_sqft || 0,
  });

  // Use DB properties if available, otherwise fall back to dummy
  const allProperties = dbProperties.length > 0 ? dbProperties.map(mapDbProp) : dummyProperties;
  const featuredProps = allProperties.filter(p => p.featured).slice(0, 4);
  const buyProps = featuredProps.length > 0 ? featuredProps : allProperties.filter(p => p.type === "buy").slice(0, 4);
  const rentProps = allProperties.filter(p => p.type === "rent" || p.type === "pg").slice(0, 4);

  const stats = [
    { value: "5L+", label: "Properties Listed" },
    { value: "18K+", label: "Verified Agents" },
    { value: "50+", label: "Cities Covered" },
    { value: "4.8★", label: "Avg. Rating" },
  ];

  const quickCategories = [
    { label: "Buy a Home", icon: "🏠", to: "/buy", color: "from-blue-500/10 to-blue-600/5" },
    { label: "Rent a Home", icon: "🔑", to: "/rent", color: "from-emerald-500/10 to-emerald-600/5" },
    { label: "New Projects", icon: "🏗️", to: "/new-projects", color: "from-orange-500/10 to-orange-600/5" },
    { label: "Commercial", icon: "💼", to: "/commercial", color: "from-purple-500/10 to-purple-600/5" },
    { label: "Plots/Land", icon: "🌍", to: "/buy?type=plot", color: "from-green-500/10 to-green-600/5" },
    { label: "PG / Co-Living", icon: "🛋️", to: "/pg", color: "from-pink-500/10 to-pink-600/5" },
    { label: "Home Loans", icon: "🏦", to: "/home-loans", color: "from-yellow-500/10 to-yellow-600/5" },
    { label: "Find Agents", icon: "👤", to: "/agents", color: "from-red-500/10 to-red-600/5" },
  ];

  const whyUs = [
    { icon: Shield, title: "100% Verified Listings", desc: "Every property goes through a 10-step verification process." },
    { icon: Zap, title: "Instant Connect", desc: "Contact owners and agents directly with zero brokerage." },
    { icon: Award, title: "RERA Compliant", desc: "All new projects are verified for RERA registration." },
    { icon: TrendingUp, title: "Market Insights", desc: "Real-time price trends and locality intelligence." },
    { icon: Users, title: "18K+ Agents", desc: "Connect with India's largest network of certified agents." },
    { icon: CheckCircle, title: "End-to-End Support", desc: "From search to registration, we guide every step." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[88vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Real Estate" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-20 pb-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="section-label mb-3">India's Most Trusted Real Estate Platform</p>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">
              Find Your Perfect<br />
              <span className="text-gold">Place to Live</span>
            </h1>
            <p className="text-lg text-white/70 mb-8">
              5 lakh+ verified properties across 50+ cities. Buy, Rent, or Invest.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar variant="hero" />
          </div>

          {/* Popular Searches */}
          <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2">
            <span className="text-white/50 text-xs">Popular:</span>
            {["2BHK in Mumbai", "Apartments in Bangalore", "Villas in Goa", "Office Space Delhi", "Plots Hyderabad"].map(s => (
              <button key={s} className="glass px-3 py-1 rounded-full text-xs text-white/80 hover:text-white transition-all">
                {s}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="max-w-2xl mx-auto mt-12 glass rounded-2xl p-4">
            <div className="grid grid-cols-4">
              {stats.map((stat, i) => (
                <div key={stat.label} className={`text-center py-2 hero-stat`}>
                  <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="section-label mb-2">ALL PROPERTY NEEDS · ONE PORTAL</p>
            <h2 className="text-3xl font-display font-bold">Explore Real Estate Options</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {quickCategories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.to}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${cat.color} border border-border hover:shadow-md transition-all text-center group hover:-translate-y-1`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties to Buy */}
      <section className="py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">BUY A HOME</p>
              <h2 className="text-3xl font-display font-bold">Find, Buy & Own Your Dream Home</h2>
              <p className="text-muted-foreground mt-1 text-sm">Explore apartments, villas, builder floors and more</p>
            </div>
            <Link to="/buy" className="hidden md:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProps.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link to="/buy" className="inline-flex items-center gap-1 text-accent font-medium text-sm">
              View All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* New Projects */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">NEW LAUNCH</p>
              <h2 className="text-3xl font-display font-bold">Latest New Projects</h2>
              <p className="text-muted-foreground mt-1 text-sm">Brand new projects from top builders across India</p>
            </div>
            <Link to="/new-projects" className="hidden md:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newProjects.map((project) => (
              <Link
                key={project.id}
                to={`/new-projects`}
                className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {project.isNew && <span className="badge-new">New Launch</span>}
                    {project.featured && <span className="badge-featured">Featured</span>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-display font-semibold text-lg">{project.name}</p>
                    <p className="text-white/70 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{project.locality}, {project.city}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting from</p>
                      <p className="price-tag text-lg">{formatPrice(project.minPrice)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gold text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{project.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{project.availableUnits} units left</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.configs.map(c => (
                      <span key={c} className="amenity-chip">{c}</span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {project.builder}</span>
                    <span className={`font-medium ${project.status === "New Launch" ? "text-blue-500" : "text-orange-500"}`}>
                      {project.status} • {project.possessionDate}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Rent Properties */}
      <section className="py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">RENT A HOME</p>
              <h2 className="text-3xl font-display font-bold">Find Your Next Rental</h2>
              <p className="text-muted-foreground mt-1 text-sm">Verified rental homes from owners and agents</p>
            </div>
            <Link to="/rent" className="hidden md:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rentProps.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* Price Trends */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">MARKET INTELLIGENCE</p>
              <h2 className="text-3xl font-display font-bold">Property Price Trends</h2>
              <p className="text-muted-foreground mt-1 text-sm">Track price movements across top Indian cities</p>
            </div>
            <Link to="/price-trends" className="hidden md:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all">
              Full Report <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* City Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            {Object.keys(priceData).map(city => (
              <button
                key={city}
                onClick={() => setActiveCityTab(city)}
                className={`filter-chip flex-shrink-0 ${activeCityTab === city ? "active" : ""}`}
              >
                {city}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priceData).map(([city, data]) => (
              <Link
                key={city}
                to="/price-trends"
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{city}</h3>
                    <p className="text-xs text-muted-foreground">Avg. price/sqft</p>
                  </div>
                  <span className={data.trend === "up" ? "price-trend-up text-sm" : "price-trend-down text-sm"}>
                    {data.trend === "up" ? "↑" : "↓"} {data.change}%
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-accent mb-1">₹{data.avgPrice.toLocaleString()}</p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-gold rounded-full" 
                    style={{ width: `${Math.min((data.avgPrice / 30000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">YoY Change: {data.trend === "up" ? "+" : ""}{data.change}%</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 bg-gradient-navy text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">WHY PROPESTATE</p>
            <h2 className="text-3xl font-display font-bold text-white mb-3">India's Most Trusted Platform</h2>
            <p className="text-white/60 text-sm max-w-xl mx-auto">We combine technology, data, and expertise to make your real estate journey seamless.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
                  <p className="text-sm text-white/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Articles */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">INSIGHTS & NEWS</p>
              <h2 className="text-3xl font-display font-bold">Real Estate Articles</h2>
              <p className="text-muted-foreground mt-1 text-sm">Stay informed with market updates and guides</p>
            </div>
            <Link to="/news" className="hidden md:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all">
              All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsArticles.slice(0, 3).map(article => (
              <Link key={article.id} to="/news" className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3">
                    <span className="badge-verified">{article.category}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm mb-2 line-clamp-2 hover:text-accent transition-colors">{article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.date}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Post Property CTA */}
      <section className="py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-gold rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-10 w-40 h-40 rounded-full border-4 border-current" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full border-4 border-current" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-widest mb-3 text-foreground/70">FOR PROPERTY OWNERS</p>
              <h2 className="text-4xl font-display font-bold text-foreground mb-3">Post Your Property for <span className="underline decoration-wavy">FREE</span></h2>
              <p className="text-foreground/70 mb-8 max-w-lg mx-auto">Reach 5 lakh+ active buyers and tenants. List your property in minutes with zero brokerage.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/post-property" className="btn-navy px-8 py-3 rounded-xl text-base inline-flex items-center gap-2 justify-center">
                  Post Property FREE <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/agents" className="px-8 py-3 rounded-xl border-2 border-foreground/30 text-foreground font-semibold text-base inline-flex items-center gap-2 justify-center hover:bg-foreground/10 transition-all">
                  Find an Agent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="section-label mb-2">EXPLORE BY CITY</p>
            <h2 className="text-3xl font-display font-bold">Properties in Top Cities</h2>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {cities.map(city => (
              <Link
                key={city}
                to={`/buy?city=${encodeURIComponent(city)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:border-accent hover:text-accent transition-all text-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
