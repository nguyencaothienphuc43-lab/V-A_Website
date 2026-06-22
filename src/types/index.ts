export type Locale = "en" | "vi";

export type UserRole = "customer" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  role: UserRole;
  preferred_locale: Locale;
  created_at: string;
  updated_at: string;
}

export type ServiceType = "air" | "sea" | "road";

export type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "cancelled";

export interface Shipment {
  id: string;
  tracking_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_type: ServiceType;
  origin_country: string;
  origin_city: string;
  dest_country: string;
  dest_city: string;
  description: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  pieces: number | null;
  status: ShipmentStatus;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tracking_events?: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  location: string;
  status: string;
  description: string | null;
  description_vi: string | null;
  event_time: string;
}

export type QuoteStatus = "pending" | "reviewing" | "quoted" | "accepted" | "declined";

export interface Quote {
  id: string;
  customer_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company: string | null;
  service_type: ServiceType | null;
  origin_country: string | null;
  origin_city: string | null;
  dest_country: string | null;
  dest_city: string | null;
  cargo_type: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  pieces: number | null;
  incoterm: string | null;
  special_requirements: string | null;
  estimated_price_usd: number | null;
  status: QuoteStatus;
  admin_notes: string | null;
  final_price_usd: number | null;
  valid_until: string | null;
  created_at: string;
}

// Quote calculator
export interface QuoteEstimate {
  baseRate: number;
  fuelSurcharge: number;
  handlingFee: number;
  total: number;
  currency: "USD";
  transit: string;
}

export const SERVICE_RATES: Record<ServiceType, { base: number; perKg: number; fuel: number; handling: number; transit: string }> = {
  air: { base: 150, perKg: 4.5,  fuel: 0.15, handling: 75,  transit: "3–7 business days"  },
  sea: { base: 350, perKg: 0.35, fuel: 0.12, handling: 120, transit: "15–35 business days" },
  road:{ base: 80,  perKg: 0.8,  fuel: 0.10, handling: 50,  transit: "3–10 business days"  },
};

export function estimateQuote(service: ServiceType, weightKg: number, volumeCbm: number): QuoteEstimate {
  const r = SERVICE_RATES[service];
  const chargeableWeight = Math.max(weightKg, volumeCbm * 167); // volumetric factor
  const baseRate = r.base + chargeableWeight * r.perKg;
  const fuelSurcharge = baseRate * r.fuel;
  const handlingFee = r.handling;
  const total = Math.round(baseRate + fuelSurcharge + handlingFee);
  return { baseRate: Math.round(baseRate), fuelSurcharge: Math.round(fuelSurcharge), handlingFee, total, currency: "USD", transit: r.transit };
}

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending:           "bg-yellow-100 text-yellow-800",
  picked_up:         "bg-blue-100 text-blue-800",
  in_transit:        "bg-indigo-100 text-indigo-800",
  customs:           "bg-purple-100 text-purple-800",
  out_for_delivery:  "bg-brand-100 text-brand-800",
  delivered:         "bg-green-100 text-green-800",
  exception:         "bg-red-100 text-red-800",
  cancelled:         "bg-gray-100 text-gray-600",
};
