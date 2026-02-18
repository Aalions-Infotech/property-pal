import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { agents } from "@/data/properties";
import { Star, Phone, MapPin, CheckCircle, Search } from "lucide-react";
import agent1Img from "@/assets/agent1.jpg";
import agent2Img from "@/assets/agent2.jpg";

const Agents = () => {
  const [city, setCity] = useState("All");
  const agentImages = [agent1Img, agent2Img];
  const allAgents = [...agents, ...agents, ...agents].slice(0, 9);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">PROFESSIONALS</p>
            <h1 className="text-4xl font-display font-bold text-white mb-4">Find Real Estate Agents</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search by name, city, locality..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAgents.map((agent, i) => (
              <div key={`${agent.id}-${i}`} className="bg-card rounded-2xl border border-border shadow-card p-5 property-card-hover">
                <div className="flex items-start gap-4 mb-4">
                  <img src={agentImages[i % 2]} alt={agent.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-base">{agent.name}</h3>
                      {agent.verified && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{agent.company}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="text-sm font-bold">{agent.rating}</span>
                      <span className="text-xs text-muted-foreground">({agent.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{agent.localities.join(", ")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-surface rounded-xl p-2">
                    <p className="font-bold text-base">{agent.experience}</p>
                    <p className="text-xs text-muted-foreground">Yrs Exp</p>
                  </div>
                  <div className="bg-surface rounded-xl p-2">
                    <p className="font-bold text-base">{agent.properties}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                  <div className="bg-surface rounded-xl p-2">
                    <p className="font-bold text-base">{agent.reviews}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                  <button className="flex-1 py-2 rounded-xl btn-gold text-sm">View Profile</button>
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

export default Agents;
