// Property types that legitimately have bedrooms/bathrooms.
const RESIDENTIAL_TYPES = new Set([
  "Apartment", "House", "Villa", "Builder Floor", "Studio", "Penthouse", "Row House",
]);

// Types that should NEVER show beds/baths (land, commercial, shared spaces).
const NON_BED_BATH_TYPES = new Set([
  "Plot", "Plot/Land", "Land", "Agriculture Land", "Agricultural Land",
  "Office", "Office Space", "Shop", "Shop/Retail", "Retail", "Warehouse",
  "Industrial", "Showroom", "Commercial", "PG",
]);

export const isResidentialPropertyType = (type?: string | null) =>
  RESIDENTIAL_TYPES.has(String(type || ""));

export const shouldShowBedsBaths = (propertyType?: string | null) => {
  const t = String(propertyType || "");
  if (NON_BED_BATH_TYPES.has(t)) return false;
  return RESIDENTIAL_TYPES.has(t);
};

// Convert an area into canonical sq.ft so price/sqft math is consistent.
const AREA_TO_SQFT: Record<string, number> = {
  "sq.ft": 1,
  "sqft": 1,
  "sq ft": 1,
  "sq.m": 10.7639,
  "sqm": 10.7639,
  "sq.yd": 9,
  "sqyd": 9,
  "acre": 43560,
  "acres": 43560,
  "hectare": 107639,
  "bigha": 27000,
  "biswa": 1350,
  "gunta": 1089,
};

export const toSqft = (area: number | string | null | undefined, unit?: string | null) => {
  const v = Number(area);
  if (!Number.isFinite(v) || v <= 0) return 0;
  const key = String(unit || "sq.ft").toLowerCase().trim();
  const factor = AREA_TO_SQFT[key] ?? 1;
  return v * factor;
};

// Deterministic Indian-format currency. Always rounds to nearest integer rupee.
export const formatExactCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

export const formatPropertyPrice = (price: number | string | null | undefined, unit?: string | null) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "₹0";
  const suffix = unit === "monthly" ? "/mo" : "";
  return `${formatExactCurrency(amount)}${suffix}`;
};

// Single source of truth for price-per-sqft across the entire app.
// Always computes from price + area (converted to sq.ft) when possible —
// only falls back to a stored value when area is missing. Result is always
// floor-rounded so it never shows a value larger than price/area.
export const getPricePerSqft = (property: {
  price?: any;
  area?: any;
  area_unit?: any;
  areaUnit?: any;
  price_per_sqft?: any;
  pricePerSqft?: any;
}) => {
  const price = Number(property.price);
  const unit = property.area_unit ?? property.areaUnit ?? "sq.ft";
  const sqft = toSqft(property.area, unit);
  if (Number.isFinite(price) && sqft > 0) {
    return Math.floor(price / sqft);
  }
  const stored = Number(property.price_per_sqft ?? property.pricePerSqft);
  return Number.isFinite(stored) ? Math.floor(stored) : 0;
};

export const formatPricePerSqft = (property: Parameters<typeof getPricePerSqft>[0]) =>
  `₹${getPricePerSqft(property).toLocaleString("en-IN")}/sq.ft`;

export const formatArea = (area: number | string | null | undefined, unit = "sq.ft") => {
  const value = Number(area);
  if (!Number.isFinite(value) || value <= 0) return `0 ${unit}`;
  // Whole numbers for sq.ft; up to 2 decimals for fractional units like acre/bigha.
  const isWhole = Math.abs(value - Math.round(value)) < 0.005;
  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: isWhole ? 0 : 2,
    minimumFractionDigits: 0,
  })} ${unit}`;
};