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
    city: "Mumbai",
    locality: "Bandra West",
    address: "Linking Road, Bandra West, Mumbai - 400050",
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
    description: "Premium 3BHK apartment on 18th floor with panoramic city views. Modern kitchen, spacious balcony, and top-notch amenities. Located in the heart of Bandra West near malls and sea.",
    facing: "East",
    parking: 2,
    ageOfProperty: "3 Years",
    societyName: "Skyline Heights",
    pricePerSqft: 6757,
    nearbyPlaces: [
      { name: "Bandra Station", distance: "0.8 km", type: "transport" },
      { name: "Linking Road Mall", distance: "0.3 km", type: "shopping" },
      { name: "Lilavati Hospital", distance: "1.2 km", type: "hospital" },
    ],
    latitude: 19.0596,
    longitude: 72.8295,
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
    city: "Goa",
    locality: "Calangute",
    address: "North Goa, Calangute Beach Road",
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
    description: "Exquisite beachside villa with private swimming pool, lush tropical garden, and 5 en-suite bedrooms. Perfect for luxury living or holiday home investment.",
    facing: "West",
    parking: 4,
    ageOfProperty: "2 Years",
    pricePerSqft: 8654,
    nearbyPlaces: [
      { name: "Calangute Beach", distance: "0.5 km", type: "leisure" },
      { name: "Goa Hospital", distance: "3.5 km", type: "hospital" },
      { name: "Dabolim Airport", distance: "45 km", type: "transport" },
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
    city: "Bangalore",
    locality: "Whitefield",
    address: "ITPL Main Road, Whitefield, Bangalore - 560066",
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
    description: "Grade-A office space in Whitefield's prime IT corridor. Open plan with modern fitouts, dedicated parking, and 24/7 operations support.",
    facing: "North",
    parking: 10,
    ageOfProperty: "New",
    builderName: "Prestige Group",
    reraId: "PRM/KA/RERA/1251/446/PR/200406/003551",
    pricePerSqft: 2656,
    nearbyPlaces: [
      { name: "ITPL", distance: "0.2 km", type: "office" },
      { name: "Whitefield Station", distance: "1.5 km", type: "transport" },
      { name: "Forum Shantiniketan", distance: "2 km", type: "shopping" },
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
    city: "Pune",
    locality: "Hinjewadi",
    address: "Phase 2, Hinjewadi, Pune - 411057",
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
    description: "Spacious 2BHK in a well-planned township. Close to IT hubs, with world-class amenities including pool, gym, and club house. RERA registered.",
    facing: "North-East",
    parking: 1,
    ageOfProperty: "1 Year",
    societyName: "Green Valley Township",
    builderName: "Godrej Properties",
    reraId: "P52100026542",
    pricePerSqft: 6182,
    nearbyPlaces: [
      { name: "Infosys Campus", distance: "0.8 km", type: "office" },
      { name: "Xion Mall", distance: "1.5 km", type: "shopping" },
      { name: "Hinjewadi Hospital", distance: "2.1 km", type: "hospital" },
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
    city: "Hyderabad",
    locality: "Gachibowli",
    address: "Financial District, Gachibowli, Hyderabad - 500032",
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
    description: "Well-furnished 1BHK near Financial District. Includes sofa, bed, wardrobe, washing machine, and WiFi. Ideal for IT professionals.",
    facing: "South",
    parking: 1,
    ageOfProperty: "4 Years",
    societyName: "Prestige Towers",
    pricePerSqft: 34,
    nearbyPlaces: [
      { name: "HITECH City Metro", distance: "1.2 km", type: "transport" },
      { name: "Inorbit Mall", distance: "2.5 km", type: "shopping" },
      { name: "DLF Cyber City", distance: "0.5 km", type: "office" },
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
    city: "Delhi NCR",
    locality: "Vasant Kunj",
    address: "Sector D, Vasant Kunj, New Delhi - 110070",
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
    description: "Spacious and elegant 3BHK builder floor with private terrace in South Delhi's prime Vasant Kunj. Quiet neighborhood with excellent connectivity.",
    facing: "East",
    parking: 2,
    ageOfProperty: "6 Years",
    pricePerSqft: 7708,
    nearbyPlaces: [
      { name: "Vasant Kunj Metro", distance: "0.5 km", type: "transport" },
      { name: "Ambience Mall", distance: "3 km", type: "shopping" },
      { name: "AIIMS", distance: "5 km", type: "hospital" },
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
    city: "Chennai",
    locality: "Anna Nagar",
    address: "6th Avenue, Anna Nagar, Chennai - 600040",
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
    description: "Premium 2BHK on high floor with excellent breeze. Society with pool and gym. Near to schools, hospitals, and metro station.",
    facing: "North",
    parking: 1,
    ageOfProperty: "5 Years",
    societyName: "Celestia Spaces",
    pricePerSqft: 37,
    nearbyPlaces: [
      { name: "Anna Nagar Tower Metro", distance: "0.4 km", type: "transport" },
      { name: "Spencer's", distance: "1 km", type: "shopping" },
      { name: "Sundaram Hospital", distance: "1.8 km", type: "hospital" },
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
    city: "Bangalore",
    locality: "Koramangala",
    address: "5th Block, Koramangala, Bangalore - 560034",
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
    description: "Premium PG for working women. Triple/double/single occupancy available. Homely meals, 24/7 WiFi, and secure environment in the heart of Koramangala.",
    facing: "South",
    parking: 0,
    ageOfProperty: "5 Years",
    pricePerSqft: 71,
    nearbyPlaces: [
      { name: "Forum Mall", distance: "0.8 km", type: "shopping" },
      { name: "Koramangala Bus Stop", distance: "0.2 km", type: "transport" },
      { name: "Apollo Hospital", distance: "2.5 km", type: "hospital" },
    ],
  },
];

export const cities = [
  "Delhi NCR", "Mumbai", "Bangalore", "Hyderabad", "Chennai", 
  "Pune", "Kolkata", "Ahmedabad", "Noida", "Gurgaon",
  "Jaipur", "Lucknow", "Chandigarh", "Surat", "Vadodara",
  "Goa", "Kochi", "Indore", "Bhopal", "Nagpur"
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
  "Mumbai": ["Bandra West", "Andheri West", "Powai", "Worli", "Juhu", "Malad West", "Borivali"],
  "Delhi NCR": ["Vasant Kunj", "Hauz Khas", "Defence Colony", "Noida Sector 62", "Gurgaon DLF"],
  "Bangalore": ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Banaswadi", "Electronic City"],
  "Hyderabad": ["Gachibowli", "Jubilee Hills", "Banjara Hills", "Kondapur", "Hitech City"],
  "Chennai": ["Anna Nagar", "T Nagar", "Adyar", "Velachery", "OMR"],
  "Pune": ["Hinjewadi", "Baner", "Kothrud", "Viman Nagar", "Wakad"],
};

// Legacy dummy data removed - all data now comes from database

export const formatPrice = (price: number, unit: "total" | "monthly" = "total"): string => formatPropertyPrice(price, unit);
