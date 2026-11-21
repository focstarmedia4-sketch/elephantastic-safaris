import { supabase } from '../supabaseClient';
import {
  User,
  Operator,
  TravelRequest,
  Bid,
  Bookmark,
  ContactUnlockRecord,
  PaymentRecord,
  Review,
  BlogPost,
  FlaggedReport,
} from '../types';

export interface LoadedSupabaseData {
  profile: User | null;
  operators: Operator[];
  requests: TravelRequest[];
  bids: Bid[];
  bookmarks: Bookmark[];
  unlocks: ContactUnlockRecord[];
  payments: PaymentRecord[];
  reviews: Review[];
  blogPosts: BlogPost[];
  reports: FlaggedReport[];
}

/**
 * Helper to fetch the current authenticated Supabase user's ID.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export interface MarketplaceSupabaseData {
  operators: Operator[];
  requests: TravelRequest[];
  reviews: Review[];
  blogPosts: BlogPost[];
}

/**
 * LOAD MARKETPLACE: Fetch shared marketplace data (all posted travel requests,
 * operators, reviews, and blog posts) so operators and visitors can view every
 * traveler's posted request across accounts and devices.
 */
export async function loadMarketplaceData(): Promise<MarketplaceSupabaseData> {
  const [operatorsRes, requestsRes, reviewsRes, blogPostsRes] = await Promise.all([
    supabase
      .from('operators')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('travel_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false }),
  ]);

  const errors = [
    operatorsRes.error,
    requestsRes.error,
    reviewsRes.error,
    blogPostsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.warn('[Supabase] Marketplace load warning:', errors[0]?.message);
  }

  return {
    operators: (operatorsRes.data as Operator[] | null) ?? [],
    requests: (requestsRes.data as TravelRequest[] | null) ?? [],
    reviews: (reviewsRes.data as Review[] | null) ?? [],
    blogPosts: (blogPostsRes.data as BlogPost[] | null) ?? [],
  };
}

/**
 * LOAD: Fetch marketplace listings plus all private rows belonging to the
 * currently authenticated user. RLS enforces ownership on private tables and
 * allows travelers & operators to see shared marketplace requests and bids.
 */
export async function loadUserDatabaseData(authUserId: string): Promise<LoadedSupabaseData> {
  const [
    profileRes,
    operatorsRes,
    requestsRes,
    bidsRes,
    bookmarksRes,
    unlocksRes,
    paymentsRes,
    reviewsRes,
    blogPostsRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authUserId).maybeSingle(),
    supabase
      .from('operators')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('travel_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_unlocks')
      .select('*')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('user_id', authUserId)
      .order('paid_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false }),
    supabase
      .from('flagged_reports')
      .select('*')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false }),
  ]);

  const errors = [
    profileRes.error,
    operatorsRes.error,
    requestsRes.error,
    bidsRes.error,
    bookmarksRes.error,
    unlocksRes.error,
    paymentsRes.error,
    reviewsRes.error,
    blogPostsRes.error,
    reportsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.warn('[Supabase] Some tables could not be loaded yet:', errors[0]?.message);
  }

  return {
    profile: (profileRes.data as User | null) ?? null,
    operators: (operatorsRes.data as Operator[] | null) ?? [],
    requests: (requestsRes.data as TravelRequest[] | null) ?? [],
    bids: ((bidsRes.data as Bid[] | null) ?? []).map((b) => ({
      ...b,
      amount: b.price,
    })),
    bookmarks: (bookmarksRes.data as Bookmark[] | null) ?? [],
    unlocks: (unlocksRes.data as ContactUnlockRecord[] | null) ?? [],
    payments: ((paymentsRes.data as PaymentRecord[] | null) ?? []).map((p) => ({
      ...p,
      amount_ksh: p.amount,
    })),
    reviews: (reviewsRes.data as Review[] | null) ?? [],
    blogPosts: (blogPostsRes.data as BlogPost[] | null) ?? [],
    reports: (reportsRes.data as FlaggedReport[] | null) ?? [],
  };
}

// ============================================================================
// PROFILES (Create / Update)
// ============================================================================
export async function upsertProfileInDb(profile: User): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      country: profile.country,
      phone: profile.phone ?? null,
      preferred_currency: profile.preferred_currency ?? 'USD',
    },
    { onConflict: 'id' }
  );
  if (error) console.warn('[Supabase] upsertProfile error:', error.message);
}

