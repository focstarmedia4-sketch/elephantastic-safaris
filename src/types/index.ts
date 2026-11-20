export type UserRole = 'traveler' | 'operator' | 'admin';

export type TravelCategory = 'safari' | 'hotel' | 'bnb';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'KSH';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  country: string;
  password?: string;
  phone?: string;
  preferred_currency?: Currency;
  created_at: string;
}

export type OperatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Operator {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  categories: TravelCategory[];
  regions: string[];
  description?: string;
  licence_file_name?: string;
  business_registration_file_name?: string;
  licence_number?: string;
  status: OperatorStatus;
  is_profile_complete?: boolean;
  rejection_reason?: string;
  access_expires_at: string | null; // ISO timestamp (legacy/bidding pass fallback)
  bidding_pass_expires_at?: string | null; // 24-hour KSH 850 bidding pass
  contact_unlock_expires_at?: string | null; // legacy contact pass fallback
  rating: number;
  review_count: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  operator_id: string;
  request_id: string;
  created_at: string;
}

export interface PassHistoryItem {
  id: string;
  operator_id: string;
  start: string;
  end: string;
  bids_sent_count: number;
  status: 'active' | 'expired';
  mpesa_transaction_id: string;
  amount: number;
}

export type RequestStatus = 'open' | 'locked' | 'closed' | 'expired';

export interface SafariDetails {
  days: number;
  parks: string[];
  activities: string[];
  accommodation_level: 'budget' | 'mid-range' | 'luxury';
  airport_pickup: boolean;
  vehicle_type: 'private_4x4' | 'shared_van';
}

export interface HotelDetails {
  destination: string;
  rooms: number;
  room_type: string;
  star_rating: string;
  meal_plan: 'bed_and_breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  amenities: string[];
}

export interface BnBDetails {
  neighbourhood: string;
  bedrooms: number;
  place_type: 'entire_place' | 'private_room';
  amenities: string[];
  self_check_in: boolean;
}

export interface TravelRequest {
  id: string;
  traveler_id: string;
  traveler_name: string;
  traveler_country: string;
  title: string;
  category: TravelCategory;
  start_date: string;
  end_date: string;
  flexible_month?: string;
  adults: number;
  children: number;
  budget: number;
  currency: Currency;
  budget_usd?: number;
  notes: string;
  safari_details?: SafariDetails;
  hotel_details?: HotelDetails;
  bnb_details?: BnBDetails;
  slot_limit: number; // default 30 (legacy compatibility)
  unlock_limit: number; // default 30
  unlocks_enabled: boolean; // default true
  status: RequestStatus;
  expires_at: string; // ISO date, default 7 days from creation
  created_at: string;
  closed_reason?: string;
  whatsapp_number?: string;
  call_number?: string;
  email_address?: string;
  preferred_contact_method?: 'whatsapp' | 'email' | 'phone';
  preferred_contact_methods?: ('whatsapp' | 'email' | 'phone')[];
  bids_only?: boolean; // Traveler can turn unlocking off ("bids only")
  is_booked?: boolean;
  booked_operator_id?: string;
  booked_at?: string;
}

export type BidStatus = 'sent' | 'viewed' | 'shortlisted' | 'contact_shared' | 'declined';

export interface BidFollowUp {
  id: string;
  message: string;
  created_at: string;
}

export interface Bid {
  id: string;
  request_id: string;
  operator_id: string;
  operator_business_name: string;
  operator_rating: number;
  operator_review_count: number;
  operator_verified: boolean;
  price: number;
  amount?: number; // alias for price matching prompt spec
  currency: Currency;
  inclusions: string[];
  message: string;
  follow_ups?: BidFollowUp[];
  valid_until: string;
  status: BidStatus;
  created_at: string;
  // Operator contacts required when bidding:
  operator_email?: string;
  operator_whatsapp?: string;
  operator_phone?: string;
}

export interface TravelerUnlockNotification {
  id: string;
  request_id: string;
  request_title: string;
  operator_id: string;
  operator_business_name: string;
  operator_phone?: string;
  operator_email?: string;
  unlocked_at: string;
  fee_ksh: number;
}

export interface TravelerContact {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferred_channel: string;
}

export interface ContactShare {
  id: string;
  request_id: string;
  operator_id: string;
  traveler_id: string;
  traveler_contact: TravelerContact;
  shared_at: string;
}

export type PassType = 'bidding' | 'contact_unlock';

export type PaymentType = 'pass' | 'unlock';

export type PaymentStatus = 'paid' | 'completed' | 'failed';

export interface PaymentRecord {
  id: string;
  operator_id: string;
  operator_business_name?: string;
  type?: PaymentType;
  pass_type?: string;
  request_id?: string | null;
  request_title?: string;
  amount_ksh?: number;
  amount: number; // For backward compatibility
  currency: 'KSH';
  mpesa_transaction_id: string;
  phone_number?: string;
  status: PaymentStatus;
  failure_reason?: string;
  paid_at: string;
  pass_expires_at?: string | null; // Passes only
}

export type UnlockStatus = 'held' | 'paid' | 'failed' | 'refunded';

export interface ContactUnlockRecord {
  id: string;
  request_id: string;
  operator_id: string;
  tier: string;
  fee_ksh: number;
  status: UnlockStatus;
  held_until: string; // ISO string (~2 minutes)
  paid_at?: string | null;
  request_title: string;
  request_category: TravelCategory;
  traveler_country?: string;
  traveler_contact?: TravelerContact;
  mpesa_transaction_id?: string;
}

export interface UnlockTier {
  id: string;
  minUsd: number;
  maxUsd: number;
  feeKsh: number;
  label: string;
}

export interface AdminMarketplaceSettings {
  exchangeRateKshPerUsd: number;
  biddingPassFeeKsh: number;
  biddingPassDurationHours: number;
  maxUnlocksPerListing: number;
  holdDurationSeconds: number;
  tiers: UnlockTier[];
}

export interface Review {
  id: string;
  operator_id: string;
  traveler_id: string;
  traveler_name: string;
  traveler_country: string;
  request_id: string;
  rating: number; // 1 to 5
  comment: string;
  trip_type: string;
  created_at: string;
}

export interface FlaggedReport {
  id: string;
  reported_by_id: string;
  reported_by_name: string;
  target_type: 'operator' | 'bid' | 'request';
  target_id: string;
  target_title: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export type BlogCategory =
  | 'Safaris & Wildlife'
  | 'Beaches & Coastal Holidays'
  | 'Hotels & Accommodation'
  | 'Food & Culture'
  | 'Adventures & Experiences'
  | 'Travel Guides & Inspiration';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  destination: string;
  category: BlogCategory;
  image_url: string;
  author_name: string;
  author_role: string;
  published_at: string;
  read_time: string;
  excerpt: string;
  content: string;
  best_months: string;
  estimated_budget_usd: string;
  recommended_duration: string;
  highlights: string[];
  cta_prompt?: string;
  cta_button_label?: string;
  cta_category?: TravelCategory;
}

