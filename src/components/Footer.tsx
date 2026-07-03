import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { BRAND_NAME, BRAND_EMAIL, BRAND_PHONE, BRAND_COPYRIGHT } from "@/constants/brand";
import logoImg from "@/assets/ekananda-logo.webp";

const Footer = () => {
  return (
    <footer className="bg-gradient-navy text-white">
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt={BRAND_NAME} className="w-9 h-9 rounded-lg object-cover" />
              <span className="font-display font-bold text-xl">{BRAND_NAME}</span>
            </div>
            <p className="text-sm text-white/60 mb-5 leading-relaxed max-w-xs">
              Lucknow's most trusted real estate platform. Find your dream home, office, or investment property across every locality in the City of Nawabs.
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>{BRAND_PHONE} (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>{BRAND_EMAIL}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span> Lucknow Amausi Sarojini Nagar</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {[Facebook, Twitter, Instagram,  Linkedin].map((Icon, i) => (
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
          <h4 className="font-display font-semibold text-sm mb-4 text-gold">POPULAR LUCKNOW LOCALITIES</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {["Gomti Nagar", "Hazratganj", "Indira Nagar", "Aliganj", "Mahanagar", "Aminabad", "Alambagh", "Vibhuti Khand", "Jankipuram", "Sushant Golf City", "Sultanpur Road", "Faizabad Road", "Kanpur Road", "Chinhat", "Mall Avenue"].map(loc => (
              <Link
                key={loc}
                to={`/buy?city=Lucknow&locality=${encodeURIComponent(loc)}`}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                Property in {loc}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {BRAND_COPYRIGHT}
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
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
