import { supabase } from '../supabaseClient';
import {
  User,
  Operator,
  TravelRequest,
  Bid,
  Bookmark,
  ContactUnlockRecord,
  PaymentRecord,
  TravelerContact,
  TravelCategory,
  UserRole,
  AdminMarketplaceSettings,
} from '../types';

export interface SupabaseResult<T = null> {
  data: T | null;
  error: string | null;
}

export interface OperatorPassRecord {
  id: string;
  operator_id: string;
  expires_at: string;
  created_at?: string;
}

export interface LoadedSupabaseState {
  profile: User | null;
  operatorProfile: Operator | null;
  operators: Operator[];
  requests: TravelRequest[];
  bids: Bid[];
  passes: OperatorPassRecord[];
  payments: PaymentRecord[];
  unlocks: ContactUnlockRecord[];
  bookmarks: Bookmark[];
  requestContactsByRequestId: Record<string, TravelerContact>;
  unlocksUsedByRequestId: Record<string, number>;
  unlockFeeKshByRequestId: Record<string, number>;
  settings: Record<string, unknown>;
  errors: string[];
}

function formatSupabaseError(context: string, error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined): string {
  if (!error) return `${context}: Unknown Supabase error`;
  const parts = [error.message || 'Unknown error'];
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(`Hint: ${error.hint}`);
  if (error.code) parts.push(`[${error.code}]`);
  return `${context}: ${parts.join(' — ')}`;
}

/**
 * Map Supabase `profiles.role` ('traveller' | 'operator' | 'admin') to UI `UserRole` ('traveler' | 'operator' | 'admin').
 */
export function mapDbRoleToUiRole(dbRole: string | null | undefined): UserRole {
  if (dbRole === 'operator') return 'operator';
  if (dbRole === 'admin') return 'admin';
  return 'traveler';
}

/**
 * Map UI `UserRole` to Supabase `profiles.role` ('traveller' | 'operator').
 * Rule 1: Never let the user pick admin during sign-up.
 */
export function mapUiRoleToSignupDbRole(uiRole: UserRole): 'traveller' | 'operator' {
  return uiRole === 'operator' ? 'operator' : 'traveller';
}

