// Lucknow PIN code → localities + centroid coordinates.
// Curated mapping of the most active Lucknow PINs used for property search.

export interface LucknowPincode {
  pincode: string;
  area: string;          // human label
  localities: string[];  // localities served by this PIN (match property.locality)
  coords: [number, number];
}

export const LUCKNOW_PINCODES: LucknowPincode[] = [
  { pincode: "226001", area: "Hazratganj / GPO", localities: ["Hazratganj", "Mall Avenue"], coords: [26.8500, 80.9445] },
  { pincode: "226003", area: "Aminabad / Chowk", localities: ["Aminabad", "Chowk"], coords: [26.8470, 80.9300] },
  { pincode: "226004", area: "Cantonment", localities: ["Cantonment", "Mall Avenue"], coords: [26.8350, 80.9450] },
  { pincode: "226005", area: "Alambagh", localities: ["Alambagh", "Kanpur Road"], coords: [26.8050, 80.8950] },
  { pincode: "226006", area: "Mahanagar", localities: ["Mahanagar", "Nirala Nagar"], coords: [26.8770, 80.9550] },
  { pincode: "226007", area: "Aliganj", localities: ["Aliganj", "Vikas Nagar"], coords: [26.8950, 80.9420] },
  { pincode: "226010", area: "Indira Nagar", localities: ["Indira Nagar"], coords: [26.8740, 80.9990] },
  { pincode: "226012", area: "Gomti Nagar", localities: ["Gomti Nagar", "Vibhuti Khand"], coords: [26.8500, 81.0030] },
  { pincode: "226016", area: "Vikas Nagar", localities: ["Vikas Nagar", "Aliganj"], coords: [26.9050, 80.9650] },
  { pincode: "226017", area: "Rajajipuram", localities: ["Rajajipuram"], coords: [26.8420, 80.8700] },
  { pincode: "226021", area: "Jankipuram", localities: ["Jankipuram"], coords: [26.9180, 80.9400] },
  { pincode: "226022", area: "Chinhat / Faizabad Road", localities: ["Chinhat", "Faizabad Road"], coords: [26.8800, 81.0700] },
  { pincode: "226024", area: "Aashiana", localities: ["Aashiana", "Kanpur Road"], coords: [26.7950, 80.9100] },
  { pincode: "226025", area: "Telibagh / Sushant Golf City", localities: ["Telibagh", "Sushant Golf City", "Sultanpur Road"], coords: [26.7700, 81.0150] },
  { pincode: "226028", area: "Gomti Nagar Extension", localities: ["Gomti Nagar", "Vibhuti Khand"], coords: [26.8600, 81.0200] },
  { pincode: "226030", area: "Sultanpur Road", localities: ["Sultanpur Road", "Sushant Golf City"], coords: [26.7800, 81.0200] },
];

export const lookupPincode = (pin: string): LucknowPincode | null =>
  LUCKNOW_PINCODES.find(p => p.pincode === pin.trim()) || null;

export const isLucknowPincode = (q: string): boolean => /^226\d{3}$/.test(q.trim());

// Locality recommendations grouped by buyer intent (used in filter sidebar).
export const LOCALITY_RECOMMENDATIONS: { label: string; localities: string[] }[] = [
  { label: "Premium / Luxury", localities: ["Gomti Nagar", "Hazratganj", "Mall Avenue", "Vibhuti Khand", "Sushant Golf City"] },
  { label: "Affordable", localities: ["Alambagh", "Rajajipuram", "Aashiana", "Telibagh", "Kanpur Road"] },
  { label: "Family / Schools", localities: ["Indira Nagar", "Aliganj", "Mahanagar", "Jankipuram", "Vikas Nagar"] },
  { label: "Investment / Upcoming", localities: ["Sultanpur Road", "Chinhat", "Faizabad Road", "Sushant Golf City"] },
];