// ============================================================================
// TRAVEL REQUESTS (Create / Update / Delete)
// ============================================================================
export async function createTravelRequestInDb(
  authUserId: string,
  req: TravelRequest
): Promise<void> {
  const { error } = await supabase.from('travel_requests').insert({
    id: req.id,
    user_id: authUserId,
    traveler_id: req.traveler_id,
    traveler_name: req.traveler_name,
    traveler_country: req.traveler_country,
    title: req.title,
    category: req.category,
    start_date: req.start_date,
    end_date: req.end_date,
    flexible_month: req.flexible_month ?? null,
    adults: req.adults,
    children: req.children,
    budget: req.budget,
    currency: req.currency,
    budget_usd: req.budget_usd ?? null,
    notes: req.notes,
    safari_details: req.safari_details ?? null,
    hotel_details: req.hotel_details ?? null,
    bnb_details: req.bnb_details ?? null,
    slot_limit: req.slot_limit,
    unlock_limit: req.unlock_limit,
    unlocks_enabled: req.unlocks_enabled,
    bids_only: Boolean(req.bids_only),
    status: req.status,
    expires_at: req.expires_at,
    closed_reason: req.closed_reason ?? null,
    whatsapp_number: req.whatsapp_number ?? null,
    call_number: req.call_number ?? null,
    email_address: req.email_address ?? null,
    preferred_contact_method: req.preferred_contact_method ?? null,
    preferred_contact_methods: req.preferred_contact_methods ?? null,
    is_booked: Boolean(req.is_booked),
    booked_operator_id: req.booked_operator_id ?? null,
    booked_at: req.booked_at ?? null,
    created_at: req.created_at,
  });
  if (error) console.warn('[Supabase] createTravelRequest error:', error.message);
}

export async function updateTravelRequestInDb(
  authUserId: string,
  requestId: string,
  updates: Partial<TravelRequest>
): Promise<void> {
  const { error } = await supabase
    .from('travel_requests')
    .update(updates)
    .eq('id', requestId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] updateTravelRequest error:', error.message);
}

export async function deleteTravelRequestInDb(
  authUserId: string,
  requestId: string
): Promise<void> {
  const { error } = await supabase
    .from('travel_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] deleteTravelRequest error:', error.message);
}

// ============================================================================
// OPERATORS (Create / Update)
// ============================================================================
export async function upsertOperatorInDb(
  authUserId: string,
  operator: Operator
): Promise<void> {
  const { error } = await supabase.from('operators').upsert(
    {
      id: operator.id,
      user_id: authUserId,
      business_name: operator.business_name,
      contact_name: operator.contact_name,
      phone: operator.phone,
      email: operator.email,
      categories: operator.categories,
      regions: operator.regions,
      description: operator.description ?? '',
      licence_number: operator.licence_number ?? null,
      licence_file_name: operator.licence_file_name ?? null,
      business_registration_file_name: operator.business_registration_file_name ?? null,
      status: operator.status,
      is_profile_complete: operator.is_profile_complete ?? true,
      rejection_reason: operator.rejection_reason ?? null,
      access_expires_at: operator.access_expires_at ?? null,
      bidding_pass_expires_at: operator.bidding_pass_expires_at ?? null,
      contact_unlock_expires_at: operator.contact_unlock_expires_at ?? null,
      rating: operator.rating,
      review_count: operator.review_count,
      created_at: operator.created_at,
    },
    { onConflict: 'id' }
  );
  if (error) console.warn('[Supabase] upsertOperator error:', error.message);
}

export async function updateOperatorInDb(
  authUserId: string,
  operatorId: string,
  updates: Partial<Operator>
): Promise<void> {
  const { error } = await supabase
    .from('operators')
    .update(updates)
    .eq('id', operatorId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] updateOperator error:', error.message);
}

// ============================================================================
// BIDS (Create / Update / Delete)
// ============================================================================
export async function createBidInDb(authUserId: string, bid: Bid): Promise<void> {
  const { error } = await supabase.from('bids').insert({
    id: bid.id,
    user_id: authUserId,
    request_id: bid.request_id,
    operator_id: bid.operator_id,
    operator_business_name: bid.operator_business_name,
    operator_rating: bid.operator_rating,
    operator_review_count: bid.operator_review_count,
    operator_verified: bid.operator_verified,
    price: bid.price,
    currency: bid.currency,
    inclusions: bid.inclusions,
    message: bid.message,
    follow_ups: bid.follow_ups ?? [],
    valid_until: bid.valid_until,
    status: bid.status,
    operator_email: bid.operator_email ?? null,
    operator_whatsapp: bid.operator_whatsapp ?? null,
    operator_phone: bid.operator_phone ?? null,
    created_at: bid.created_at,
  });
  if (error) console.warn('[Supabase] createBid error:', error.message);
}

export async function updateBidInDb(
  _authUserId: string,
  bidId: string,
  updates: Partial<Bid>
): Promise<void> {
  const { amount: _ignoredAmount, ...dbUpdates } = updates;
  const { error } = await supabase
    .from('bids')
    .update(dbUpdates)
    .eq('id', bidId);
  if (error) console.warn('[Supabase] updateBid error:', error.message);
}

export async function deleteBidInDb(authUserId: string, bidId: string): Promise<void> {
  const { error } = await supabase
    .from('bids')
    .delete()
    .eq('id', bidId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] deleteBid error:', error.message);
}

// ============================================================================
// BOOKMARKS (Create / Delete)
// ============================================================================
export async function createBookmarkInDb(
  authUserId: string,
  bookmark: Bookmark
): Promise<void> {
  const { error } = await supabase.from('bookmarks').insert({
    id: bookmark.id,
    user_id: authUserId,
    operator_id: bookmark.operator_id,
    request_id: bookmark.request_id,
    created_at: bookmark.created_at,
  });
  if (error) console.warn('[Supabase] createBookmark error:', error.message);
}

