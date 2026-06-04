import prop1 from "@/assets/property1.jpg";
import prop2 from "@/assets/property2.jpg";
import prop3 from "@/assets/property3.jpg";
import prop4 from "@/assets/property4.jpg";
import prop5 from "@/assets/property5.jpg";
import prop6 from "@/assets/property6.jpg";
import { formatPropertyPrice } from "@/lib/propertyDisplay";

export interface Property {
  id: string;
  title: string;
  type: "buy" | "rent" | "commercial" | "plot" | "pg";
  category: string;
  price: number;
  priceUnit: "total" | "monthly";
  area: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  city: string;
  locality: string;
  address: string;
  image: string;
  images: string[];
  amenities: string[];
  furnishing: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
  status: "Ready to Move" | "Under Construction" | "New Launch";
  postedBy: "Owner" | "Agent" | "Builder";
  postedDate: string;
  verified: boolean;
  featured: boolean;
  isNew: boolean;
  description: string;
  facing: string;
  parking: number;
  ageOfProperty: string;
  societyName?: string;
  builderName?: string;
  reraId?: string;
  nearbyPlaces: { name: string; distance: string; type: string }[];
  pricePerSqft: number;
  latitude?: number;
  longitude?: number;
}

export const properties: Property[] = [
  {
    id: "P001",
    title: "Luxurious 3BHK Apartment with City View",
    type: "buy",
    category: "Apartment",
    price: 12500000,
    priceUnit: "total",
    area: 1850,
    areaUnit: "sq.ft",
    bedrooms: 3,
    bathrooms: 3,
    floor: 18,
    totalFloors: 28,
    city: "Lucknow",
    locality: "Gomti Nagar",
    address: "Vipul Khand, Gomti Nagar, Lucknow - 226010",
    image: prop1,
    images: [prop1, prop6, prop2],
    amenities: ["Swimming Pool", "Gym", "Security", "Club House", "Power Backup", "Parking", "Lift"],
    furnishing: "Semi-Furnished",
    status: "Ready to Move",
    postedBy: "Agent",
    postedDate: "2 days ago",
    verified: true,
    featured: true,
    isNew: false,
    description: "Premium 3BHK apartment on 18th floor with panoramic city views. Modern kitchen, spacious balcony, and top-notch amenities. Located in the heart of Gomti Nagar near Phoenix Palassio mall and Riverfront.",
    facing: "East",
    parking: 2,
    ageOfProperty: "3 Years",
    societyName: "Skyline Heights",
    pricePerSqft: 6757,
    nearbyPlaces: [
      { name: "Gomti Nagar Metro", distance: "0.8 km", type: "transport" },
      { name: "Phoenix Palassio Mall", distance: "0.3 km", type: "shopping" },
      { name: "Medanta Hospital", distance: "1.2 km", type: "hospital" },
    ],
    latitude: 26.8500,
    longitude: 81.0030,
  },
  {
    id: "P002",
    title: "Stunning Villa with Private Pool",
    type: "buy",
    category: "Villa",
    price: 45000000,
    priceUnit: "total",
    area: 5200,
    areaUnit: "sq.ft",
    bedrooms: 5,
    bathrooms: 6,
    floor: 0,
    totalFloors: 2,
    city: "Lucknow",
    locality: "Sushant Golf City",
    address: "Sushant Golf City, Sultanpur Road, Lucknow - 226030",
    image: prop2,
    images: [prop2, prop1, prop6],
    amenities: ["Private Pool", "Garden", "Servant Quarters", "Security", "Parking", "Modular Kitchen"],
    furnishing: "Fully Furnished",
    status: "Ready to Move",
    postedBy: "Owner",
    postedDate: "5 days ago",
    verified: true,
    featured: true,
    isNew: false,
    description: "Exquisite villa inside Sushant Golf City with private swimming pool, lush garden, and 5 en-suite bedrooms. Perfect for luxury living next to the golf course.",
    facing: "West",
    parking: 4,
    ageOfProperty: "2 Years",
    pricePerSqft: 8654,
    nearbyPlaces: [
      { name: "Sushant Golf Course", distance: "0.5 km", type: "leisure" },
      { name: "Apollomedics Hospital", distance: "3.5 km", type: "hospital" },
      { name: "CCS Airport Lucknow", distance: "12 km", type: "transport" },
    ],
  },
  {
    id: "P003",
    title: "Premium Office Space in Tech Park",
    type: "commercial",
    category: "Office Space",
    price: 8500000,
    priceUnit: "total",
    area: 3200,
    areaUnit: "sq.ft",
    city: "Lucknow",
    locality: "Vibhuti Khand",
    address: "Vibhuti Khand, Gomti Nagar, Lucknow - 226010",
    image: prop3,
    images: [prop3, prop1],
    amenities: ["24/7 Security", "Parking", "Power Backup", "Cafeteria", "Conference Rooms", "High-Speed Internet"],
    furnishing: "Fully Furnished",
    status: "Ready to Move",
    postedBy: "Builder",
    postedDate: "1 week ago",
    verified: true,
    featured: false,
    isNew: true,
    description: "Grade-A office space in Vibhuti Khand IT corridor. Open plan with modern fitouts, dedicated parking, and 24/7 operations support.",
    facing: "North",
    parking: 10,
    ageOfProperty: "New",
    builderName: "Omaxe",
    reraId: "UPRERAPRJ12345",
    pricePerSqft: 2656,
    nearbyPlaces: [
      { name: "TCS Lucknow Campus", distance: "0.2 km", type: "office" },
      { name: "Munshipulia Metro", distance: "1.5 km", type: "transport" },
      { name: "Fun Republic Mall", distance: "2 km", type: "shopping" },
    ],
  },
  {
    id: "P004",
    title: "Modern Township 2BHK - Ready Possession",
    type: "buy",
    category: "Apartment",
    price: 6800000,
    priceUnit: "total",
    area: 1100,
    areaUnit: "sq.ft",
    bedrooms: 2,
    bathrooms: 2,
    floor: 5,
    totalFloors: 12,
    city: "Lucknow",
    locality: "Jankipuram",
    address: "Sector G, Jankipuram, Lucknow - 226021",
    image: prop4,
    images: [prop4, prop5, prop6],
    amenities: ["Swimming Pool", "Gym", "Jogging Track", "Kids Play Area", "Club House", "Parking"],
    furnishing: "Unfurnished",
    status: "Ready to Move",
    postedBy: "Builder",
    postedDate: "3 days ago",
    verified: true,
    featured: true,
    isNew: false,
    description: "Spacious 2BHK in a well-planned Jankipuram township. Close to IIM Lucknow, with amenities including pool, gym, and club house. UP RERA registered.",
    facing: "North-East",
    parking: 1,
    ageOfProperty: "1 Year",
    societyName: "Eldeco Green Meadows",
    builderName: "Eldeco Group",
    reraId: "UPRERAPRJ26542",
    pricePerSqft: 6182,
    nearbyPlaces: [
      { name: "IIM Lucknow", distance: "0.8 km", type: "office" },
      { name: "One Awadh Center Mall", distance: "1.5 km", type: "shopping" },
      { name: "Sahara Hospital", distance: "2.1 km", type: "hospital" },
    ],
  },
  {
    id: "P005",
    title: "Cozy 1BHK for Rent - Furnished",
    type: "rent",
    category: "Apartment",
    price: 22000,
    priceUnit: "monthly",
    area: 650,
    areaUnit: "sq.ft",
    bedrooms: 1,
    bathrooms: 1,
    floor: 3,
    totalFloors: 8,
    city: "Lucknow",
    locality: "Hazratganj",
    address: "Mahatma Gandhi Marg, Hazratganj, Lucknow - 226001",
    image: prop5,
    images: [prop5, prop1],
    amenities: ["Security", "Parking", "Power Backup", "Lift", "WiFi"],
    furnishing: "Fully Furnished",
    status: "Ready to Move",
    postedBy: "Owner",
    postedDate: "1 day ago",
    verified: false,
    featured: false,
    isNew: true,
    description: "Well-furnished 1BHK in the heart of Hazratganj. Includes sofa, bed, wardrobe, washing machine, and WiFi. Walking distance to Hazratganj Market.",
    facing: "South",
    parking: 1,
    ageOfProperty: "4 Years",
    societyName: "Ganj Heritage Towers",
    pricePerSqft: 34,
    nearbyPlaces: [
      { name: "Hazratganj Metro", distance: "0.4 km", type: "transport" },
      { name: "Janpath Market", distance: "0.3 km", type: "shopping" },
      { name: "Civil Hospital", distance: "0.8 km", type: "hospital" },
    ],
  },
  {
    id: "P006",
    title: "Elegant 3BHK Independent Floor",
    type: "buy",
    category: "Builder Floor",
    price: 18500000,
    priceUnit: "total",
    area: 2400,
    areaUnit: "sq.ft",
    bedrooms: 3,
    bathrooms: 4,
    floor: 2,
    totalFloors: 3,
    city: "Lucknow",
    locality: "Mahanagar",
    address: "Sector D, Mahanagar, Lucknow - 226006",
    image: prop6,
    images: [prop6, prop1, prop2],
    amenities: ["Modular Kitchen", "Parking", "Security", "Garden", "Terrace Access"],
    furnishing: "Semi-Furnished",
    status: "Ready to Move",
    postedBy: "Owner",
    postedDate: "4 days ago",
    verified: true,
    featured: false,
    isNew: false,
    description: "Spacious and elegant 3BHK builder floor with private terrace in Mahanagar. Quiet, leafy neighborhood with excellent connectivity to Hazratganj and Aliganj.",
    facing: "East",
    parking: 2,
    ageOfProperty: "6 Years",
    pricePerSqft: 7708,
    nearbyPlaces: [
      { name: "Badshah Nagar Metro", distance: "0.5 km", type: "transport" },
      { name: "Riverside Mall", distance: "3 km", type: "shopping" },
      { name: "KGMU Hospital", distance: "5 km", type: "hospital" },
    ],
  },
  {
    id: "P007",
    title: "2BHK Flat for Rent - Semi Furnished",
    type: "rent",
    category: "Apartment",
    price: 35000,
    priceUnit: "monthly",
    area: 950,
    areaUnit: "sq.ft",
    bedrooms: 2,
    bathrooms: 2,
    floor: 7,
    totalFloors: 15,
    city: "Lucknow",
    locality: "Indira Nagar",
    address: "Sector 14, Indira Nagar, Lucknow - 226016",
    image: prop1,
    images: [prop1, prop5],
    amenities: ["Gym", "Swimming Pool", "Security", "Parking", "Lift", "Power Backup"],
    furnishing: "Semi-Furnished",
    status: "Ready to Move",
    postedBy: "Agent",
    postedDate: "2 days ago",
    verified: true,
    featured: true,
    isNew: false,
    description: "Premium 2BHK on high floor with excellent breeze. Society with pool and gym. Near to schools, hospitals, and Indira Nagar Metro Station.",
    facing: "North",
    parking: 1,
    ageOfProperty: "5 Years",
    societyName: "Awadh Celestia Spaces",
    pricePerSqft: 37,
    nearbyPlaces: [
      { name: "Indira Nagar Metro", distance: "0.4 km", type: "transport" },
      { name: "Spencer's Indira Nagar", distance: "1 km", type: "shopping" },
      { name: "Charak Hospital", distance: "1.8 km", type: "hospital" },
    ],
  },
  {
    id: "P008",
    title: "PG Accommodation - Girls Only",
    type: "pg",
    category: "PG",
    price: 8500,
    priceUnit: "monthly",
    area: 120,
    areaUnit: "sq.ft",
    city: "Lucknow",
    locality: "Aliganj",
    address: "Sector H, Aliganj, Lucknow - 226024",
    image: prop5,
    images: [prop5],
    amenities: ["WiFi", "Meals Included", "Laundry", "Security", "AC", "Power Backup"],
    furnishing: "Fully Furnished",
    status: "Ready to Move",
    postedBy: "Owner",
    postedDate: "Today",
    verified: false,
    featured: false,
    isNew: true,
    description: "Premium PG for working women. Triple/double/single occupancy available. Homely meals, 24/7 WiFi, and secure environment in the heart of Aliganj.",
    facing: "South",
    parking: 0,
    ageOfProperty: "5 Years",
    pricePerSqft: 71,
    nearbyPlaces: [
      { name: "Phoenix Mall Lucknow", distance: "2.5 km", type: "shopping" },
      { name: "Aliganj Bus Stand", distance: "0.2 km", type: "transport" },
      { name: "Sahara Hospital", distance: "1.5 km", type: "hospital" },
    ],
  },
];

