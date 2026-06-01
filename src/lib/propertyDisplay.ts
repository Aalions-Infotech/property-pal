const RESIDENTIAL_TYPES = new Set(["Apartment", "House", "Villa", "Builder Floor", "PG", "Studio", "Penthouse"]);

export const isResidentialPropertyType = (type?: string | null) => RESIDENTIAL_TYPES.has(String(type || ""));

export const formatExactCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
};

export const formatPropertyPrice = (price: number | string | null | undefined, unit?: string | null) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "₹0";
  const suffix = unit === "monthly" ? "/mo" : "";
  return `${formatExactCurrency(amount)}${suffix}`;
};

export const getPricePerSqft = (property: { price?: any; area?: any; price_per_sqft?: any; pricePerSqft?: any }) => {
  const price = Number(property.price);
  const area = Number(property.area);
  const stored = Number(property.price_per_sqft ?? property.pricePerSqft);
  const computed = Number.isFinite(price) && Number.isFinite(area) && area > 0 ? Math.round(price / area) : 0;
  return computed || (Number.isFinite(stored) ? Math.round(stored) : 0);
};

export const formatArea = (area: number | string | null | undefined, unit = "sq.ft") => {
  const value = Number(area);
  if (!Number.isFinite(value)) return `0 ${unit}`;
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`;
};

export const shouldShowBedsBaths = (propertyType?: string | null) => isResidentialPropertyType(propertyType);