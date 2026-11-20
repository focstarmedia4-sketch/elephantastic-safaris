import {
  User,
  Operator,
  TravelRequest,
  Bid,
  ContactShare,
  PaymentRecord,
  Review,
  FlaggedReport,
  BlogPost,
  BlogCategory,
  TravelCategory,
  Bookmark,
  ContactUnlockRecord,
  AdminMarketplaceSettings,
  UnlockTier,
} from '../types';
import { IMAGES } from '../assets/images';

export const SEED_USERS: User[] = [
  {
    id: 'user_traveler_1',
    email: 'sarah.jenkins@oxfordtravel.co.uk',
    role: 'traveler',
    name: 'Sarah Jenkins',
    country: 'United Kingdom',
    password: 'safari123',
    phone: '+44 7700 900123',
    created_at: '2026-10-15T09:30:00Z',
  },
  {
    id: 'user_traveler_2',
    email: 'david.miller@nycapitol.org',
    role: 'traveler',
    name: 'David Miller',
    country: 'United States',
    password: 'safari123',
    phone: '+1 212 555 0199',
    created_at: '2026-10-20T14:15:00Z',
  },
  {
    id: 'user_operator_1',
    email: 'jackson@marawildexpeditions.co.ke',
    role: 'operator',
    name: 'Jackson Ole Kaelo',
    country: 'Kenya',
    password: 'safari123',
    phone: '+254 722 456 789',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user_operator_2',
    email: 'amina@swahilicoaststays.co.ke',
    role: 'operator',
    name: 'Amina Swaleh',
    country: 'Kenya',
    password: 'safari123',
    phone: '+254 733 987 654',
    created_at: '2026-09-10T11:20:00Z',
  },
  {
    id: 'user_operator_3',
    email: 'brian@riftvalleyadventures.co.ke',
    role: 'operator',
    name: 'Brian Mwangi',
    country: 'Kenya',
    password: 'safari123',
    phone: '+254 711 234 567',
    created_at: '2026-11-08T16:00:00Z',
  },
  {
    id: 'user_operator_4',
    email: 'ezekiel@cheetahsafaris.co.ke',
    role: 'operator',
    name: 'Ezekiel Kiprono',
    country: 'Kenya',
    password: 'safari123',
    phone: '+254 720 112 233',
    created_at: '2026-09-25T10:00:00Z',
  },
  {
    id: 'user_admin_1',
    email: 'njeri@elephantasticsafaris.co.ke',
    role: 'admin',
    name: 'Njeri Njuguna',
    country: 'Kenya',
    password: 'safari123',
    phone: '+254 700 000 001',
    created_at: '2026-08-01T00:00:00Z',
  },
];

// Active pass for operator 1 expires in 9 hours from now (as in user spec "9 hours left")
const now = Date.now();
const passExpiryOperator1 = new Date(now + 9 * 60 * 60 * 1000).toISOString();
// Operator 2 has expired pass (expired 3 hours ago) to demonstrate the locked browsing + pay screen
const passExpiryOperator2 = new Date(now - 3 * 60 * 60 * 1000).toISOString();
// Operator 4 has active pass (expires in 12 hours)
const passExpiryOperator4 = new Date(now + 12 * 60 * 60 * 1000).toISOString();

export const SEED_OPERATORS: Operator[] = [
  {
    id: 'op_1',
    user_id: 'user_operator_1',
    business_name: 'Mara Wild Expeditions & Safaris',
    contact_name: 'Jackson Ole Kaelo',
    phone: '+254 722 456 789',
    email: 'jackson@marawildexpeditions.co.ke',
    categories: ['safari', 'hotel'],
    regions: ['Maasai Mara', 'Amboseli', 'Lake Nakuru', 'Samburu', 'Nairobi'],
    description: 'Licensed Kenyan tour firm specializing in bespoke 4x4 land cruiser safaris, private migration expeditions, and luxury tented camp itineraries with indigenous Maasai naturalist guides.',
    licence_file_name: 'TRA_Licence_MaraWild_2026_Class_A.pdf',
    business_registration_file_name: 'BRS_Cert_MaraWildExpeditions_CPR2019.pdf',
    licence_number: 'TRA/TO/2026/0419',
    status: 'approved',
    is_profile_complete: true,
    access_expires_at: passExpiryOperator1,
    bidding_pass_expires_at: passExpiryOperator1,
    contact_unlock_expires_at: passExpiryOperator1,
    rating: 4.9,
    review_count: 38,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'op_2',
    user_id: 'user_operator_2',
    business_name: 'Swahili Coast Retreats & Diani Villas',
    contact_name: 'Amina Swaleh',
    phone: '+254 733 987 654',
    email: 'amina@swahilicoaststays.co.ke',
    categories: ['hotel', 'bnb'],
    regions: ['Diani Beach', 'Watamu', 'Mombasa', 'Kilifi', 'Lamu'],
    description: 'Premier seaside hospitality provider managing private beachfront villas, serviced Swahili cottages, and luxury boutique coastal resorts.',
    licence_file_name: 'TRA_Coast_Hospitality_Permit_8832.pdf',
    business_registration_file_name: 'BRS_Cert_SwahiliCoastRetreats_2021.pdf',
    licence_number: 'TRA/HOTEL/2026/1842',
    status: 'approved',
    is_profile_complete: true,
    access_expires_at: passExpiryOperator2, // expired pass
    bidding_pass_expires_at: passExpiryOperator2,
    contact_unlock_expires_at: passExpiryOperator2,
    rating: 4.8,
    review_count: 24,
    created_at: '2026-09-10T11:20:00Z',
  },
  {
    id: 'op_3',
    user_id: 'user_operator_3',
    business_name: 'Rift Valley Eco-Stays & Adventures',
    contact_name: 'Brian Mwangi',
    phone: '+254 711 234 567',
    email: 'brian@riftvalleyadventures.co.ke',
    categories: ['safari', 'bnb'],
    regions: ['Naivasha', 'Nakuru'],
    description: '',
    licence_file_name: '',
    business_registration_file_name: '',
    licence_number: '',
    status: 'pending',
    is_profile_complete: false,
    access_expires_at: null,
    bidding_pass_expires_at: null,
    contact_unlock_expires_at: null,
    rating: 0,
    review_count: 0,
    created_at: '2026-11-08T16:00:00Z',
  },
  {
    id: 'op_4',
    user_id: 'user_operator_4',
    business_name: 'Cheetah Trackers Kenya Ltd',
    contact_name: 'Ezekiel Kiprono',
    phone: '+254 720 112 233',
    email: 'ezekiel@cheetahsafaris.co.ke',
    categories: ['safari'],
    regions: ['Maasai Mara', 'Tsavo East', 'Tsavo West', 'Nairobi'],
    description: 'Wildlife photographers and big cat tracking specialists.',
    licence_file_name: 'TRA_Licence_CheetahTrackers_Class_B.pdf',
    business_registration_file_name: 'BRS_CheetahTrackers_Reg.pdf',
    licence_number: 'TRA/TO/2026/0891',
    status: 'approved',
    is_profile_complete: true,
    access_expires_at: passExpiryOperator4,
    bidding_pass_expires_at: passExpiryOperator4,
    contact_unlock_expires_at: null,
    rating: 4.7,
    review_count: 19,
    created_at: '2026-09-25T10:00:00Z',
  },
];