// Single-city project: Lucknow only.
export const cities = ["Lucknow"];

// Popular localities across Lucknow — used as the "city" dropdown across the app.
export const lucknowLocalities = [
  "Gomti Nagar", "Hazratganj", "Indira Nagar", "Aliganj", "Mahanagar",
  "Aminabad", "Chowk", "Alambagh", "Vibhuti Khand", "Jankipuram",
  "Vikas Nagar", "Rajajipuram", "Telibagh", "Sushant Golf City",
  "Sultanpur Road", "Faizabad Road", "Kanpur Road", "Aashiana",
  "Chinhat", "Bakshi Ka Talab", "Mall Avenue", "Butler Colony",
  "Husainganj", "Rajendra Nagar",
];

export const propertyTypes = [
  { label: "Apartment", value: "apartment", icon: "🏢" },
  { label: "Villa", value: "villa", icon: "🏡" },
  { label: "Builder Floor", value: "builder-floor", icon: "🏗️" },
  { label: "Penthouse", value: "penthouse", icon: "🏙️" },
  { label: "Row House", value: "row-house", icon: "🏘️" },
  { label: "Plot/Land", value: "plot", icon: "🌍" },
  { label: "Studio", value: "studio", icon: "🛋️" },
  { label: "Office Space", value: "office", icon: "💼" },
  { label: "Shop/Retail", value: "shop", icon: "🏪" },
  { label: "Warehouse", value: "warehouse", icon: "🏭" },
];

export const localities = {
  "Lucknow": lucknowLocalities,
};

// Legacy dummy data removed - all data now comes from database

export const formatPrice = (price: number, unit: "total" | "monthly" = "total"): string => formatPropertyPrice(price, unit);
