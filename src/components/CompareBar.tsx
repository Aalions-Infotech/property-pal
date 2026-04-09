import { useState } from "react";
import { X, GitCompareArrows, Trash2 } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/data/properties";

const CompareBar = () => {
  const { items, removeItem, clearAll } = useCompare();
  const [showModal, setShowModal] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating compare bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto flex-1">
            <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
              Compare ({items.length}/4):
            </span>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border flex-shrink-0">
                <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xs font-medium max-w-24 truncate">{item.title}</span>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clearAll} className="px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={items.length < 2}
              className="px-4 py-2 rounded-xl btn-gold text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <GitCompareArrows className="w-4 h-4" /> Compare Now
            </button>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Property Comparison</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-muted rounded-tl-xl font-medium text-muted-foreground min-w-32">Feature</th>
                  {items.map(item => (
                    <th key={item.id} className="p-3 bg-muted text-center min-w-44">
                      <img src={item.image} alt="" className="w-full h-28 rounded-xl object-cover mb-2" />
                      <p className="font-medium text-foreground text-xs line-clamp-2">{item.title}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Price", render: (i: typeof items[0]) => formatPrice(i.price) },
                  { label: "Area", render: (i: typeof items[0]) => `${i.area} ${i.areaUnit}` },
                  { label: "Price/sq.ft", render: (i: typeof items[0]) => i.area > 0 ? `₹${Math.round(i.price / i.area).toLocaleString("en-IN")}` : "N/A" },
                  { label: "Bedrooms", render: (i: typeof items[0]) => i.bedrooms ? `${i.bedrooms} BHK` : "N/A" },
                  { label: "Bathrooms", render: (i: typeof items[0]) => i.bathrooms ? `${i.bathrooms}` : "N/A" },
                  { label: "Location", render: (i: typeof items[0]) => `${i.locality}, ${i.city}` },
                  { label: "Furnishing", render: (i: typeof items[0]) => i.furnishing || "N/A" },
                  { label: "Type", render: (i: typeof items[0]) => i.propertyType || "N/A" },
                ].map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                    {items.map(item => (
                      <td key={item.id} className="p-3 text-center font-medium">{row.render(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompareBar;