export async function deleteBookmarkInDb(
  authUserId: string,
  operatorId: string,
  requestId: string
): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', authUserId)
    .eq('operator_id', operatorId)
    .eq('request_id', requestId);
  if (error) console.warn('[Supabase] deleteBookmark error:', error.message);
}

// ============================================================================
// CONTACT UNLOCKS & PAYMENTS (Create)
// ============================================================================
export async function createContactUnlockInDb(
  authUserId: string,
  unlock: ContactUnlockRecord
): Promise<void> {
  const { error } = await supabase.from('contact_unlocks').insert({
    id: unlock.id,
    user_id: authUserId,
    request_id: unlock.request_id,
    operator_id: unlock.operator_id,
    tier: unlock.tier,
    fee_ksh: unlock.fee_ksh,
    status: unlock.status,
    held_until: unlock.held_until,
    paid_at: unlock.paid_at ?? null,
    request_title: unlock.request_title,
    request_category: unlock.request_category,
    traveler_country: unlock.traveler_country ?? null,
    traveler_contact: unlock.traveler_contact ?? null,
    mpesa_transaction_id: unlock.mpesa_transaction_id ?? null,
  });
  if (error) console.warn('[Supabase] createContactUnlock error:', error.message);
}

export async function createPaymentInDb(
  authUserId: string,
  payment: PaymentRecord
): Promise<void> {
  const { error } = await supabase.from('payments').insert({
    id: payment.id,
    user_id: authUserId,
    operator_id: payment.operator_id,
    operator_business_name: payment.operator_business_name ?? null,
    type: payment.type ?? null,
    pass_type: payment.pass_type ?? null,
    request_id: payment.request_id ?? null,
    request_title: payment.request_title ?? null,
    amount: payment.amount,
    currency: payment.currency,
    mpesa_transaction_id: payment.mpesa_transaction_id,
    phone_number: payment.phone_number ?? null,
    status: payment.status,
    failure_reason: payment.failure_reason ?? null,
    paid_at: payment.paid_at,
    pass_expires_at: payment.pass_expires_at || null,
  });
  if (error) console.warn('[Supabase] createPayment error:', error.message);
}

// ============================================================================
// REVIEWS (Create)
// ============================================================================
export async function createReviewInDb(
  authUserId: string,
  review: Review
): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    id: review.id,
    user_id: authUserId,
    operator_id: review.operator_id,
    traveler_id: review.traveler_id,
    traveler_name: review.traveler_name,
    traveler_country: review.traveler_country,
    request_id: review.request_id,
    rating: review.rating,
    comment: review.comment,
    trip_type: review.trip_type,
    created_at: review.created_at,
  });
  if (error) console.warn('[Supabase] createReview error:', error.message);
}

// ============================================================================
// BLOG POSTS (Create / Delete)
// ============================================================================
export async function createBlogPostInDb(
  authUserId: string,
  post: BlogPost
): Promise<void> {
  const { error } = await supabase.from('blog_posts').insert({
    id: post.id,
    user_id: authUserId,
    slug: post.slug,
    title: post.title,
    destination: post.destination,
    category: post.category,
    image_url: post.image_url,
    author_name: post.author_name,
    author_role: post.author_role,
    published_at: post.published_at,
    read_time: post.read_time,
    excerpt: post.excerpt,
    content: post.content,
    best_months: post.best_months,
    estimated_budget_usd: post.estimated_budget_usd,
    recommended_duration: post.recommended_duration,
    highlights: post.highlights,
    cta_prompt: post.cta_prompt ?? null,
    cta_button_label: post.cta_button_label ?? null,
    cta_category: post.cta_category ?? null,
  });
  if (error) console.warn('[Supabase] createBlogPost error:', error.message);
}

export async function deleteBlogPostInDb(
  authUserId: string,
  postId: string
): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] deleteBlogPost error:', error.message);
}

// ============================================================================
// FLAGGED REPORTS (Create / Update)
// ============================================================================
export async function createReportInDb(
  authUserId: string,
  report: FlaggedReport
): Promise<void> {
  const { error } = await supabase.from('flagged_reports').insert({
    id: report.id,
    user_id: authUserId,
    reported_by_id: report.reported_by_id,
    reported_by_name: report.reported_by_name,
    target_type: report.target_type,
    target_id: report.target_id,
    target_title: report.target_title,
    reason: report.reason,
    details: report.details,
    status: report.status,
    created_at: report.created_at,
  });
  if (error) console.warn('[Supabase] createReport error:', error.message);
}

export async function updateReportStatusInDb(
  authUserId: string,
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<void> {
  const { error } = await supabase
    .from('flagged_reports')
    .update({ status })
    .eq('id', reportId)
    .eq('user_id', authUserId);
  if (error) console.warn('[Supabase] updateReportStatus error:', error.message);
}
