import { Link } from "react-router-dom";
import { Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-navy text-white">
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl">PropEstate</span>
            </div>
            <p className="text-sm text-white/60 mb-5 leading-relaxed max-w-xs">
              India's most trusted real estate platform. Find your dream home, office, or investment property with confidence.
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>1800 41 99099 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>services@propestate.in</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Mumbai, Delhi, Bangalore</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-foreground transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gold">FOR BUYERS</h4>
            <ul className="space-y-2">
              {[
                { label: "Buy Apartment", to: "/buy?type=apartment" },
                { label: "Buy Villa", to: "/buy?type=villa" },
                { label: "Buy Plot/Land", to: "/buy?type=plot" },
                { label: "New Projects", to: "/new-projects" },
                { label: "Commercial Space", to: "/commercial" },
                { label: "Home Loans", to: "/home-loans" },
                { label: "Price Trends", to: "/price-trends" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Tenants */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gold">FOR TENANTS</h4>
            <ul className="space-y-2">
              {[
                { label: "Rent Apartment", to: "/rent" },
                { label: "Rent Villa", to: "/rent?type=villa" },
                { label: "PG / Co-Living", to: "/pg" },
                { label: "Rent Office", to: "/commercial" },
                { label: "Find Agents", to: "/agents" },
                { label: "Tenant Guide", to: "/news" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gold">FOR OWNERS</h4>
            <ul className="space-y-2">
              {[
                { label: "Post Property FREE", to: "/post-property" },
                { label: "Insights Dashboard", to: "/price-trends" },
                { label: "Locality Guide", to: "/locality" },
                { label: "Articles & News", to: "/news" },
                { label: "EMI Calculator", to: "/home-loans" },
                { label: "Area Converter", to: "/home-loans#tools" },
                { label: "About Us", to: "/" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* City Links */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <h4 className="font-display font-semibold text-sm mb-4 text-gold">POPULAR CITIES</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {["Delhi NCR", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Noida", "Gurgaon", "Jaipur", "Lucknow", "Chandigarh"].map(city => (
              <Link
                key={city}
                to={`/buy?city=${encodeURIComponent(city)}`}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                Property in {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 PropEstate India Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Disclaimer</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
