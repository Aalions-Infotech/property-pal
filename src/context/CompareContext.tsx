import { createContext, useContext, useState, ReactNode } from "react";

interface CompareItem {
  id: string;
  title: string;
  image: string;
  price: number;
  area: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  locality: string;
  furnishing?: string;
  propertyType?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = (item: CompareItem) => {
    if (items.length >= 4) return;
    if (items.find(i => i.id === item.id)) return;
    setItems(prev => [...prev, item]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setItems([]);
  const isInCompare = (id: string) => items.some(i => i.id === id);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};

export type { CompareItem };