export const SEED_REQUESTS: TravelRequest[] = [
  {
    id: 'req_1',
    traveler_id: 'user_traveler_1',
    traveler_name: 'Sarah Jenkins',
    traveler_country: 'United Kingdom',
    title: '7-Day Maasai Mara Great Migration & Amboseli Wildlife Safari',
    category: 'safari',
    start_date: '2026-12-14',
    end_date: '2026-12-21',
    adults: 2,
    children: 1,
    budget: 4500,
    currency: 'USD',
    budget_usd: 4500,
    notes: 'We are a small family seeking an authentic, private safari. Priority is seeing big cats in the Mara and iconic Kilimanjaro views with elephants in Amboseli. High quality photography opportunities appreciated.',
    safari_details: {
      days: 7,
      parks: ['Maasai Mara National Reserve', 'Amboseli National Park', 'Lake Nakuru'],
      activities: ['Game Drives', 'Hot Air Balloon Safari', 'Cultural Maasai Village Visit'],
      accommodation_level: 'luxury',
      airport_pickup: true,
      vehicle_type: 'private_4x4',
    },
    whatsapp_number: '+44 7700 900123',
    call_number: '+44 7700 900123',
    email_address: 'sarah.jenkins@uktravel.co.uk',
    preferred_contact_method: 'whatsapp',
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: true,
    status: 'open',
    expires_at: '2026-11-24T07:00:00Z',
    created_at: '2026-11-10T02:00:00Z',
  },
  {
    id: 'req_2',
    traveler_id: 'user_traveler_2',
    traveler_name: 'David Miller',
    traveler_country: 'United States',
    title: 'Private Swahili Villa with Private Chef & Pool in Diani Beach',
    category: 'bnb',
    start_date: '2026-12-23',
    end_date: '2027-01-02',
    adults: 4,
    children: 2,
    budget: 3800,
    currency: 'USD',
    budget_usd: 3800,
    notes: 'Looking for a serene holiday retreat with direct beach access or very close walking distance, a private freshwater swimming pool, and an in-house private chef service for family dinners.',
    bnb_details: {
      neighbourhood: 'Diani Beach (Galu Kinondo or Central)',
      bedrooms: 4,
      place_type: 'entire_place',
      amenities: ['Private Pool', 'In-house Chef', 'High-speed WiFi', 'Air Conditioning', 'Daily Housekeeping', '24h Security'],
      self_check_in: true,
    },
    whatsapp_number: '+1 415 555 0192',
    call_number: '+1 415 555 0192',
    email_address: 'david.miller@nyu.edu',
    preferred_contact_method: 'whatsapp',
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: true,
    status: 'open',
    expires_at: '2026-11-23T12:00:00Z',
    created_at: '2026-11-09T12:00:00Z',
  },
  {
    id: 'req_3',
    traveler_id: 'user_traveler_1',
    traveler_name: 'Sarah Jenkins',
    traveler_country: 'United Kingdom',
    title: 'Executive Hotel Stay near Westlands Nairobi for Agri-Tech Summit',
    category: 'hotel',
    start_date: '2026-12-08',
    end_date: '2026-12-13',
    adults: 2,
    children: 0,
    budget: 1600,
    currency: 'USD',
    budget_usd: 1600,
    notes: 'Attending an international conference. Need quiet business-friendly rooms, high-speed fiber internet, gym, and proximity to Westlands and GTC Nairobi. Breakfast included.',
    hotel_details: {
      destination: 'Nairobi (Westlands / Parklands)',
      rooms: 2,
      room_type: 'Executive King Room',
      star_rating: '4-Star or 5-Star Boutique',
      meal_plan: 'bed_and_breakfast',
      amenities: ['High Speed WiFi', 'Airport Shuttle', 'Swimming Pool', 'Fitness Center', 'Business Center'],
    },
    whatsapp_number: '+44 7700 900123',
    call_number: '+44 7700 900123',
    email_address: 'sarah.jenkins@uktravel.co.uk',
    preferred_contact_method: 'email',
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: true,
    status: 'open', // 30 unlocks reached -> Contacts full banner displayed! Bids stay open.
    expires_at: '2026-11-22T10:00:00Z',
    created_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'req_4',
    traveler_id: 'user_traveler_2',
    traveler_name: 'David Miller',
    traveler_country: 'United States',
    title: '4-Day Tsavo East & West Wilderness Safari with Salt Lick Stay',
    category: 'safari',
    start_date: '2027-01-04',
    end_date: '2027-01-08',
    adults: 2,
    children: 0,
    budget: 2200,
    currency: 'USD',
    budget_usd: 2200,
    notes: 'Short safari right after our coastal holiday. Interested in seeing the red elephants of Tsavo, Mzima Springs, and staying at an iconic stilt lodge overlooking the waterhole.',
    safari_details: {
      days: 4,
      parks: ['Tsavo East National Park', 'Tsavo West National Park'],
      activities: ['Game Drives', 'Bird Watching', 'Mzima Springs Nature Walk'],
      accommodation_level: 'mid-range',
      airport_pickup: false,
      vehicle_type: 'private_4x4',
    },
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: false,
    bids_only: true,
    status: 'open',
    expires_at: '2026-11-25T09:00:00Z',
    created_at: '2026-11-10T05:00:00Z',
  },
  {
    id: 'req_5',
    traveler_id: 'user_traveler_1',
    traveler_name: 'Sarah Jenkins',
    traveler_country: 'United Kingdom',
    title: 'Scenic Lake Naivasha Cottage Weekend with Crescent Island Walk',
    category: 'bnb',
    start_date: '2026-11-20',
    end_date: '2026-11-23',
    adults: 3,
    children: 0,
    budget: 950,
    currency: 'USD',
    budget_usd: 950,
    notes: 'Relaxing weekend trip with boat rides to see hippos and walking safari on Crescent Island.',
    bnb_details: {
      neighbourhood: 'Moi South Lake Road, Naivasha',
      bedrooms: 3,
      place_type: 'entire_place',
      amenities: ['Lake View', 'Private Chef available', 'Fireplace', 'Veranda Garden'],
      self_check_in: true,
    },
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: true,
    status: 'closed',
    closed_reason: 'Selected an operator and finalized booking.',
    is_booked: true,
    booked_operator_id: 'op_1',
    booked_at: '2026-11-11T12:00:00Z',
    expires_at: '2026-11-15T00:00:00Z',
    created_at: '2026-11-08T08:00:00Z',
  },
  {
    id: 'req_6',
    traveler_id: 'user_traveler_1',
    traveler_name: 'Sarah Jenkins',
    traveler_country: 'United Kingdom',
    title: '3-Day Ol Pejeta Chimpanzee & Rhino Sanctuary Eco-Retreat',
    category: 'safari',
    start_date: '2026-11-01',
    end_date: '2026-11-04',
    adults: 2,
    children: 0,
    budget: 1400,
    currency: 'USD',
    budget_usd: 1400,
    notes: 'Looking for a focused 3-day eco-safari to see the northern white rhinos and Sweetwaters chimpanzee sanctuary.',
    safari_details: {
      days: 3,
      parks: ['Ol Pejeta Conservancy'],
      activities: ['Game Drives', 'Rhino Tracking', 'Lion Tracking'],
      accommodation_level: 'mid-range',
      airport_pickup: true,
      vehicle_type: 'private_4x4',
    },
    slot_limit: 30,
    unlock_limit: 30,
    unlocks_enabled: true,
    status: 'expired',
    expires_at: '2026-11-04T00:00:00Z',
    created_at: '2026-10-28T08:00:00Z',
  },
];

