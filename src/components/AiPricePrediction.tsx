import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  property: {
    city: string;
    locality: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area: number;
    areaUnit?: string;
    price: number;
    furnishing?: string;
    ageOfProperty?: string;
    listingType?: string;
  };
}

const AiPricePrediction = ({ property }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: res, error } = await supabase.functions.invoke("price-prediction", { body: { property } });
        if (cancelled) return;
        if (error) throw error;
        setData(res);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load prediction");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [property.city, property.locality, property.area, property.price]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-base">AI Price Insight</h3>
          <p className="text-xs text-muted-foreground">Powered by market data & AI</p>
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing market data…
        </div>
      )}
      {err && !loading && <p className="text-sm text-muted-foreground">Insights unavailable right now.</p>}
      {data && !loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Estimated fair value</p>
              <p className="text-lg font-display font-bold text-accent">
                ₹{Number(data.estimated_min || 0).toLocaleString("en-IN")} – ₹{Number(data.estimated_max || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">12-month outlook</p>
              <p className={`text-lg font-display font-bold flex items-center gap-1 ${data.trend === "up" ? "text-emerald-600" : data.trend === "down" ? "text-red-600" : "text-foreground"}`}>
                {data.trend === "up" ? <TrendingUp className="w-4 h-4" /> : data.trend === "down" ? <TrendingDown className="w-4 h-4" /> : null}
                {data.expected_change_pct > 0 ? "+" : ""}{data.expected_change_pct ?? 0}%
              </p>
            </div>
          </div>
          {data.insight && <p className="text-sm text-muted-foreground leading-relaxed">{data.insight}</p>}
        </div>
      )}
    </div>
  );
};

export default AiPricePrediction;