function mapProfileRow(row: any): User {
  return {
    id: row.id,
    email: row.email || '',
    role: mapDbRoleToUiRole(row.role),
    name: row.full_name || row.email?.split('@')[0] || 'User',
    country: '',
    preferred_currency: 'USD',
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapOperatorProfileRow(row: any): Operator {
  const categories = Array.isArray(row.categories)
    ? (row.categories.filter((c: string) => ['safari', 'hotel', 'bnb'].includes(c)) as TravelCategory[])
    : [];
  const regions = Array.isArray(row.regions)
    ? row.regions
    : typeof row.regions === 'string' && row.regions.trim()
      ? row.regions.split(',').map((r: string) => r.trim()).filter(Boolean)
      : [];

  return {
    id: row.user_id,
    user_id: row.user_id,
    business_name: row.business_name || '',
    contact_name: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    categories,
    regions,
    description: row.description || '',
    licence_number: row.tra_licence_number || '',
    status: row.verification_requested ? 'approved' : 'approved',
    is_profile_complete: Boolean(
      row.business_name?.trim() &&
        row.contact_person?.trim() &&
        row.phone?.trim() &&
        row.email?.trim() &&
        categories.length > 0
    ),
    access_expires_at: null,
    bidding_pass_expires_at: null,
    rating: 5.0,
    review_count: 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapRequestRow(row: any): TravelRequest {
  const budgetUsd = Number(row.budget_usd ?? 0);
  const unlockLimit = Number(row.unlock_limit ?? 30);
  const unlockingEnabled = row.unlocking_enabled !== false;
  const destination = row.destination || '';
  const description = row.description || '';
  const category = (['safari', 'hotel', 'bnb'].includes(row.category) ? row.category : 'safari') as TravelCategory;

  return {
    id: String(row.id),
    traveler_id: String(row.traveller_id || ''),
    traveler_name: 'Traveller',
    traveler_country: destination || 'Kenya',
    category,
    title: row.title || '',
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    adults: Number(row.adults ?? 1),
    children: Number(row.children ?? 0),
    budget: budgetUsd,
    budget_usd: budgetUsd,
    currency: 'USD',
    notes: description,
    safari_details:
      category === 'safari' && destination
        ? {
            days: Math.max(
              1,
              row.start_date && row.end_date
                ? Math.round(
                    (new Date(row.end_date).getTime() - new Date(row.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) || 1
                : 1
            ),
            parks: destination.split(',').map((s: string) => s.trim()).filter(Boolean),
            activities: [],
            accommodation_level: 'mid-range',
            airport_pickup: false,
            vehicle_type: 'private_4x4',
          }
        : undefined,
    hotel_details:
      category === 'hotel' && destination
        ? {
            destination,
            rooms: 1,
            room_type: 'Standard',
            star_rating: '',
            meal_plan: 'bed_and_breakfast',
            amenities: [],
          }
        : undefined,
    bnb_details:
      category === 'bnb' && destination
        ? {
            neighbourhood: destination,
            bedrooms: 1,
            place_type: 'entire_place',
            amenities: [],
            self_check_in: false,
          }
        : undefined,
    slot_limit: unlockLimit,
    unlock_limit: unlockLimit,
    unlocks_enabled: unlockingEnabled,
    bids_only: !unlockingEnabled,
    status: row.status === 'closed' ? 'closed' : 'open',
    expires_at: row.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapBidRow(row: any, operatorMap: Map<string, Operator>): Bid {
  const op = operatorMap.get(String(row.operator_id));
  const rawInclusions = row.inclusions;
  const inclusions: string[] = Array.isArray(rawInclusions)
    ? rawInclusions.map(String)
    : typeof rawInclusions === 'string' && rawInclusions.trim()
      ? rawInclusions
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const amountUsd = Number(row.amount_usd ?? 0);

  return {
    id: String(row.id),
    request_id: String(row.request_id),
    operator_id: String(row.operator_id),
    operator_business_name: op?.business_name || row.operator_profiles?.business_name || 'Verified Operator',
    operator_rating: op?.rating ?? 5.0,
    operator_review_count: op?.review_count ?? 0,
    operator_verified: true,
    price: amountUsd,
    amount: amountUsd,
    currency: 'USD',
    inclusions,
    message: row.message || '',
    valid_until: row.valid_until || '',
    status: 'sent',
    created_at: row.created_at || new Date().toISOString(),
    operator_email: op?.email || row.operator_profiles?.email || undefined,
    operator_phone: op?.phone || row.operator_profiles?.phone || undefined,
    operator_whatsapp: op?.phone || row.operator_profiles?.phone || undefined,
  };
}

function mapPaymentRow(row: any): PaymentRecord {
  const amount = Number(row.amount_ksh ?? row.amount ?? 0);
  return {
    id: String(row.id),
    operator_id: String(row.operator_id ?? row.user_id ?? ''),
    operator_business_name: row.operator_business_name || undefined,
    type: row.type === 'unlock' ? 'unlock' : 'pass',
    pass_type: row.type === 'unlock' ? undefined : 'bidding',
    request_id: row.request_id ? String(row.request_id) : undefined,
    amount,
    amount_ksh: amount,
    currency: row.currency || 'KSH',
    mpesa_transaction_id: row.mpesa_receipt || row.mpesa_transaction_id || row.reference || String(row.id),
    phone_number: row.phone || row.phone_number || undefined,
    status: row.status === 'failed' ? 'failed' : 'completed',
    paid_at: row.paid_at || row.created_at || new Date().toISOString(),
    pass_expires_at: row.pass_expires_at || '',
  };
}

function mapUnlockRow(row: any): ContactUnlockRecord {
  return {
    id: String(row.id ?? `${row.operator_id}_${row.request_id}`),
    request_id: String(row.request_id),
    operator_id: String(row.operator_id),
    tier: row.tier || 'Tier',
    fee_ksh: Number(row.fee_ksh ?? row.amount_ksh ?? 0),
    status: row.status === 'failed' ? 'failed' : row.status === 'refunded' ? 'refunded' : 'paid',
    held_until: row.held_until || row.created_at || new Date().toISOString(),
    paid_at: row.paid_at || row.created_at || new Date().toISOString(),
    request_title: row.request_title || '',
    request_category: (row.request_category || 'safari') as TravelCategory,
    mpesa_transaction_id: row.mpesa_receipt || row.mpesa_transaction_id || undefined,
  };
}

/**
 * RPC: Unlock fee in KSH for a given budget_usd.
 * Rule 6: supabase.rpc('unlock_fee_ksh', { p_budget_usd })
 */
export async function rpcUnlockFeeKsh(budgetUsd: number): Promise<SupabaseResult<number>> {
  const { data, error } = await supabase.rpc('unlock_fee_ksh', {
    p_budget_usd: budgetUsd,
  });
  if (error) {
    return { data: null, error: formatSupabaseError('rpc unlock_fee_ksh', error) };
  }
  return { data: Number(data ?? 0), error: null };
}

/**
 * RPC: Unlocks used for a given request id.
 * Rule 6: supabase.rpc('unlocks_used', { p_request })
 */
export async function rpcUnlocksUsed(requestId: string): Promise<SupabaseResult<number>> {
  const { data, error } = await supabase.rpc('unlocks_used', {
    p_request: requestId,
  });
  if (error) {
    return { data: null, error: formatSupabaseError('rpc unlocks_used', error) };
  }
  return { data: Number(data ?? 0), error: null };
}

/**
 * Fetch contact details for a request from `request_contacts`.
 * Rule 6: Contact details show ONLY if `request_contacts` returns a row (RLS allows only after paid unlock or for owner).
 */
export async function fetchRequestContactFromDb(
  requestId: string
): Promise<SupabaseResult<TravelerContact | null>> {
  const { data, error } = await supabase
    .from('request_contacts')
    .select('request_id, email, whatsapp, phone')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) {
    return { data: null, error: formatSupabaseError('select request_contacts', error) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: {
      name: '',
      email: data.email || '',
      whatsapp: data.whatsapp || '',
      phone: data.phone || '',
      preferred_channel: data.whatsapp ? 'whatsapp' : data.phone ? 'phone' : 'email',
    },
    error: null,
  };
}

/**
 * Load public/open requests and settings when logged out (if RLS allows).
 */
export async function loadPublicSupabaseData(): Promise<{
  requests: TravelRequest[];
  settings: Record<string, unknown>;
  unlocksUsedByRequestId: Record<string, number>;
  unlockFeeKshByRequestId: Record<string, number>;
  errors: string[];
}> {
  const errors: string[] = [];

  const [requestsRes, settingsRes] = await Promise.all([
    supabase
      .from('requests')
      .select(
        'id, traveller_id, category, title, description, destination, start_date, end_date, adults, children, budget_usd, status, unlocking_enabled, unlock_limit, expires_at'
      )
      .order('start_date', { ascending: false }),
    supabase.from('settings').select('key, value'),
  ]);

  if (requestsRes.error) {
    // Public/anon access might be restricted by RLS; only record if unexpected
    console.warn('[Supabase] Public requests query:', requestsRes.error.message);
  }
  if (settingsRes.error) {
    console.warn('[Supabase] Settings query:', settingsRes.error.message);
  }

  const requests = (requestsRes.data || []).map(mapRequestRow);
  const settings: Record<string, unknown> = {};
  for (const row of settingsRes.data || []) {
    if (row?.key) settings[row.key] = row.value;
  }

  const unlocksUsedByRequestId: Record<string, number> = {};
  const unlockFeeKshByRequestId: Record<string, number> = {};

  await Promise.all(
    requests.map(async (req) => {
      const [usedRes, feeRes] = await Promise.all([
        rpcUnlocksUsed(req.id),
        rpcUnlockFeeKsh(req.budget_usd ?? req.budget),
      ]);
      if (usedRes.data !== null) unlocksUsedByRequestId[req.id] = usedRes.data;
      if (feeRes.data !== null) unlockFeeKshByRequestId[req.id] = feeRes.data;
    })
  );

  return {
    requests,
    settings,
    unlocksUsedByRequestId,
    unlockFeeKshByRequestId,
    errors,
  };
}

/**
 * Load all authenticated user data directly from Supabase using the logged-in user's session.
 * Never uses localStorage, sessionStorage, or hardcoded seed rows.
 */
export async function loadAuthenticatedSupabaseState(
  authUserId: string
): Promise<LoadedSupabaseState> {
  const errors: string[] = [];

  // 1. Load profile from `profiles`
  const profileRes = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileRes.error) {
    errors.push(formatSupabaseError('select profiles', profileRes.error));
  }

  const profile = profileRes.data ? mapProfileRow(profileRes.data) : null;
  const role = profile?.role || 'traveler';

  // 2. Load role-appropriate data + shared read-only tables in parallel
  const requestsQuery =
    role === 'traveler'
      ? supabase
          .from('requests')
          .select(
            'id, traveller_id, category, title, description, destination, start_date, end_date, adults, children, budget_usd, status, unlocking_enabled, unlock_limit, expires_at'
          )
          .eq('traveller_id', authUserId)
      : supabase
          .from('requests')
          .select(
            'id, traveller_id, category, title, description, destination, start_date, end_date, adults, children, budget_usd, status, unlocking_enabled, unlock_limit, expires_at'
          );

  const [
    requestsRes,
    operatorProfilesRes,
    bidsRes,
    passesRes,
    paymentsRes,
    unlocksRes,
    bookmarksRes,
    settingsRes,
  ] = await Promise.all([
    requestsQuery,
    supabase
      .from('operator_profiles')
      .select(
        'user_id, business_name, contact_person, email, phone, categories, regions, description, tra_licence_number, verification_requested'
      ),
    supabase
      .from('bids')
      .select('id, request_id, operator_id, amount_usd, message, inclusions, valid_until'),
    supabase.from('passes').select('*'),
    supabase.from('payments').select('*'),
    supabase.from('unlocks').select('*'),
    supabase.from('bookmarks').select('operator_id, request_id'),
    supabase.from('settings').select('key, value'),
  ]);

  if (requestsRes.error) errors.push(formatSupabaseError('select requests', requestsRes.error));
  if (operatorProfilesRes.error) {
    errors.push(formatSupabaseError('select operator_profiles', operatorProfilesRes.error));
  }
  if (bidsRes.error) errors.push(formatSupabaseError('select bids', bidsRes.error));
  if (passesRes.error) errors.push(formatSupabaseError('select passes', passesRes.error));
  if (paymentsRes.error) errors.push(formatSupabaseError('select payments', paymentsRes.error));
  if (unlocksRes.error) errors.push(formatSupabaseError('select unlocks', unlocksRes.error));
  if (bookmarksRes.error) errors.push(formatSupabaseError('select bookmarks', bookmarksRes.error));
  if (settingsRes.error) errors.push(formatSupabaseError('select settings', settingsRes.error));

  const requests = (requestsRes.data || []).map(mapRequestRow);

  const passes: OperatorPassRecord[] = (passesRes.data || []).map((row: any) => ({
    id: String(row.id ?? `${row.operator_id}_${row.expires_at}`),
    operator_id: String(row.operator_id ?? row.user_id ?? authUserId),
    expires_at: row.expires_at,
    created_at: row.created_at,
  }));

  // Compute latest active pass per operator from `passes` table (Rule 5)
  const nowMs = Date.now();
  const activePassExpiryByOperator = new Map<string, string>();
  for (const p of passes) {
    const expMs = new Date(p.expires_at).getTime();
    if (!Number.isNaN(expMs) && expMs > nowMs) {
      const prev = activePassExpiryByOperator.get(p.operator_id);
      if (!prev || expMs > new Date(prev).getTime()) {
        activePassExpiryByOperator.set(p.operator_id, p.expires_at);
      }
    }
  }

  const operators = (operatorProfilesRes.data || []).map((row: any) => {
    const op = mapOperatorProfileRow(row);
    const activeExp = activePassExpiryByOperator.get(op.user_id) || null;
    return {
      ...op,
      access_expires_at: activeExp,
      bidding_pass_expires_at: activeExp,
    };
  });

  const operatorMap = new Map<string, Operator>();
  for (const op of operators) {
    operatorMap.set(op.user_id, op);
  }

  const operatorProfile = operatorMap.get(authUserId) || null;

  const bids = (bidsRes.data || []).map((row: any) => mapBidRow(row, operatorMap));
  const payments = (paymentsRes.data || []).map(mapPaymentRow);
  const unlocks = (unlocksRes.data || []).map(mapUnlockRow);
  const bookmarks: Bookmark[] = (bookmarksRes.data || []).map((row: any) => ({
    id: `${row.operator_id}_${row.request_id}`,
    operator_id: String(row.operator_id),
    request_id: String(row.request_id),
    created_at: row.created_at || new Date().toISOString(),
  }));

  const settings: Record<string, unknown> = {};
  for (const row of settingsRes.data || []) {
    if (row?.key) settings[row.key] = row.value;
  }

  // 3. Fetch request_contacts (RLS returns rows ONLY for unlocked requests or owner) + RPCs (unlocks_used & unlock_fee_ksh)
  const requestContactsByRequestId: Record<string, TravelerContact> = {};
  const unlocksUsedByRequestId: Record<string, number> = {};
  const unlockFeeKshByRequestId: Record<string, number> = {};

  // Bulk select visible request_contacts in one query (RLS ensures only permitted rows return)
  if (requests.length > 0) {
    const contactsRes = await supabase
      .from('request_contacts')
      .select('request_id, email, whatsapp, phone')
      .in(
        'request_id',
        requests.map((r) => r.id)
      );

    if (contactsRes.error) {
      errors.push(formatSupabaseError('select request_contacts', contactsRes.error));
    } else {
      for (const row of contactsRes.data || []) {
        requestContactsByRequestId[String(row.request_id)] = {
          name: '',
          email: row.email || '',
          whatsapp: row.whatsapp || '',
          phone: row.phone || '',
          preferred_channel: row.whatsapp ? 'whatsapp' : row.phone ? 'phone' : 'email',
        };
      }
    }

    await Promise.all(
      requests.map(async (req) => {
        const [usedRes, feeRes] = await Promise.all([
          rpcUnlocksUsed(req.id),
          rpcUnlockFeeKsh(req.budget_usd ?? req.budget),
        ]);
        if (usedRes.error) errors.push(usedRes.error);
        if (usedRes.data !== null) unlocksUsedByRequestId[req.id] = usedRes.data;

        if (feeRes.error) errors.push(feeRes.error);
        if (feeRes.data !== null) unlockFeeKshByRequestId[req.id] = feeRes.data;
      })
    );
  }

  return {
    profile,
    operatorProfile,
    operators,
    requests,
    bids,
    passes,
    payments,
    unlocks,
    bookmarks,
    requestContactsByRequestId,
    unlocksUsedByRequestId,
    unlockFeeKshByRequestId,
    settings,
    errors,
  };
}

/**
 * Rule 2: Traveller posts a request:
 * 1) Insert into `requests` (DO NOT send `traveller_id`, database fills it; NEVER put contact details in `requests`).
 * 2) Insert contact details into `request_contacts` with the new request id.
 */
export async function createRequestWithContactsInDb(params: {
  category: TravelCategory;
  title: string;
  description: string;
  destination: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget_usd: number;
  email: string;
  whatsapp: string;
  phone: string;
}): Promise<SupabaseResult<TravelRequest>> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: insertedRequest, error: requestError } = await supabase
    .from('requests')
    .insert({
      category: params.category,
      title: params.title,
      description: params.description,
      destination: params.destination,
      start_date: params.start_date,
      end_date: params.end_date,
      adults: params.adults,
      children: params.children,
      budget_usd: params.budget_usd,
      status: 'open',
      unlocking_enabled: true,
      unlock_limit: 30,
      expires_at: expiresAt,
    })
    .select(
      'id, traveller_id, category, title, description, destination, start_date, end_date, adults, children, budget_usd, status, unlocking_enabled, unlock_limit, expires_at'
    )
    .single();

  if (requestError || !insertedRequest) {
    return {
      data: null,
      error: formatSupabaseError('insert requests', requestError),
    };
  }

  const { error: contactError } = await supabase.from('request_contacts').insert({
    request_id: insertedRequest.id,
    email: params.email,
    whatsapp: params.whatsapp,
    phone: params.phone,
  });

  if (contactError) {
    return {
      data: mapRequestRow(insertedRequest),
      error: formatSupabaseError('insert request_contacts', contactError),
    };
  }

  return {
    data: mapRequestRow(insertedRequest),
    error: null,
  };
}

/**
 * Rule 3: Traveller updates their request (`status`, `unlocking_enabled`, `unlock_limit`, etc.).
 */
export async function updateRequestInDb(
  requestId: string,
  updates: Partial<{
    title: string;
    description: string;
    destination: string;
    start_date: string;
    end_date: string;
    adults: number;
    children: number;
    budget_usd: number;
    status: 'open' | 'closed';
    unlocking_enabled: boolean;
    unlock_limit: number;
    expires_at: string;
  }>
): Promise<SupabaseResult<TravelRequest>> {
  const { data, error } = await supabase
    .from('requests')
    .update(updates)
    .eq('id', requestId)
    .select(
      'id, traveller_id, category, title, description, destination, start_date, end_date, adults, children, budget_usd, status, unlocking_enabled, unlock_limit, expires_at'
    )
    .single();

  if (error || !data) {
    return { data: null, error: formatSupabaseError('update requests', error) };
  }

  return { data: mapRequestRow(data), error: null };
}

/**
 * Rule 4: Operator inserts into `bids` ONLY.
 * If the insert fails because there is no active pass, returns "Pay KSH 850 to bid" + real Supabase error.
 */
export async function insertBidInDb(params: {
  request_id: string;
  operator_id: string;
  amount_usd: number;
  message: string;
  inclusions: string[];
  valid_until: string;
}): Promise<SupabaseResult<any>> {
  const { data, error } = await supabase
    .from('bids')
    .insert({
      request_id: params.request_id,
      operator_id: params.operator_id,
      amount_usd: params.amount_usd,
      message: params.message,
      inclusions: params.inclusions.join('\n'),
      valid_until: params.valid_until,
    })
    .select('id, request_id, operator_id, amount_usd, message, inclusions, valid_until')
    .single();

  if (error) {
    const rawMsg = error.message || '';
    const isPassOrRlsError =
      error.code === '42501' ||
      /pass|row-level security|policy|permission|denied/i.test(rawMsg);

    const formatted = formatSupabaseError('insert bids', error);
    return {
      data: null,
      error: isPassOrRlsError ? `Pay KSH 850 to bid (${formatted})` : formatted,
    };
  }

  return { data, error: null };
}

/**
 * Operator profile upsert into `operator_profiles`.
 */
export async function upsertOperatorProfileInDb(params: {
  user_id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  categories: TravelCategory[];
  regions: string[];
  description?: string;
  tra_licence_number?: string;
  verification_requested?: boolean;
}): Promise<SupabaseResult<Operator>> {
  const { data, error } = await supabase
    .from('operator_profiles')
    .upsert(
      {
        user_id: params.user_id,
        business_name: params.business_name,
        contact_person: params.contact_person,
        email: params.email,
        phone: params.phone,
        categories: params.categories,
        regions: params.regions.join(', '),
        description: params.description || '',
        tra_licence_number: params.tra_licence_number || null,
        verification_requested: Boolean(params.verification_requested),
      },
      { onConflict: 'user_id' }
    )
    .select(
      'user_id, business_name, contact_person, email, phone, categories, regions, description, tra_licence_number, verification_requested'
    )
    .single();

  if (error || !data) {
    return { data: null, error: formatSupabaseError('upsert operator_profiles', error) };
  }

  return { data: mapOperatorProfileRow(data), error: null };
}

/**
 * Update authenticated user's `profiles` row (`full_name` only; role is managed by DB).
 */
export async function updateProfileInDb(
  userId: string,
  fullName: string
): Promise<SupabaseResult<User>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
    .select('id, email, full_name, role')
    .single();

  if (error || !data) {
    return { data: null, error: formatSupabaseError('update profiles', error) };
  }

  return { data: mapProfileRow(data), error: null };
}

/**
 * Bookmarks: Insert or delete in `bookmarks(operator_id, request_id)`.
 */
export async function addBookmarkInDb(
  operatorId: string,
  requestId: string
): Promise<SupabaseResult<null>> {
  const { error } = await supabase.from('bookmarks').insert({
    operator_id: operatorId,
    request_id: requestId,
  });
  if (error) {
    return { data: null, error: formatSupabaseError('insert bookmarks', error) };
  }
  return { data: null, error: null };
}

export async function removeBookmarkInDb(
  operatorId: string,
  requestId: string
): Promise<SupabaseResult<null>> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('operator_id', operatorId)
    .eq('request_id', requestId);
  if (error) {
    return { data: null, error: formatSupabaseError('delete bookmarks', error) };
  }
  return { data: null, error: null };
}

/**
 * Rule 9: Upload licence documents to the private storage bucket "verification-docs"
 * under the path <user_id>/<filename>.
 */
export async function uploadVerificationDocToStorage(
  userId: string,
  file: File
): Promise<SupabaseResult<string>> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${safeName}`;

  const { data, error } = await supabase.storage
    .from('verification-docs')
    .upload(filePath, file, { upsert: true });

  if (error) {
    return {
      data: null,
      error: formatSupabaseError('storage upload verification-docs', error),
    };
  }

  return { data: data?.path || filePath, error: null };
}

/**
 * Rule 7: Payments, passes, and unlocks are NOT created by the frontend.
 * Calls a placeholder Supabase Edge Function to initiate M-Pesa STK push and
 * returns a clear "not connected yet" message along with any Supabase error.
 */
export async function invokeMpesaPaymentEdgeFunction(params: {
  paymentType: 'bidding_pass' | 'contact_unlock';
  phoneNumber: string;
  requestId?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        payment_type: params.paymentType,
        phone_number: params.phoneNumber,
        request_id: params.requestId,
      },
    });

    if (error) {
      return {
        success: false,
        message: `M-Pesa payment Edge Function is not connected yet. (${error.message})`,
      };
    }

    if (data && data.success) {
      return {
        success: true,
        message: data.message || 'M-Pesa STK push sent to your phone.',
      };
    }

    return {
      success: false,
      message:
        data?.message ||
        'M-Pesa payment Edge Function is not connected yet. Payments, passes, and unlocks must be processed server-side.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `M-Pesa payment Edge Function is not connected yet. (${msg})`,
    };
  }
}

export function mapSettingsToAdminConfig(
  settings: Record<string, unknown>,
  defaults: AdminMarketplaceSettings
): AdminMarketplaceSettings {
  return {
    ...defaults,
    biddingPassFeeKsh: Number(
      settings.bidding_pass_price_ksh ??
        settings.biddingPassFeeKsh ??
        defaults.biddingPassFeeKsh
    ),
    maxUnlocksPerListing: Number(
      settings.default_unlock_limit ??
        settings.maxUnlocksPerListing ??
        defaults.maxUnlocksPerListing
    ),
  };
}