export const SEED_BIDS: Bid[] = [
  // Bids on req_1 (Sarah's 7-day migration safari)
  {
    id: 'bid_1',
    request_id: 'req_1',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    operator_rating: 4.9,
    operator_review_count: 38,
    operator_verified: true,
    price: 4250,
    currency: 'USD',
    inclusions: [
      'Customized 4x4 Land Cruiser with pop-up roof & fridge',
      'Professional Silver-level KPSGA certified safari guide',
      'Full board luxury tented camp accommodation',
      'All government park entrance fees & conservation levies',
      'Complimentary Nairobi Jomo Kenyatta airport pickup & dropoff',
      'Unlimited daily game drives with bottled mineral water',
      'AMREF Flying Doctors emergency medical evacuation cover',
    ],
    message: 'Jambo Sarah! We have crafted an unforgettable private 7-day safari hitting the prime migration spots in Mara and top-tier elephant territory in Amboseli. Our guides have over 15 years in these ecosystems.',
    valid_until: '2026-11-25',
    status: 'contact_shared',
    created_at: '2026-11-10T03:30:00Z',
    operator_email: 'jackson@marawildexpeditions.co.ke',
    operator_whatsapp: '+254 722 456 789',
    operator_phone: '+254 722 456 789',
  },
  {
    id: 'bid_2',
    request_id: 'req_1',
    operator_id: 'op_4',
    operator_business_name: 'Cheetah Trackers Kenya Ltd',
    operator_rating: 4.7,
    operator_review_count: 19,
    operator_verified: true,
    price: 3950,
    currency: 'USD',
    inclusions: [
      'Private 4x4 Toyota Land Cruiser with pop-up roof',
      'All park entrance permits for Mara, Amboseli & Nakuru',
      'Mid-to-luxury eco-lodge accommodations on full board',
      'Dedicated safari driver-guide with spotting scopes',
      'Bush breakfast experience in Masai Mara savannah',
    ],
    message: 'Hello Sarah, Cheetah Trackers would be delighted to host your family. Our package includes an unforgettable private bush breakfast in the Mara and high-end vantage spots for photography.',
    valid_until: '2026-11-20',
    status: 'shortlisted',
    created_at: '2026-11-10T04:15:00Z',
    operator_email: 'ezekiel@cheetahsafaris.co.ke',
    operator_whatsapp: '+254 720 112 233',
    operator_phone: '+254 720 112 233',
  },

  // Bids on req_2 (David's Diani villa)
  {
    id: 'bid_3',
    request_id: 'req_2',
    operator_id: 'op_2',
    operator_business_name: 'Swahili Coast Retreats & Diani Villas',
    operator_rating: 4.8,
    operator_review_count: 24,
    operator_verified: true,
    price: 3500,
    currency: 'USD',
    inclusions: [
      'Exclusive occupancy of 4-bedroom beachfront Swahili villa',
      'Private dedicated chef for all breakfasts and 3-course dinners',
      'Freshwater private pool and sun loungers',
      'Direct private footpath to pristine Diani white sands (2 min)',
      'High-speed fiber optic Wi-Fi and solar backup power',
      'Daily housekeeping and night security team',
    ],
    message: 'Karibu David! Villa Moki is ideally situated in quiet Galu Kinondo. Chef Juma prepares outstanding fresh seafood straight from local fishermen, and the villa has full inverter backup power.',
    valid_until: '2026-11-24',
    status: 'sent',
    created_at: '2026-11-09T15:00:00Z',
    operator_email: 'amina@swahilicoaststays.co.ke',
    operator_whatsapp: '+254 733 987 654',
    operator_phone: '+254 733 987 654',
  },

  // Simulate 30 bids on req_3 to demonstrate the 30-slot lock cap rule!
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `bid_req3_${i + 1}`,
    request_id: 'req_3',
    operator_id: i === 0 ? 'op_1' : `op_mock_${i}`,
    operator_business_name: i === 0 ? 'Mara Wild Expeditions & Safaris' : `Nairobi Hospitality Partner #${i + 1}`,
    operator_rating: +(4.4 + (i % 6) * 0.1).toFixed(1),
    operator_review_count: 10 + (i * 3) % 25,
    operator_verified: true,
    price: 1300 + (i * 15) % 300,
    currency: 'USD' as const,
    inclusions: [
      'Executive King Suite with city skyline view',
      'Daily international buffet breakfast at rooftop restaurant',
      'Complimentary high-speed business fiber Wi-Fi',
      'Airport transfer to/from JKIA in private executive sedan',
      'Access to 24-hour gym and heated pool',
    ],
    message: `Offer ${i + 1} for Sarah: Excellent location within 5 minutes of Westlands business hub, 24/7 concierge, business lounge and express check-in.`,
    valid_until: '2026-11-20',
    status: i === 0 ? ('viewed' as const) : ('sent' as const),
    created_at: new Date(new Date('2026-11-07T12:00:00Z').getTime() + i * 3600000).toISOString(),
  })),
];

export const SEED_CONTACT_SHARES: ContactShare[] = [
  {
    id: 'cs_1',
    request_id: 'req_1',
    operator_id: 'op_1',
    traveler_id: 'user_traveler_1',
    shared_at: '2026-11-10T05:00:00Z',
    traveler_contact: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@oxfordtravel.co.uk',
      phone: '+44 7700 900123',
      whatsapp: '+44 7700 900123',
      preferred_channel: 'whatsapp',
    },
  },
];

export const SEED_ADMIN_SETTINGS: AdminMarketplaceSettings = {
  exchangeRateKshPerUsd: 130,
  biddingPassFeeKsh: 850,
  biddingPassDurationHours: 24,
  maxUnlocksPerListing: 30,
  holdDurationSeconds: 120,
  tiers: [
    { id: 'tier_1', minUsd: 0, maxUsd: 2000, feeKsh: 120, label: 'Under USD 2,000: KSH 120' },
    { id: 'tier_2', minUsd: 2000, maxUsd: 5000, feeKsh: 300, label: 'USD 2,000 to 4,999: KSH 300' },
    { id: 'tier_3', minUsd: 5000, maxUsd: 10000, feeKsh: 600, label: 'USD 5,000 to 9,999: KSH 600' },
    { id: 'tier_4', minUsd: 10000, maxUsd: 20000, feeKsh: 1200, label: 'USD 10,000 to 19,999: KSH 1,200' },
    { id: 'tier_5', minUsd: 20000, maxUsd: 50000, feeKsh: 2500, label: 'USD 20,000 to 49,999: KSH 2,500' },
    { id: 'tier_6', minUsd: 50000, maxUsd: Infinity, feeKsh: 5000, label: 'USD 50,000 and above: KSH 5,000' },
  ],
};

