import { useState } from "react";
import { Heart, MapPin, BedDouble, Bath, Maximize2, Star, Shield, Zap, Phone, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Property, formatPrice } from "@/data/properties";
import { formatArea, getPricePerSqft, shouldShowBedsBaths, formatPricePerSqft } from "@/lib/propertyDisplay";

interface PropertyCardProps {
  property: Property;
  view?: "grid" | "list";
}

const PropertyCard = ({ property, view = "grid" }: PropertyCardProps) => {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const showBedsBaths = shouldShowBedsBaths(property.category);
  const pricePerSqft = getPricePerSqft(property);

  if (view === "list") {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden flex">
        {/* Image */}
        <div className="relative w-64 flex-shrink-0">
          <Link to={`/property/${property.id}`} className="block w-full h-full" aria-label={`View ${property.title}`}>
            <img
              src={property.image}
              alt={property.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </Link>
          {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {property.featured && <span className="badge-featured">Featured</span>}
            {property.isNew && <span className="badge-new">New</span>}
            {property.verified && (
              <span className="badge-verified flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <button
            onClick={() => setWishlisted(!wishlisted)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card/90 flex items-center justify-center shadow"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link to={`/property/${property.id}`} className="font-display font-semibold text-base hover:text-accent transition-colors line-clamp-1">
                {property.title}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                property.status === "Ready to Move" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                property.status === "Under Construction" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}>
                {property.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{property.locality}, {property.city}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {showBedsBaths && property.bedrooms && (
                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.bedrooms} Beds</span>
              )}
              {showBedsBaths && property.bathrooms && (
                <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms} Baths</span>
              )}
              <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4" />{formatArea(property.area, property.areaUnit)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div>
              <p className="price-tag text-xl break-words">{formatPrice(property.price, property.priceUnit)}</p>
              <p className="text-xs text-muted-foreground">{formatPricePerSqft(property)} • {property.furnishing}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Contact
              </button>
              <Link to={`/property/${property.id}`} className="px-3 py-1.5 rounded-lg btn-gold text-sm flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card property-card-hover overflow-hidden group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Link to={`/property/${property.id}`} className="block w-full h-full" aria-label={`View ${property.title}`}>
          <img
            src={property.image}
            alt={property.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
        </Link>
        {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {property.featured && <span className="badge-featured">Featured</span>}
          {property.isNew && <span className="badge-new">New</span>}
          {property.verified && (
            <span className="badge-verified flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center shadow transition-transform hover:scale-110"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        {/* Status */}
        <div className="absolute bottom-3 right-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            property.status === "Ready to Move" ? "bg-green-500/90 text-white" :
            property.status === "Under Construction" ? "bg-orange-500/90 text-white" :
            "bg-blue-500/90 text-white"
          }`}>
            {property.status}
          </span>
        </div>

        {/* Posted by */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            property.postedBy === "Owner" ? "bg-card/90 text-foreground" :
            property.postedBy === "Builder" ? "bg-card/90 text-foreground" :
            "bg-card/90 text-foreground"
          }`}>
            {property.postedBy === "Owner" && <Zap className="w-2.5 h-2.5 inline mr-0.5 text-yellow-500" />}
            {property.postedBy}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
          <p className="price-tag text-lg sm:text-xl break-words">{formatPrice(property.price, property.priceUnit)}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0 mt-1">
            ₹{pricePerSqft.toLocaleString("en-IN")}/sqft
          </span>
        </div>

        <Link to={`/property/${property.id}`} className="font-display font-semibold text-sm mb-1 hover:text-accent transition-colors line-clamp-2 block">
          {property.title}
        </Link>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.locality}, {property.city}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
          {showBedsBaths && property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />{property.bedrooms} Beds
            </span>
          )}
          {showBedsBaths && property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />{property.bathrooms} Baths
            </span>
          )}
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5" />{formatArea(property.area, property.areaUnit)}
          </span>
        </div>

        {/* Furnishing + Action */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{property.furnishing}</span>
          <div className="flex gap-2">
            <button className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" />
            </button>
            <Link to={`/property/${property.id}`} className="px-3 py-1.5 rounded-lg btn-gold text-xs flex items-center gap-1">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
