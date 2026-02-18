import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, BarChart3, MapPin, ArrowRight } from "lucide-react";
import { priceData, cities } from "@/data/properties";
import { Link } from "react-router-dom";

const PriceTrends = () => {
  const [activeCity, setActiveCity] = useState("Mumbai");
  const [activeType, setActiveType] = useState("Residential");

  const localityData = [
    { name: "Bandra West", price: 48000, change: 12.5, trend: "up" },
    { name: "Andheri West", price: 28000, change: 8.2, trend: "up" },
    { name: "Powai", price: 25000, change: 6.8, trend: "up" },
    { name: "Worli", price: 62000, change: 9.4, trend: "up" },
    { name: "Borivali West", price: 18000, change: -2.1, trend: "down" },
    { name: "Thane West", price: 12000, change: 15.3, trend: "up" },
  ];

  const monthlyData = [
    { month: "Aug", price: 23000 }, { month: "Sep", price: 23500 }, { month: "Oct", price: 24200 },
    { month: "Nov", price: 24000 }, { month: "Dec", price: 24500 }, { month: "Jan", price: 25000 },
  ];

  const maxPrice = Math.max(...monthlyData.map(d => d.price));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">MARKET INTELLIGENCE</p>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Property Price Trends</h1>
            <p className="text-white/60 text-sm">Real-time price data across India's top real estate markets</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* City Selector */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
            {Object.keys(priceData).map(city => (
              <button key={city} onClick={() => setActiveCity(city)} className={`filter-chip flex-shrink-0 ${activeCity === city ? "active" : ""}`}>
                {city}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Price Chart */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-bold text-xl">{activeCity} Price Index</h2>
                  <p className="text-muted-foreground text-sm">Average price per sq.ft (Last 6 months)</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-bold text-accent">₹{priceData[activeCity as keyof typeof priceData]?.avgPrice?.toLocaleString()}</p>
                  <p className={`text-sm font-medium ${priceData[activeCity as keyof typeof priceData]?.trend === "up" ? "price-trend-up" : "price-trend-down"}`}>
                    {priceData[activeCity as keyof typeof priceData]?.trend === "up" ? "↑" : "↓"} {priceData[activeCity as keyof typeof priceData]?.change}% YoY
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end gap-3 h-40 mb-4">
                {monthlyData.map((d, i) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs font-medium text-muted-foreground">₹{(d.price/1000).toFixed(0)}K</p>
                    <div className="w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: `${(d.price / maxPrice) * 100}%` }}>
                      <div className={`w-full h-full rounded-t-lg ${i === monthlyData.length - 1 ? "bg-gradient-gold" : "bg-primary/20"}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{d.month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="space-y-4">
              {Object.entries(priceData).slice(0, 4).map(([city, data]) => (
                <div key={city} onClick={() => setActiveCity(city)} className={`bg-card rounded-2xl border p-4 cursor-pointer transition-all ${activeCity === city ? "border-accent shadow-md" : "border-border hover:border-accent/50"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold text-sm">{city}</p>
                      <p className="text-xl font-display font-bold mt-0.5">₹{data.avgPrice.toLocaleString()}/sqft</p>
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-bold ${data.trend === "up" ? "price-trend-up" : "price-trend-down"}`}>
                      {data.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {data.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locality-wise Prices */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="font-display font-bold text-xl mb-4">Top Localities in {activeCity}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-muted-foreground font-medium">Locality</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">Avg. Price/sqft</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">YoY Change</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {localityData.map(loc => (
                    <tr key={loc.name} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {loc.name}
                      </td>
                      <td className="py-3 text-right font-display font-bold">₹{loc.price.toLocaleString()}</td>
                      <td className={`py-3 text-right font-medium ${loc.trend === "up" ? "price-trend-up" : "price-trend-down"}`}>
                        {loc.trend === "up" ? "+" : ""}{loc.change}%
                      </td>
                      <td className="py-3 text-right">
                        {loc.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500 ml-auto" /> : <TrendingDown className="w-4 h-4 text-red-500 ml-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Cities Grid */}
          <h2 className="font-display font-bold text-2xl mb-4">Price Across All Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(priceData).map(([city, data]) => (
              <div key={city} className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveCity(city)}>
                <p className="text-sm font-semibold mb-1">{city}</p>
                <p className="text-xl font-display font-bold text-accent">₹{data.avgPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per sqft</p>
                <p className={`text-xs font-medium mt-1 ${data.trend === "up" ? "price-trend-up" : "price-trend-down"}`}>
                  {data.trend === "up" ? "▲" : "▼"} {data.change}% YoY
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PriceTrends;