export const SEED_UNLOCKS: ContactUnlockRecord[] = [
  {
    id: 'unl_1',
    request_id: 'req_1',
    operator_id: 'op_1',
    tier: 'USD 2,000 to 4,999: KSH 300',
    fee_ksh: 300,
    status: 'paid',
    held_until: new Date(Date.now() - 10 * 3600000).toISOString(),
    paid_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    request_title: '7-Day Maasai Mara Great Migration & Amboseli Wildlife Safari',
    request_category: 'safari',
    traveler_country: 'United Kingdom',
    traveler_contact: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@oxfordtravel.co.uk',
      phone: '+44 7700 900123',
      whatsapp: '+44 7700 900123',
      preferred_channel: 'whatsapp',
    },
    mpesa_transaction_id: 'QHK82937XJ',
  },
  // 30 unlocks on req_3 to demonstrate "Contacts full" at 30 of 30!
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `unl_req3_${i + 1}`,
    request_id: 'req_3',
    operator_id: `op_mock_${i + 1}`,
    tier: 'Under USD 2,000: KSH 120',
    fee_ksh: 120,
    status: 'paid' as const,
    held_until: new Date(Date.now() - 20 * 3600000).toISOString(),
    paid_at: new Date(Date.now() - 20 * 3600000).toISOString(),
    request_title: 'Executive Hotel Stay near Westlands Nairobi for Agri-Tech Summit',
    request_category: 'hotel' as const,
    traveler_country: 'United Kingdom',
    mpesa_transaction_id: `SEDRQ${20000 + i}`,
  })),
];

export const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_1',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    type: 'pass',
    request_id: null,
    request_title: '24-hour pass',
    amount_ksh: 850,
    amount: 850,
    currency: 'KSH',
    mpesa_transaction_id: 'QHK82937XJ',
    phone_number: '254722456789',
    status: 'completed',
    paid_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15 hours ago, so 9h left
    pass_expires_at: passExpiryOperator1,
  },
  {
    id: 'pay_unl_1',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    type: 'unlock',
    request_id: 'req_1',
    request_title: '7-Day Maasai Mara Great Migration & Amboseli Wildlife Safari',
    amount_ksh: 300,
    amount: 300,
    currency: 'KSH',
    mpesa_transaction_id: 'UKW7482910',
    phone_number: '254722456789',
    status: 'completed',
    paid_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    pass_expires_at: null,
  },
  {
    id: 'pay_fail_1',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    type: 'unlock',
    request_id: 'req_2',
    request_title: 'Private Swahili Villa with Private Chef & Pool in Diani Beach',
    amount_ksh: 300,
    amount: 300,
    currency: 'KSH',
    mpesa_transaction_id: 'FLX99201AB',
    phone_number: '254722456789',
    status: 'failed',
    failure_reason: 'User cancelled M-Pesa PIN prompt or request timed out',
    paid_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    pass_expires_at: null,
  },
  {
    id: 'pay_1_prev1',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    type: 'pass',
    request_id: null,
    request_title: '24-hour pass',
    amount_ksh: 850,
    amount: 850,
    currency: 'KSH',
    mpesa_transaction_id: 'KLT19482VB',
    phone_number: '254722456789',
    status: 'completed',
    paid_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    pass_expires_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay_1_prev2',
    operator_id: 'op_1',
    operator_business_name: 'Mara Wild Expeditions & Safaris',
    type: 'pass',
    request_id: null,
    request_title: '24-hour pass',
    amount_ksh: 850,
    amount: 850,
    currency: 'KSH',
    mpesa_transaction_id: 'MOP33819QW',
    phone_number: '254722456789',
    status: 'completed',
    paid_at: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    pass_expires_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay_2',
    operator_id: 'op_4',
    operator_business_name: 'Cheetah Trackers Kenya Ltd',
    type: 'pass',
    request_id: null,
    request_title: '24-hour pass',
    amount_ksh: 850,
    amount: 850,
    currency: 'KSH',
    mpesa_transaction_id: 'RJK49182MN',
    phone_number: '254720112233',
    status: 'completed',
    paid_at: '2026-11-09T13:08:22Z',
    pass_expires_at: passExpiryOperator4,
  },
  {
    id: 'pay_3',
    operator_id: 'op_2',
    operator_business_name: 'Swahili Coast Retreats & Diani Villas',
    type: 'pass',
    request_id: null,
    request_title: '24-hour pass',
    amount_ksh: 850,
    amount: 850,
    currency: 'KSH',
    mpesa_transaction_id: 'PMK10293YY',
    phone_number: '254733987654',
    status: 'completed',
    paid_at: '2026-11-08T04:08:22Z',
    pass_expires_at: passExpiryOperator2,
  },
];

export const SEED_BOOKMARKS: Bookmark[] = [
  {
    id: 'bmk_1',
    operator_id: 'op_1',
    request_id: 'req_1', // 7-Day Migration & Amboseli Safari
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bmk_2',
    operator_id: 'op_1',
    request_id: 'req_2', // Diani Beach Villa
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bmk_3',
    operator_id: 'op_1',
    request_id: 'req_4', // Tsavo Safari (Bids only)
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bmk_4',
    operator_id: 'op_2',
    request_id: 'req_2',
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

export const SEED_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    operator_id: 'op_1',
    traveler_id: 'user_traveler_1',
    traveler_name: 'Sarah Jenkins',
    traveler_country: 'United Kingdom',
    request_id: 'req_5',
    rating: 5,
    comment: 'Jackson and the Mara Wild team provided the most exceptional safari experience. Zero hidden fees, incredible game sightings, and seamless transfers. Having bids directly compared saved us hundreds of pounds!',
    trip_type: 'Lake Naivasha & Mara Safari',
    created_at: '2026-11-09T14:00:00Z',
  },
  {
    id: 'rev_2',
    operator_id: 'op_2',
    traveler_id: 'user_traveler_2',
    traveler_name: 'David Miller',
    traveler_country: 'United States',
    request_id: 'req_2',
    rating: 5,
    comment: 'Amina arranged our Swahili villa with remarkable attention to detail. Having the chef on site was pure luxury. Will definitely use Elephantastic Safaris for our next Kenya holiday.',
    trip_type: 'Diani Beach Villa',
    created_at: '2026-10-28T10:00:00Z',
  },
];

export const SEED_REPORTS: FlaggedReport[] = [
  {
    id: 'rep_1',
    reported_by_id: 'user_traveler_2',
    reported_by_name: 'David Miller',
    target_type: 'bid',
    target_id: 'bid_mock_suspect',
    target_title: 'Unverified operator soliciting off-platform email directly',
    reason: 'Contact Circumvention Attempt',
    details: 'Bidder attempted to encode a WhatsApp link inside the message field. Flagged automatically and by user review.',
    status: 'resolved',
    created_at: '2026-11-08T18:00:00Z',
  },
];

export interface BlogCategoryInfo {
  id: BlogCategory;
  description: string;
  ctaPrompt: string;
  ctaButtonLabel: string;
  ctaCategory: TravelCategory;
}

