import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, MapPin, BedDouble, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  property: {
    id: string;
    city: string;
    locality?: string;
    propertyType?: string;
    bedrooms?: number;
    price: number;
    listingType?: string;
  };
}

const formatPrice = (p: number) => {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
  return `₹${p.toLocaleString("en-IN")}`;
};

const AiRecommendations = ({ property }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-recommendations", { body: { property } });
        if (cancelled) return;
        if (error) throw error;
        setItems(data?.recommendations || []);
        setReason(data?.reason || "");
      } catch {
        // fall back: fetch similar by city/type
        let q = supabase.from("property_listings").select("*").eq("status", "approved").neq("id", property.id).limit(4);
        if (property.city) q = q.eq("city", property.city);
        const { data: rows } = await q;
        if (!cancelled) setItems(rows || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [property.id]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-base">AI-Recommended for You</h3>
          <p className="text-xs text-muted-foreground">{reason || "Similar properties you may love"}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Finding the best matches…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No similar properties found yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.slice(0, 4).map((p: any) => (
            <Link key={p.id} to={`/property/${p.id}`} className="flex gap-3 rounded-xl border border-border p-2 hover:bg-muted/40 transition-colors">
              <img src={p.images?.[0] || "/placeholder.svg"} alt={p.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{p.locality}, {p.city}</p>
                <p className="text-sm font-semibold text-accent mt-1">{formatPrice(Number(p.price))}</p>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  {p.bedrooms && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{p.bedrooms}</span>}
                  {p.area && <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{p.area}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiRecommendations;