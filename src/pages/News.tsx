import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { newsArticles } from "@/data/properties";
import { BookOpen, Search, Clock } from "lucide-react";

const News = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Market News", "Investment Guide", "Legal", "Interior Design", "Tax & Policy", "Buyer Guide"];
  const allArticles = [...newsArticles, ...newsArticles].slice(0, 12);
  const filtered = activeCategory === "All" ? allArticles : allArticles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">INSIGHTS</p>
            <h1 className="text-4xl font-display font-bold text-white mb-4">Real Estate News & Articles</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search articles..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none focus:bg-white/20" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} className={`filter-chip flex-shrink-0 ${activeCategory === c ? "active" : ""}`}>{c}</button>
            ))}
          </div>
          {/* Featured */}
          {activeCategory === "All" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group cursor-pointer">
                <div className="relative h-64"><img src={allArticles[0].image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3"><span className="badge-featured">{allArticles[0].category}</span></div>
                </div>
                <div className="p-5">
                  <h2 className="font-display font-bold text-xl mb-2">{allArticles[0].title}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{allArticles[0].excerpt}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground"><span>{allArticles[0].date}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{allArticles[0].readTime}</span></div>
                </div>
              </div>
              <div className="space-y-4">
                {allArticles.slice(1, 4).map(a => (
                  <div key={a.id} className="flex gap-4 bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-md transition-all group">
                    <img src={a.image} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="badge-new mb-1 inline-block">{a.category}</span>
                      <h3 className="font-display font-semibold text-sm line-clamp-2 group-hover:text-accent transition-colors">{a.title}</h3>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-2"><span>{a.date}</span><span>{a.readTime}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a, i) => (
              <div key={`${a.id}-${i}`} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group cursor-pointer property-card-hover">
                <div className="relative h-44 overflow-hidden"><img src={a.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3"><span className="badge-verified">{a.category}</span></div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">{a.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.excerpt}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{a.author}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.readTime}</span>
                  </div>
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

export default News;