export const BLOG_CATEGORIES: BlogCategoryInfo[] = [
  {
    id: 'Safaris & Wildlife',
    description: 'National parks, wildlife, migrations and safari experiences.',
    ctaPrompt: 'Looking for a safari? Submit a free safari request.',
    ctaButtonLabel: 'Submit Free Safari Request',
    ctaCategory: 'safari',
  },
  {
    id: 'Beaches & Coastal Holidays',
    description: 'Beaches, islands, water sports and coastal destinations.',
    ctaPrompt: "Planning a beach holiday? Discover accommodation along Kenya's coast.",
    ctaButtonLabel: 'Request Coastal Stays',
    ctaCategory: 'bnb',
  },
  {
    id: 'Hotels & Accommodation',
    description: 'Hotels, resorts, lodges, villas and B&Bs.',
    ctaPrompt: 'Need somewhere to stay? Connect with verified Kenyan hotels and B&Bs.',
    ctaButtonLabel: 'Connect with Hotels & B&Bs',
    ctaCategory: 'hotel',
  },
  {
    id: 'Food & Culture',
    description: 'Cuisine, traditions, heritage and local experiences.',
    ctaPrompt: 'Want an authentic culinary and cultural journey? Connect with local operators.',
    ctaButtonLabel: 'Plan a Cultural Trip',
    ctaCategory: 'safari',
  },
  {
    id: 'Adventures & Experiences',
    description: 'Hiking, cycling, diving, photography and adventure travel.',
    ctaPrompt: 'Ready for an active Kenyan expedition? Submit a free adventure request.',
    ctaButtonLabel: 'Request Adventure Quotes',
    ctaCategory: 'safari',
  },
  {
    id: 'Travel Guides & Inspiration',
    description: 'Travel tips, itineraries, budgets and destination guides.',
    ctaPrompt: 'Planning a complete holiday? Send your travel requirements and connect with local operators.',
    ctaButtonLabel: 'Send Travel Requirements',
    ctaCategory: 'safari',
  },
];

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog_1',
    slug: 'kenyas-white-sand-beaches-tropical-paradise',
    title: "Kenya's White-Sand Beaches: A Tropical Paradise",
    destination: 'Diani Beach, Watamu & Lamu Island',
    category: 'Beaches & Coastal Holidays',
    image_url: IMAGES.blogDiani,
    author_name: 'Amina Swaleh',
    author_role: 'Coastal Hospitality Specialist',
    published_at: '2026-11-16T09:00:00Z',
    read_time: '4 min read',
    excerpt: "Discover the beauty of Kenya's coastline—from powder-white sands in Diani and Watamu to the peaceful island charm of Lamu.",
    content: `Discover the beauty of Kenya's coastline.

Kenya is home to some of the world's most beautiful tropical beaches, where powder-white sands meet crystal-clear turquoise waters. From the breathtaking shores of Diani and Watamu to the peaceful island charm of Lamu, Kenya offers the perfect coastal escape. Whether you enjoy swimming, snorkelling, diving, sailing, or simply relaxing by the ocean, Kenya's coastline promises an unforgettable experience.

### Iconic Coastal Escapes
- **Diani Beach:** Award-winning coral sand beaches framed by palm groves, luxury beachfront lodges like Sands at Nomad, and vibrant kitesurfing lagoons.
- **Watamu Marine Reserve:** Calm turquoise bays, vibrant coral reefs for snorkelling and diving, and family-friendly oceanfront resorts.
- **Lamu Archipelago:** Car-free historic Swahili alleys, traditional wooden dhow sunset sails, and tranquil oceanfront villas in Shela.

### Planning a beach holiday?
Discover accommodation along Kenya's coast by posting your preferred travel dates, guest count, and beach destination. Verified coastal resorts, boutique hotels, and private B&B villas will send tailored offers straight to your dashboard.`,
    best_months: 'October to March (Calm turquoise waters & sunshine)',
    estimated_budget_usd: '$160 - $650 / night (Beach Resorts & Private Villas)',
    recommended_duration: '4 to 7 days',
    highlights: [
      'Powder-white sands in Diani Beach & Galu Kinondo',
      'Coral reef snorkelling & diving in Watamu Marine Park',
      'Traditional Swahili dhow sailing on Lamu Island',
      'Direct offers from verified coastal lodges & oceanfront B&Bs',
    ],
    cta_prompt: "Planning a beach holiday? Discover accommodation along Kenya's coast.",
    cta_button_label: 'Request Coastal Stays',
    cta_category: 'bnb',
  },
  {
    id: 'blog_2',
    slug: 'kenyas-safaris-experience-wildlife-like-never-before',
    title: "Kenya's Safaris: Experience Wildlife Like Never Before",
    destination: 'Maasai Mara, Amboseli & Samburu',
    category: 'Safaris & Wildlife',
    image_url: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Untitled-2.png',
    author_name: 'Jackson Ole Kaelo',
    author_role: 'KPSGA Silver Guide & Mara Naturalist',
    published_at: '2026-11-15T08:30:00Z',
    read_time: '5 min read',
    excerpt: 'Where extraordinary wildlife encounters become lifelong memories across Maasai Mara, Amboseli, and Samburu.',
    content: `Where extraordinary wildlife encounters become lifelong memories.

Kenya is one of Africa's most iconic safari destinations. Explore the legendary Maasai Mara, witness elephants beneath Mount Kilimanjaro in Amboseli, or discover the unique wildlife of Samburu. From the Great Migration to unforgettable Big Five encounters, Kenya offers remarkable opportunities to experience wildlife in its natural habitat.

### Three Unforgettable Safari Circuits
- **Maasai Mara National Reserve & Conservancies:** World-renowned big cat sightings, expansive savannah plains, and intimate guided 4x4 game drives.
- **Amboseli National Park:** Famous for large herds of free-ranging tuskers photographed against the snow-capped backdrop of Mount Kilimanjaro.
- **Samburu National Reserve:** Home to the rare Samburu Special Five—reticulated giraffe, Grevy's zebra, Somali ostrich, gerenuk, and Beisa oryx.

### Looking for a safari?
Submit a free safari request with your preferred parks, travel window, and budget. Verified Kenyan tour operators will compete to design your custom 4x4 itinerary with 0% platform commission.`,
    best_months: 'June to October & December to March',
    estimated_budget_usd: '$380 - $950 / person / day (All-Inclusive Safari)',
    recommended_duration: '5 to 8 days',
    highlights: [
      'Big Five game drives across the legendary Maasai Mara',
      'Iconic African elephant herds beneath Mount Kilimanjaro in Amboseli',
      'Rare northern wildlife species on a Samburu Special Five safari',
      'Private 4x4 Toyota Land Cruisers led by certified Kenyan guides',
    ],
    cta_prompt: 'Looking for a safari? Submit a free safari request.',
    cta_button_label: 'Submit a Free Safari Request',
    cta_category: 'safari',
  },
  {
    id: 'blog_3',
    slug: 'kenyan-cuisine-a-taste-of-africa',
    title: 'Kenyan Cuisine: A Taste of Africa',
    destination: 'Nairobi, Mombasa & Coastal Swahili Trail',
    category: 'Food & Culture',
    image_url: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/images.jpg',
    author_name: 'Salim Bakari',
    author_role: 'Kenyan Culinary & Cultural Guide',
    published_at: '2026-11-14T11:00:00Z',
    read_time: '4 min read',
    excerpt: 'Discover the flavours, traditions, and culture of Kenya—from charcoal-grilled nyama choma to aromatic Swahili biryani and fresh seafood.',
    content: `Discover the flavours, traditions, and culture of Kenya.

Kenyan cuisine is a celebration of culture and diversity. Enjoy freshly grilled nyama choma, traditional ugali, delicious coastal Swahili dishes, aromatic biryani, and freshly caught seafood. Every region offers something unique, bringing together local ingredients, traditional recipes, and influences from across the country. In Kenya, every meal is an opportunity to discover something new.

### Dishes & Culinary Experiences Not to Miss
- **Nyama Choma & Kachumbari:** Kenya's beloved slow-roasted meat over hardwood charcoal, served with tangy tomato-onion salsa, steaming **ugali**, and sautéed **sukuma wiki**.
- **Swahili Coastal Flavours:** Spiced **pilau**, fragrant Mombasa **biryani**, freshly grilled Indian Ocean lobster, coconut fish curry, and warm cardamom-scented **mahamri**.
- **Personal Chefs & Culinary Tours:** Many coastal villas and Kenyan stays include private chefs ready to source fresh morning catch and cook regional specialties right at your table.

### Want to taste authentic Kenya?
Connect with local operators and private villa hosts who include market visits, cooking sessions, and signature Kenyan dining in your itinerary.`,
    best_months: 'Year-round',
    estimated_budget_usd: '$120 - $380 / person / day (Culinary Tours & Stays)',
    recommended_duration: '2 to 5 days',
    highlights: [
      'Freshly charcoal-grilled nyama choma, ugali & kachumbari',
      'Mombasa & Lamu Swahili biryani, pilau & coconut seafood',
      'Private villa chefs & coastal spice market tasting tours',
      'Highland Kenyan single-origin coffee & spiced chai tastings',
    ],
    cta_prompt: 'Want an authentic culinary journey? Connect with local Kenyan operators.',
    cta_button_label: 'Plan a Culinary & Cultural Trip',
    cta_category: 'safari',
  },
  {
    id: 'blog_4',
    slug: 'hotels-resorts-and-bnbs-stay-your-way-in-kenya',
    title: 'Hotels, Resorts and B&Bs: Stay Your Way in Kenya',
    destination: 'Maasai Mara, Diani Beach & Nairobi',
    category: 'Hotels & Accommodation',
    image_url: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/1920x10806.jpg.webp',
    author_name: 'Grace Wanjiku',
    author_role: 'Boutique Stays & Lodges Curator',
    published_at: '2026-11-13T10:15:00Z',
    read_time: '5 min read',
    excerpt: 'From luxury escapes to affordable stays, find your perfect home away from home across Kenya’s bush camps, resorts, hotels, and B&Bs.',
    content: `From luxury escapes to affordable stays, find your perfect home away from home.

Kenya offers accommodation for every traveller and every budget. Wake up to breathtaking wildlife views in luxury safari lodges, enjoy beachfront resorts along the Indian Ocean, or experience the comfort and hospitality of charming boutique hotels and B&Bs. Whether travelling for adventure, relaxation, business, or romance, Kenya has a place for you.

### Find Your Ideal Stay Across Kenya
- **Luxury Bush Camps & Safari Lodges:** Intimate tented suites on raised timber decks overlooking active waterholes and private wildlife conservancies.
- **Beachfront Resorts & Oceanfront Villas:** All-inclusive coastal sanctuaries and spacious private homes along Diani, Nyali, and Watamu.
- **Boutique City Hotels & Local B&Bs:** Welcoming guesthouses in Nairobi's leafy Karen and Westlands suburbs, Rift Valley lake cottages, and cozy regional B&Bs.

### Need somewhere to stay?
Connect with verified Kenyan hotels and B&Bs directly. Submit your check-in dates, room count, and budget once for free and compare personal offers without middleman markups.`,
    best_months: 'Year-round',
    estimated_budget_usd: '$90 - $900 / night depending on stay tier',
    recommended_duration: '2 to 12 nights',
    highlights: [
      'Luxury bush camps & wildlife-facing safari lodges',
      'Indian Ocean beachfront resorts & multi-bedroom villas',
      'Charming Nairobi boutique hotels & leafy Karen guesthouses',
      'Affordable regional B&Bs with direct host hospitality',
    ],
    cta_prompt: 'Need somewhere to stay? Connect with verified Kenyan hotels and B&Bs.',
    cta_button_label: 'Connect with Hotels & B&Bs',
    cta_category: 'hotel',
  },
  {
    id: 'blog_5',
    slug: 'great-wildebeest-migration-natures-greatest-spectacle',
    title: "The Great Wildebeest Migration: Nature's Greatest Spectacle",
    destination: 'Maasai Mara National Reserve',
    category: 'Safaris & Wildlife',
    image_url: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/images%20(2).jpg',
    author_name: 'Ezekiel Kiprono',
    author_role: 'Wildlife & Migration Expedition Guide',
    published_at: '2026-11-12T08:00:00Z',
    read_time: '5 min read',
    excerpt: 'Witness dramatic Mara River crossings, predators in action, and vast herds of wildebeest and zebras across the Maasai Mara plains.',
    content: `Every year, the Maasai Mara becomes the stage for one of nature's most spectacular events. Thousands of wildebeest and zebras cross the plains in search of fresh grazing, creating an extraordinary wildlife spectacle. Witness dramatic river crossings, predators in action, and the incredible beauty of Africa's wilderness.

### Planning Your Migration Timing & Positioning
- **Peak River Crossings (July to October):** Herds gather along the Mara and Talek rivers, creating unforgettable sightings as thousands plunge across the water simultaneously.
- **Predator Action & Savannah Drama:** Lions, leopards, cheetahs, and Nile crocodiles closely track the moving herds across open grasslands.
- **Strategic Camp Selection:** Staying near key crossing points or inside neighboring private conservancies gives you quiet morning access before crowds arrive.

### Looking for a migration safari?
Submit a free safari request now so verified Maasai Mara operators can recommend prime crossing-season camps and private 4x4 vehicle availability.`,
    best_months: 'Late July to mid-October (Peak Mara River crossings)',
    estimated_budget_usd: '$500 - $1,100 / person / day (Migration Season)',
    recommended_duration: '4 to 6 days',
    highlights: [
      'Dramatic Mara River wildebeest & zebra crossings',
      'High concentration of lions, cheetahs & leopards',
      'Sunrise hot-air balloon flights over migrating herds',
      'Expert local tracking near prime river crossing corridors',
    ],
    cta_prompt: 'Looking for a safari? Submit a free migration safari request.',
    cta_button_label: 'Request Migration Quotes',
    cta_category: 'safari',
  },
  {
    id: 'blog_6',
    slug: 'kenyas-hidden-gems-destinations-beyond-the-ordinary',
    title: "Kenya's Hidden Gems: Destinations Beyond the Ordinary",
    destination: "Lake Turkana, Hell's Gate & Lamu Old Town",
    category: 'Travel Guides & Inspiration',
    image_url: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/images%20(3).jpg',
    author_name: 'Njeri Njuguna',
    author_role: 'Kenya Route & Hidden Gems Editor',
    published_at: '2026-11-11T09:45:00Z',
    read_time: '5 min read',
    excerpt: "Discover the dramatic landscapes of Lake Turkana, the spectacular volcanic scenery of Hell's Gate, and the historic streets of Lamu Old Town.",
    content: `Beyond the famous safari parks and beaches lies another side of Kenya waiting to be explored. Discover the dramatic landscapes of Lake Turkana, the spectacular scenery of Hell's Gate, and the historic streets of Lamu. These lesser-known destinations offer unique adventures, rich cultures, and unforgettable experiences.

### Off-the-Beaten-Path Wonders
- **Lake Turkana (The Jade Sea):** The world's largest permanent desert lake, framed by volcanic islands, ancient fossil sites, and vibrant northern communities.
- **Hell's Gate National Park:** Towering red cliffs, geothermal steam geysers, and deep walking canyons just two hours northwest of Nairobi.
- **Lamu Old Town (UNESCO World Heritage Site):** Centuries-old coral-stone architecture, carved wooden doors, and unhurried Swahili island life.

### Curious about Kenya's hidden corners?
Send your travel requirements on Elephantastic Safaris to connect with specialist local operators who arrange fly-in northern expeditions and bespoke multi-region routes.`,
    best_months: 'June to October & December to March',
    estimated_budget_usd: '$280 - $680 / person / day (Specialist & Fly-In Routes)',
    recommended_duration: '5 to 9 days',
    highlights: [
      'Volcanic landscapes & desert shores at Lake Turkana',
      "Red-ochre gorges & geothermal hot springs at Hell's Gate",
      'Guided heritage walking tours through Lamu Old Town',
      'Tailored off-the-beaten-path itineraries by Kenyan specialists',
    ],
    cta_prompt: 'Planning a unique Kenya route? Send your travel requirements to local operators.',
    cta_button_label: 'Explore Custom Routes',
    cta_category: 'safari',
  },
  {
    id: 'blog_7',
    slug: 'experience-authentic-kenyan-culture-and-traditions',
    title: 'Experience Authentic Kenyan Culture and Traditions',
    destination: 'Maasai Villages, Samburu & Lamu Island',
    category: 'Food & Culture',
    image_url: IMAGES.blogKenyanCulture,
    author_name: 'Salim Bakari',
    author_role: 'Kenyan Heritage & Cultural Guide',
    published_at: '2026-11-10T12:15:00Z',
    read_time: '4 min read',
    excerpt: 'With diverse communities, colourful traditions, music, dance, art, and heritage, discover the stories that make Kenya special.',
    content: `Kenya's greatest treasures extend beyond its landscapes and wildlife. With diverse communities, colourful traditions, music, dance, art, and heritage, the country offers visitors an opportunity to experience authentic African culture. Meet local communities, explore traditional villages, and discover the stories that make Kenya special.

### Meaningful Cultural Encounters
- **Maasai & Samburu Community Visits:** Learn traditional livestock stewardship, intricate colourful beadwork symbolism, warrior jumping dances, and medicinal bush lore directly from community elders.
- **Coastal Swahili Craftsmanship:** Visit Lamu and Mombasa workshops preserving wooden dhow boatbuilding, intricate plaster carvings, and handwoven textiles.
- **Nairobi Arts & Heritage:** Explore contemporary Kenyan galleries, live acoustic music venues, and artisan craft cooperatives.

### Want to experience Kenya's living heritage?
Submit a free trip request noting your interest in community-led cultural tours and respectful heritage experiences across Kenya.`,
    best_months: 'Year-round (Cultural celebrations peak August to December)',
    estimated_budget_usd: '$180 - $450 / person / day',
    recommended_duration: '3 to 6 days',
    highlights: [
      'Respectful Maasai & Samburu village cultural visits',
      'Traditional beadwork, music, dance & oral storytelling',
      'Swahili coastal heritage & artisan craft workshops',
      'Direct community partnerships arranged by verified operators',
    ],
    cta_prompt: 'Want an authentic cultural journey? Connect with local operators.',
    cta_button_label: 'Connect with Cultural Guides',
    cta_category: 'safari',
  },
  {
    id: 'blog_8',
    slug: 'adventure-tourism-in-kenya-for-the-thrill-seekers',
    title: 'Adventure Tourism in Kenya: For the Thrill Seekers',
    destination: "Mount Kenya, Hell's Gate & Indian Ocean Coast",
    category: 'Adventures & Experiences',
    image_url: IMAGES.blogMountKenya,
    author_name: 'Brian Mwangi',
    author_role: 'High-Altitude & Adventure Expedition Lead',
    published_at: '2026-11-08T14:00:00Z',
    read_time: '5 min read',
    excerpt: "Climb Mount Kenya, cycle through Hell's Gate National Park, kite surf along the coast, and explore breathtaking wilderness on foot.",
    content: `For travellers seeking excitement, Kenya offers adventures at every turn. Climb Mount Kenya, cycle through Hell's Gate National Park, enjoy kite surfing along the coast, or explore breathtaking landscapes on foot. Whether you prefer mountains, oceans, or wilderness, Kenya is an adventure waiting to happen.

### Top Adrenaline & Outdoor Adventures
- **Mount Kenya Alpine Expeditions:** Trek through bamboo forests, alpine lakes, and giant lobelia valleys to reach sunrise atop Point Lenana (4,985m).
- **Cycling Beside Wildlife in Hell's Gate:** Ride mountain bikes along red-cliff canyon trails surrounded by plains zebras, giraffes, and warthogs.
- **Coastal Kitesurfing & Reef Diving:** Catch steady coastal trade winds off Diani and Watamu, or dive pristine coral drop-offs teeming with marine life.
- **Guided Walking Safaris:** Track wildlife on foot alongside certified ranger guides across Laikipia and Tsavo.

### Ready for an active Kenyan expedition?
Submit a free adventure request specifying your preferred activities and fitness pace to receive direct quotes from specialist guides.`,
    best_months: 'January to March & June to October (Optimal trekking & wind conditions)',
    estimated_budget_usd: '$320 - $1,500 / trip (Guided Expeditions & Gear)',
    recommended_duration: '3 to 7 days',
    highlights: [
      'Guided Mount Kenya Point Lenana sunrise climbs',
      "Mountain biking & rock climbing in Hell's Gate National Park",
      'Kitesurfing, paddleboarding & scuba diving along the coast',
      'Walking safaris & multi-day wilderness photography treks',
    ],
    cta_prompt: 'Ready for an active Kenyan expedition? Submit a free adventure request.',
    cta_button_label: 'Submit an Adventure Request',
    cta_category: 'safari',
  },
  {
    id: 'blog_9',
    slug: 'romantic-kenya-the-perfect-honeymoon-destination',
    title: 'Romantic Kenya: The Perfect Honeymoon Destination',
    destination: 'Maasai Mara Conservancies & Diani Beach',
    category: 'Hotels & Accommodation',
    image_url: IMAGES.blogRomanticKenya,
    author_name: 'Amina Swaleh',
    author_role: 'Honeymoon & Luxury Stays Specialist',
    published_at: '2026-11-06T16:30:00Z',
    read_time: '4 min read',
    excerpt: 'Private safari lodges overlooking the African wilderness, candlelit sunset dinners, and romantic Indian Ocean beachfront retreats for couples.',
    content: `From private safari lodges overlooking the African wilderness to romantic beachfront escapes along the Indian Ocean, Kenya offers unforgettable experiences for couples. Enjoy sunset dinners, intimate nature experiences, luxury accommodation, and beautiful coastal retreats. Kenya is the perfect setting for honeymoons, anniversaries, and romantic getaways.

### Crafting the Ultimate "Bush & Beach" Romance
- **Intimate Safari Suites:** Stay in secluded luxury tented camps in private conservancies with private plunge pools, outdoor star-beds, and candlelit bush dinners under acacia trees.
- **Champagne Sundowners & Balloon Flights:** Drift quietly above the savannah at dawn before enjoying a private champagne breakfast in the wild.
- **Barefoot Coastal Retreats:** Unwind together in quiet Diani beachfront villas or private Lamu sanctuaries with sunset dhow cruises and oceanfront dining.

### Planning a honeymoon or anniversary trip?
Tell our verified Kenyan lodges and boutique villa hosts your celebration dates and receive personalized romantic packages directly.`,
    best_months: 'June to October & December to March',
    estimated_budget_usd: '$450 - $1,400 / couple / night (Luxury Lodges & Coastal Villas)',
    recommended_duration: '7 to 12 days',
    highlights: [
      'Private plunge-pool safari suites in quiet conservancies',
      'Candlelit savannah sunset dinners & champagne sundowners',
      'Secluded Indian Ocean honeymoon villas & dhow sunset sails',
      'Bespoke couples itineraries combining safari & beach relaxation',
    ],
    cta_prompt: 'Planning a romantic getaway or honeymoon? Connect with Kenyan lodges and villas.',
    cta_button_label: 'Request Honeymoon Stays',
    cta_category: 'hotel',
  },
  {
    id: 'blog_10',
    slug: 'mount-kenya-and-kenyas-breathtaking-landscapes',
    title: "Mount Kenya and Kenya's Breathtaking Landscapes",
    destination: 'Mount Kenya, Great Rift Valley & Lake Nakuru',
    category: 'Adventures & Experiences',
    image_url: IMAGES.blogRiftValley,
    author_name: 'Brian Mwangi',
    author_role: 'Highland & Rift Valley Expedition Lead',
    published_at: '2026-11-04T08:15:00Z',
    read_time: '4 min read',
    excerpt: "From the snow-capped peaks of Mount Kenya to the dramatic Great Rift Valley, flamingo lakes, rolling hills, and endless savannahs.",
    content: `Kenya is a country of extraordinary natural contrasts. From the snow-capped peaks of Mount Kenya to the dramatic Great Rift Valley, freshwater lakes, rolling hills, and endless savannahs, the country's landscapes are as diverse as they are beautiful. Every journey offers a new perspective and another reason to explore.

### Landscapes of Dramatic Contrast
- **Mount Kenya's Peaks (Batian, Nelion & Lenana):** Equatorial glaciers, dramatic valleys, and emerald high-altitude tarns rising above central Kenya's lush tea highlands.
- **The Great Rift Valley Escarpment:** Sweeping geological ridges dropping dramatically into volcanic craters and shimmering Rift Valley lakes.
- **Lake Nakuru & Lake Naivasha:** Soda lakes painted pink by lesser and greater flamingos, bordered by yellow-barked fever tree forests and rhino sanctuaries.

### Want a scenic highland & Rift Valley tour?
Post your preferred sightseeing pace and photography interests for free to get custom itineraries from verified local operators.`,
    best_months: 'January to March & June to October (Clear highland views)',
    estimated_budget_usd: '$240 - $620 / person / day',
    recommended_duration: '4 to 7 days',
    highlights: [
      'Snow-capped Mount Kenya peaks & scenic highland viewpoints',
      'Panoramic Great Rift Valley escarpment drives',
      'Flamingo-lined shores & rhino sanctuaries in Lake Nakuru',
      'Boat safaris & crater rim walks around Lake Naivasha',
    ],
    cta_prompt: 'Want to explore Kenya’s dramatic landscapes? Submit a free trip request.',
    cta_button_label: 'Plan a Scenic Kenya Tour',
    cta_category: 'safari',
  },
  {
    id: 'blog_11',
    slug: 'why-kenya-should-be-on-your-travel-bucket-list',
    title: 'Why Kenya Should Be on Your Travel Bucket List',
    destination: 'Nairobi, Wildlife Parks & Indian Ocean Coast',
    category: 'Travel Guides & Inspiration',
    image_url: IMAGES.blogKenyaGuides,
    author_name: 'Njeri Njuguna',
    author_role: 'Kenya Route & Budget Strategist',
    published_at: '2026-11-01T07:45:00Z',
    read_time: '5 min read',
    excerpt: 'World-class wildlife, tropical beaches, rich cultural heritage, adventure, and exceptional hospitality—your next unforgettable journey starts here.',
    content: `Few destinations combine world-class wildlife, tropical beaches, rich cultural heritage, adventure, and exceptional hospitality quite like Kenya. Whether you dream of witnessing the Great Migration, relaxing beside the Indian Ocean, exploring vibrant cities, or discovering authentic African cuisine, Kenya offers something for every traveller. Your next unforgettable journey starts here.

### Five Reasons Travelers Fall in Love with Kenya
1. **Unmatched Wildlife & Conservancies:** Easy domestic bush flights link Nairobi straight to the Maasai Mara, Amboseli, Laikipia, and Samburu.
2. **Seamless "Bush & Beach" Holidays:** Pair morning Big Five game drives with afternoon swims along white-sand Indian Ocean shores in a single effortless itinerary.
3. **Stay Your Way for Any Budget:** Choose from family-friendly safari lodges, boutique city hotels, private coastal villas, or cozy B&Bs.
4. **Warm Kenyan Hospitality:** Known worldwide for genuine warmth, certified local guiding, and rich cultural diversity.
5. **Direct Booking Freedom:** Compare competitive custom quotes from verified Kenyan operators with zero intermediary markups.

### Planning a complete holiday?
Send your travel requirements and connect with local operators today. Post your trip dates, group size, and budget once for free and let verified Kenyan specialists bring your bucket-list journey to life.`,
    best_months: 'June to October & December to March (All-region dry seasons)',
    estimated_budget_usd: '$2,200 - $8,500 / person (Complete Bush & Beach Holiday)',
    recommended_duration: '7 to 14 days',
    highlights: [
      'Seamless combination of Big Five safaris & tropical beaches',
      'Accessible itineraries for solo travelers, couples & families',
      'Direct connections with verified Kenyan tour, hotel & B&B operators',
      '100% free request posting with transparent, commission-free quotes',
    ],
    cta_prompt: 'Planning a complete holiday? Send your travel requirements and connect with local operators.',
    cta_button_label: 'Send Your Travel Requirements',
    cta_category: 'safari',
  },
];

