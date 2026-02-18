import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize2, Heart, Share2, Phone, MessageCircle, Shield, CheckCircle, Building2, Calendar, Car, Layers, Star, ChevronRight, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { properties, formatPrice } from "@/data/properties";
import PropertyCard from "@/components/PropertyCard";

const PropertyDetail = () => {
  const { id } = useParams();
  const [activeImg, setActiveImg] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [tab, setTab] = useState<"overview" | "amenities" | "nearby" | "reviews">("overview");

  const property = properties.find(p => p.id === id) || properties[0];
  const similar = properties.filter(p => p.id !== property.id && p.city === property.city).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/buy" className="hover:text-foreground">Buy</Link>
            <ChevronRight className="w-3 h-3" />
            <span>{property.city}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{property.locality}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Images */}
              <div className="mb-6 rounded-2xl overflow-hidden">
                <div className="relative h-80 md:h-[450px]">
                  <img src={property.images[activeImg]} alt={property.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setWishlisted(!wishlisted)} className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center shadow">
                      <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center shadow">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  {property.verified && (
                    <div className="absolute top-4 left-4 badge-verified flex items-center gap-1 px-3 py-1.5">
                      <Shield className="w-3 h-3" /> Verified Listing
                    </div>
                  )}
                </div>
                {property.images.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {property.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`flex-1 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? "border-accent" : "border-transparent"}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + Price */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {property.featured && <span className="badge-featured">Featured</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${property.status === "Ready to Move" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>{property.status}</span>
                    {property.reraId && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">RERA Verified</span>}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{property.address}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="price-tag text-3xl">{formatPrice(property.price, property.priceUnit)}</p>
                  <p className="text-sm text-muted-foreground">₹{property.pricePerSqft}/sq.ft</p>
                  {property.priceUnit === "monthly" && <p className="text-xs text-muted-foreground">+ ₹50K deposit</p>}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {property.bedrooms && (
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <BedDouble className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="font-display font-bold text-lg">{property.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <Bath className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="font-display font-bold text-lg">{property.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                )}
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <Maximize2 className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="font-display font-bold text-lg">{property.area}</p>
                  <p className="text-xs text-muted-foreground">{property.areaUnit}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <Car className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="font-display font-bold text-lg">{property.parking}</p>
                  <p className="text-xs text-muted-foreground">Parking</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-border mb-6">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                  {(["overview", "amenities", "nearby", "reviews"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium capitalize flex-shrink-0 transition-colors ${tab === t ? "border-b-2 border-accent text-accent" : "text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-semibold mb-3">About this property</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Property Type", value: property.category },
                      { label: "Furnishing", value: property.furnishing },
                      { label: "Facing", value: property.facing },
                      { label: "Age of Property", value: property.ageOfProperty },
                      { label: "Floor", value: property.floor !== undefined ? `${property.floor} of ${property.totalFloors}` : "Ground" },
                      { label: "Posted By", value: property.postedBy },
                      ...(property.societyName ? [{ label: "Society", value: property.societyName }] : []),
                      ...(property.builderName ? [{ label: "Builder", value: property.builderName }] : []),
                      ...(property.reraId ? [{ label: "RERA ID", value: property.reraId }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-surface rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="text-sm font-medium truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "amenities" && (
                <div>
                  <h3 className="font-display font-semibold mb-4">Amenities & Features</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map(a => (
                      <div key={a} className="flex items-center gap-2 p-3 bg-surface rounded-xl text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "nearby" && (
                <div>
                  <h3 className="font-display font-semibold mb-4">Nearby Places</h3>
                  <div className="space-y-3">
                    {property.nearbyPlaces.map(place => (
                      <div key={place.name} className="flex items-center justify-between p-3 bg-surface rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            {place.type === "transport" ? "🚇" : place.type === "hospital" ? "🏥" : place.type === "shopping" ? "🛍️" : "🏢"}
                          </div>
                          <span className="text-sm font-medium">{place.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "reviews" && (
                <div>
                  <h3 className="font-display font-semibold mb-4">Ratings & Reviews</h3>
                  <div className="flex items-center gap-6 mb-6 p-6 bg-surface rounded-2xl">
                    <div className="text-center">
                      <p className="text-5xl font-display font-bold text-accent">4.6</p>
                      <div className="flex gap-1 mt-1">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-gold text-gold" />)}</div>
                      <p className="text-xs text-muted-foreground mt-1">128 reviews</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[["Location", 4.8], ["Value", 4.5], ["Amenities", 4.7], ["Safety", 4.4]].map(([label, rating]) => (
                        <div key={label as string} className="flex items-center gap-3 text-sm">
                          <span className="w-20 text-muted-foreground">{label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-gold rounded-full" style={{ width: `${(rating as number / 5) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium">{rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Connect with PropEstate to read verified resident reviews.</p>
                </div>
              )}
            </div>

            {/* Contact Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20 space-y-4">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                    <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center font-display font-bold text-lg text-foreground">
                      {property.postedBy[0]}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">Property {property.postedBy}</p>
                      <p className="text-xs text-muted-foreground">{property.postedDate} • {property.city}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full btn-gold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <Phone className="w-4 h-4" /> Contact {property.postedBy}
                    </button>
                    <button className="w-full btn-navy py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4" /> Send Message
                    </button>
                    <Link to="/home-loans" className="block w-full py-3 rounded-xl border border-border text-center text-sm font-medium hover:bg-muted transition-all">
                      Calculate EMI
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">By contacting you agree to our Terms of Use</p>
                </div>

                {/* EMI Widget */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="font-display font-semibold text-sm mb-3">Quick EMI Estimate</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Price</span>
                      <span className="font-medium">{formatPrice(property.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Amount (80%)</span>
                      <span className="font-medium">{formatPrice(property.price * 0.8)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">Est. EMI @8.5%</span>
                      <span className="font-display font-bold text-accent">₹{Math.round(property.price * 0.8 * (0.085/12) / (1 - Math.pow(1 + 0.085/12, -240))).toLocaleString()}/mo</span>
                    </div>
                  </div>
                  <Link to="/home-loans" className="block mt-3 text-xs text-accent font-medium text-center">Full EMI Calculator →</Link>
                </div>
              </div>
            </aside>
          </div>

          {/* Similar Properties */}
          {similar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-6">Similar Properties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {similar.map(p => <PropertyCard key={p.id} property={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
