import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import {
  User,
  Operator,
  TravelRequest,
  Bid,
  ContactShare,
  PaymentRecord,
  Review,
  FlaggedReport,
  TravelCategory,
  Currency,
  TravelerContact,
  UserRole,
  BlogPost,
  Bookmark,
  PassHistoryItem,
  ContactUnlockRecord,
  AdminMarketplaceSettings,
  TravelerUnlockNotification,
} from '../types';
import { SEED_BLOG_POSTS, SEED_ADMIN_SETTINGS } from '../data/seedData';
import { getPathForTab, parseLocationToTab, getPageTitleForTab } from '../utils/routes';
import {
  OperatorPassRecord,
  loadPublicSupabaseData,
  loadAuthenticatedSupabaseState,
  createRequestWithContactsInDb,
  updateRequestInDb,
  insertBidInDb,
  upsertOperatorProfileInDb,
  updateProfileInDb,
  addBookmarkInDb,
  removeBookmarkInDb,
  fetchRequestContactFromDb,
  uploadVerificationDocToStorage,
  invokeMpesaPaymentEdgeFunction,
  mapSettingsToAdminConfig,
  rpcUnlocksUsed,
  rpcUnlockFeeKsh,
} from '../services/supabaseData';

interface SlotInfo {
  total: number;
  used: number;
  left: number;
  isLocked: boolean;
}

export interface ActionResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface AppContextType {
  currentUser: User | null;
  currentOperator: Operator | null;
  allUsers: User[];
  operators: Operator[];
  requests: TravelRequest[];
  bids: Bid[];
  passes: OperatorPassRecord[];
  contactShares: ContactShare[];
  payments: PaymentRecord[];
  reviews: Review[];
  reports: FlaggedReport[];
  blogPosts: BlogPost[];
  bookmarks: Bookmark[];
  unlocks: ContactUnlockRecord[];
  adminSettings: AdminMarketplaceSettings;
  isLoadingData: boolean;
  supabaseError: string | null;
  clearSupabaseError: () => void;
  refreshData: () => Promise<void>;

  // Bookmarks (Supabase `bookmarks`)
  toggleBookmark: (requestId: string) => Promise<void>;
  isBookmarked: (requestId: string) => boolean;

  // Blog (static editorial guides)
  createBlogPost: (data: Omit<BlogPost, 'id' | 'slug' | 'published_at'>) => string;
  deleteBlogPost: (id: string) => void;
  getBlogPostBySlug: (slug: string) => BlogPost | undefined;

  // Navigation & URL state
  activeTab: string;
  setActiveTab: (tab: string, param?: string) => void;
  tabParam: string | null;

  // Auth (Supabase Auth session only)
  logoutUser: () => Promise<void>;
  authPrompt: {
    isOpen: boolean;
    role: UserRole;
    destinationTab: string;
    destinationParam?: string;
    reason?: string;
  } | null;
  openAuthPrompt: (role?: UserRole, destinationTab?: string, destinationParam?: string, reason?: string) => void;
  closeAuthPrompt: () => void;

  // Traveller Actions (Supabase `requests` + `request_contacts`)
  createTravelRequest: (data: {
    category: TravelCategory;
    title: string;
    destination?: string;
    start_date: string;
    end_date: string;
    flexible_month?: string;
    adults: number;
    children: number;
    budget: number;
    budget_usd?: number;
    currency: Currency;
    notes: string;
    safari_details?: any;
    hotel_details?: any;
    bnb_details?: any;
    whatsapp_number?: string;
    call_number?: string;
    email_address?: string;
    preferred_contact_method?: 'whatsapp' | 'email' | 'phone';
    preferred_contact_methods?: ('whatsapp' | 'email' | 'phone')[];
    traveler_country?: string;
  }) => Promise<ActionResult>;
  extendRequestSlots: (requestId: string, additionalSlots: 10 | 20) => Promise<ActionResult>;
  addRequestUnlocks: (requestId: string, additionalUnlocks: 10 | 20) => Promise<ActionResult>;
  toggleRequestUnlocks: (requestId: string) => Promise<ActionResult>;
  extendRequestTime: (requestId: string, additionalDays: 3 | 7) => Promise<ActionResult>;
  closeRequestEarly: (requestId: string, reason?: string) => Promise<ActionResult>;
  reopenRequest: (requestId: string) => Promise<ActionResult>;
  shareContactWithOperator: (requestId: string, operatorId: string, contact: TravelerContact) => void;
  shortlistBid: (bidId: string) => void;
  declineBid: (bidId: string) => void;
  reviewOperator: (operatorId: string, requestId: string, rating: number, comment: string, tripType: string) => void;
  canEditRequest: (requestId: string) => { allowed: boolean; reason?: string };
  editTravelRequest: (requestId: string, updates: Partial<TravelRequest>) => Promise<ActionResult>;
  repostRequest: (requestId: string) => Promise<ActionResult>;
  markRequestBooked: (requestId: string, operatorId: string) => Promise<ActionResult>;
  updateTravelerProfile: (data: { name: string; country?: string; phone?: string; preferred_currency?: Currency }) => Promise<ActionResult>;
  getTravelerUnlockNotifications: (travelerId: string) => TravelerUnlockNotification[];
  getEligibleReviewOperators: (requestId: string) => Operator[];

  // Operator Actions (Supabase `operator_profiles`, `bids`, `verification-docs` storage)
  registerOperator: (data: {
    business_name: string;
    contact_name: string;
    phone: string;
    email: string;
    categories: TravelCategory[];
    regions: string[];
    description?: string;
    licence_number?: string;
    verification_requested?: boolean;
  }) => Promise<ActionResult>;
  updateOperatorProfile: (data: {
    business_name: string;
    contact_name: string;
    phone: string;
    email: string;
    categories: TravelCategory[];
    regions: string[];
    description?: string;
    licence_number?: string;
    licence_file_name?: string;
    business_registration_file_name?: string;
    verification_requested?: boolean;
  }) => Promise<ActionResult>;
  uploadLicenceDocument: (file: File) => Promise<{ success: boolean; path?: string; error?: string }>;
  isProfileComplete: (operator: Operator | null) => boolean;
  submitMpesaPayment: (
    operatorId: string,
    phoneNumber: string,
    passType?: 'bidding' | 'contact_unlock',
    simulateFailure?: boolean
  ) => Promise<{ success: boolean; transactionId: string; message: string; notCharged?: boolean }>;
  submitBid: (data: {
    request_id: string;
    price: number;
    currency: Currency;
    inclusions: string[];
    message: string;
    follow_up_message?: string;
    valid_until: string;
    operator_email?: string;
    operator_whatsapp?: string;
    operator_phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getPassHistory: (operatorId: string) => PassHistoryItem[];
  verifyPassOnServer: (operatorId: string) => Promise<{
    active: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    isEndingSoon: boolean;
    label: string;
    expiresAt: string | null;
  }>;

  // Admin & Reporting stubs (read-only / error-reporting)
  adminApproveOperator: (operatorId: string) => void;
  adminRejectOperator: (operatorId: string, reason: string) => void;
  adminResolveReport: (reportId: string, status: 'resolved' | 'dismissed') => void;
  reportTarget: (data: {
    target_type: 'operator' | 'bid' | 'request';
    target_id: string;
    target_title: string;
    reason: string;
    details: string;
  }) => void;

  // Helpers (driven by Supabase data & RPCs)
  getSlotInfo: (requestId: string) => SlotInfo;
  getBidsForRequest: (requestId: string) => Bid[];
  isPassActive: (operator: Operator | null) => boolean;
  isBiddingPassActive: (operator: Operator | null) => boolean;
  isContactPassActive: (operator: Operator | null) => boolean;
  getPassTimeRemaining: (operator: Operator | null) => { active: boolean; label: string; hoursLeft: number };
  getBiddingPassTimeRemaining: (operator: Operator | null) => {
    active: boolean;
    label: string;
    hoursLeft: number;
    minutesLeft: number;
    expiresAt: string | null;
  };
  getContactPassTimeRemaining: (operator: Operator | null) => {
    active: boolean;
    label: string;
    hoursLeft: number;
    expiresAt: string | null;
  };
  getContactShare: (requestId: string, operatorId: string) => ContactShare | undefined;

  // Unlocks & Pricing (Supabase RPCs `unlock_fee_ksh` & `unlocks_used`, `request_contacts` RLS)
  calculateUnlockFee: (request: TravelRequest) => { feeKsh: number; tierLabel: string };
  getListingUnlockInfo: (requestId: string) => {
    paidCount: number;
    remaining: number;
    isFull: boolean;
    total: number;
    bidsOnly: boolean;
  };
  isContactUnlocked: (requestId: string, operatorId: string) => boolean;
  getUnlockedContact: (requestId: string, operatorId: string) => TravelerContact | undefined;
  fetchRequestContactDetails: (requestId: string) => Promise<TravelerContact | null>;
  startUnlockHold: (
    requestId: string,
    operatorId: string
  ) => Promise<{ success: boolean; holdId?: string; feeKsh?: number; error?: string; heldUntil?: string }>;
  cancelUnlockHold: (holdId: string, operatorId: string, reason?: string) => Promise<void>;
  confirmUnlockPayment: (data: {
    holdId?: string;
    requestId: string;
    operatorId: string;
    phoneNumber: string;
    simulateFailure?: boolean;
    simulateLatePaymentFull?: boolean;
    requestTitle?: string;
    requestCategory?: TravelCategory;
  }) => Promise<{
    success: boolean;
    message: string;
    refunded?: boolean;
    notCharged?: boolean;
    unlock?: ContactUnlockRecord;
  }>;
  payBiddingPass: (
    operatorId: string,
    phoneNumber: string,
    simulateFailure?: boolean
  ) => Promise<{ success: boolean; message: string; notCharged?: boolean }>;
  updateAdminSettings: (updates: Partial<AdminMarketplaceSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // All database-backed state starts empty and is hydrated strictly from Supabase (NO localStorage / sessionStorage / seed DB data)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [passes, setPasses] = useState<OperatorPassRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [unlocks, setUnlocks] = useState<ContactUnlockRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [requestContactsByRequestId, setRequestContactsByRequestId] = useState<
    Record<string, TravelerContact>
  >({});
  const [unlocksUsedByRequestId, setUnlocksUsedByRequestId] = useState<Record<string, number>>({});
  const [unlockFeeKshByRequestId, setUnlockFeeKshByRequestId] = useState<Record<string, number>>({});
  const [adminSettings, setAdminSettings] = useState<AdminMarketplaceSettings>(SEED_ADMIN_SETTINGS);

  // Non-DB editorial blog posts
  const [blogPosts] = useState<BlogPost[]>(SEED_BLOG_POSTS);
  const [reviews] = useState<Review[]>([]);
  const [reports] = useState<FlaggedReport[]>([]);
  const [contactShares] = useState<ContactShare[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const clearSupabaseError = useCallback(() => setSupabaseError(null), []);

  const reportError = useCallback((msg: string | null) => {
    if (msg) {
      console.error('[Supabase Error]', msg);
      setSupabaseError(msg);
    }
  }, []);

  // Navigation tab state synced with URL path
  const initialRoute = useMemo(() => parseLocationToTab(window.location.pathname), []);
  const [activeTab, setActiveTabState] = useState<string>(initialRoute.tab);
  const [tabParam, setTabParam] = useState<string | null>(initialRoute.param);

  const setActiveTab = useCallback((tab: string, param?: string) => {
    const resolvedParam = param || null;
    setActiveTabState(tab);
    setTabParam(resolvedParam);

    const targetPath = getPathForTab(tab, resolvedParam);
    const preserveSignupQuery =
      tab === 'login' &&
      targetPath === '/login' &&
      window.location.pathname === '/login' &&
      window.location.search.includes('signup=success');

    if (!preserveSignupQuery && (window.location.pathname !== targetPath || window.location.search)) {
      window.history.pushState({ tab, param: resolvedParam }, '', targetPath);
    }

    document.title = getPageTitleForTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    document.title = getPageTitleForTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseLocationToTab(window.location.pathname);
      setActiveTabState(parsed.tab);
      setTabParam(parsed.param);
      document.title = getPageTitleForTab(parsed.tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth Prompt Modal State
  const [authPrompt, setAuthPrompt] = useState<{
    isOpen: boolean;
    role: UserRole;
    destinationTab: string;
    destinationParam?: string;
    reason?: string;
  } | null>(null);

  const openAuthPrompt = useCallback(
    (
      role: UserRole = 'traveler',
      destinationTab: string = 'traveler-post',
      destinationParam?: string,
      reason?: string
    ) => {
      setAuthPrompt({
        isOpen: true,
        role: role === 'operator' ? 'operator' : 'traveler',
        destinationTab,
        destinationParam,
        reason,
      });
    },
    []
  );

  const closeAuthPrompt = useCallback(() => setAuthPrompt(null), []);

  // Refresh everything from Supabase using the current Supabase Auth session
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        reportError(`auth.getSession: ${sessionError.message}`);
      }

      if (session?.user?.id) {
        const loaded = await loadAuthenticatedSupabaseState(session.user.id);
        setCurrentUser(loaded.profile);
        setCurrentOperator(loaded.operatorProfile);
        setOperators(loaded.operators);
        setRequests(loaded.requests);
        setBids(loaded.bids);
        setPasses(loaded.passes);
        setPayments(loaded.payments);
        setUnlocks(loaded.unlocks);
        setBookmarks(loaded.bookmarks);
        setRequestContactsByRequestId(loaded.requestContactsByRequestId);
        setUnlocksUsedByRequestId(loaded.unlocksUsedByRequestId);
        setUnlockFeeKshByRequestId(loaded.unlockFeeKshByRequestId);
        setAdminSettings(mapSettingsToAdminConfig(loaded.settings, SEED_ADMIN_SETTINGS));

        if (loaded.errors.length > 0) {
          reportError(loaded.errors[0]);
        }
      } else {
        setCurrentUser(null);
        setCurrentOperator(null);
        setOperators([]);
        setBids([]);
        setPasses([]);
        setPayments([]);
        setUnlocks([]);
        setBookmarks([]);
        setRequestContactsByRequestId({});

        const pub = await loadPublicSupabaseData();
        setRequests(pub.requests);
        setUnlocksUsedByRequestId(pub.unlocksUsedByRequestId);
        setUnlockFeeKshByRequestId(pub.unlockFeeKshByRequestId);
        setAdminSettings(mapSettingsToAdminConfig(pub.settings, SEED_ADMIN_SETTINGS));
      }
    } catch (err) {
      reportError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingData(false);
    }
  }, [reportError]);

  // Initial load + listen to Supabase Auth state changes
  useEffect(() => {
    void refreshData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentOperator(null);
        setOperators([]);
        setRequests([]);
        setBids([]);
        setPasses([]);
        setPayments([]);
        setUnlocks([]);
        setBookmarks([]);
        setRequestContactsByRequestId({});
        setUnlocksUsedByRequestId({});
        setUnlockFeeKshByRequestId({});
        void refreshData();
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        void refreshData();
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
          setAuthPrompt(null);
          if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
          setActiveTabState('home');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  // Re-fetch fresh Supabase rows whenever navigating to dashboard / request pages
  useEffect(() => {
    const dataTabs = new Set([
      'home',
      'traveler-dashboard',
      'traveler-my-requests',
      'traveler-request-detail',
      'operator-dashboard',
      'operator-open-requests',
      'operator-request-detail',
      'operator-my-bids',
      'operator-pay',
      'shared-request',
    ]);
    if (dataTabs.has(activeTab)) {
      void refreshData();
    }
  }, [activeTab, refreshData]);

  const logoutUser = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      reportError(`auth.signOut: ${error.message}`);
    }
    setCurrentUser(null);
    setCurrentOperator(null);
    setActiveTab('home');
  }, [reportError, setActiveTab]);

  // Derived allUsers list (strictly from Supabase currentUser)
  const allUsers = useMemo(() => (currentUser ? [currentUser] : []), [currentUser]);

  // Rule 2: Traveller posts a request -> insert `requests` (no traveller_id) -> insert `request_contacts`
  const createTravelRequest: AppContextType['createTravelRequest'] = async (data) => {
    const budgetUsd = Number(data.budget_usd ?? data.budget);
    if (!budgetUsd || Number.isNaN(budgetUsd) || budgetUsd <= 0) {
      const msg = 'Budget (USD) is required and must be greater than 0.';
      reportError(msg);
      return { success: false, error: msg };
    }

    // Build destination string from category fields
    let destination = data.destination?.trim() || '';
    if (!destination) {
      if (data.category === 'safari' && data.safari_details?.parks?.length) {
        destination = data.safari_details.parks.join(', ');
      } else if (data.category === 'hotel' && data.hotel_details?.destination) {
        destination = data.hotel_details.destination;
      } else if (data.category === 'bnb' && data.bnb_details?.neighbourhood) {
        destination = data.bnb_details.neighbourhood;
      } else {
        destination = data.traveler_country?.trim() || 'Kenya';
      }
    }

    const res = await createRequestWithContactsInDb({
      category: data.category,
      title: data.title.trim(),
      description: data.notes.trim(),
      destination,
      start_date: data.start_date,
      end_date: data.end_date,
      adults: Number(data.adults) || 1,
      children: Number(data.children) || 0,
      budget_usd: budgetUsd,
      email: (data.email_address || currentUser?.email || '').trim(),
      whatsapp: (data.whatsapp_number || '').trim(),
      phone: (data.call_number || data.whatsapp_number || '').trim(),
    });

    if (res.error || !res.data) {
      const errMsg = res.error || 'Failed to save travel request in Supabase.';
      reportError(errMsg);
      return { success: false, error: errMsg };
    }

    await refreshData();
    return { success: true, id: res.data.id };
  };

  // Rule 3: Traveller updates unlock_limit, unlocking_enabled, status, expires_at
  const addRequestUnlocks = async (requestId: string, additionalUnlocks: 10 | 20): Promise<ActionResult> => {
    const req = requests.find((r) => r.id === requestId);
    const currentLimit = req?.unlock_limit ?? 30;
    const res = await updateRequestInDb(requestId, {
      unlock_limit: currentLimit + additionalUnlocks,
    });
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const extendRequestSlots = addRequestUnlocks;

  const toggleRequestUnlocks = async (requestId: string): Promise<ActionResult> => {
    const req = requests.find((r) => r.id === requestId);
    const nextEnabled = !(req?.unlocks_enabled !== false);
    const res = await updateRequestInDb(requestId, {
      unlocking_enabled: nextEnabled,
    });
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const extendRequestTime = async (requestId: string, additionalDays: 3 | 7): Promise<ActionResult> => {
    const req = requests.find((r) => r.id === requestId);
    const currentExp = req?.expires_at ? new Date(req.expires_at).getTime() : Date.now();
    const base = Math.max(Number.isNaN(currentExp) ? Date.now() : currentExp, Date.now());
    const newExp = new Date(base + additionalDays * 24 * 60 * 60 * 1000).toISOString();
    const res = await updateRequestInDb(requestId, {
      expires_at: newExp,
      status: 'open',
    });
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const closeRequestEarly = async (requestId: string): Promise<ActionResult> => {
    const res = await updateRequestInDb(requestId, { status: 'closed' });
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const reopenRequest = async (requestId: string): Promise<ActionResult> => {
    const res = await updateRequestInDb(requestId, { status: 'open' });
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const editTravelRequest = async (
    requestId: string,
    updates: Partial<TravelRequest>
  ): Promise<ActionResult> => {
    const dbUpdates: Parameters<typeof updateRequestInDb>[1] = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.notes !== undefined) dbUpdates.description = updates.notes;
    if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
    if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date;
    if (updates.adults !== undefined) dbUpdates.adults = updates.adults;
    if (updates.children !== undefined) dbUpdates.children = updates.children;
    if (updates.budget_usd !== undefined) dbUpdates.budget_usd = updates.budget_usd;
    else if (updates.budget !== undefined) dbUpdates.budget_usd = updates.budget;

    const res = await updateRequestInDb(requestId, dbUpdates);
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  const repostRequest = async (requestId: string): Promise<ActionResult> => {
    const original = requests.find((r) => r.id === requestId);
    if (!original) return { success: false, error: 'Original request not found.' };
    const existingContact = requestContactsByRequestId[requestId];
    return createTravelRequest({
      category: original.category,
      title: original.title,
      destination: original.traveler_country,
      start_date: original.start_date,
      end_date: original.end_date,
      adults: original.adults,
      children: original.children,
      budget: original.budget_usd ?? original.budget,
      budget_usd: original.budget_usd ?? original.budget,
      currency: 'USD',
      notes: original.notes,
      email_address: existingContact?.email || currentUser?.email || '',
      whatsapp_number: existingContact?.whatsapp || '',
      call_number: existingContact?.phone || '',
    });
  };

  const markRequestBooked = async (requestId: string): Promise<ActionResult> => {
    return closeRequestEarly(requestId);
  };

  const updateTravelerProfile = async (data: {
    name: string;
    country?: string;
    phone?: string;
    preferred_currency?: Currency;
  }): Promise<ActionResult> => {
    if (!currentUser) return { success: false, error: 'You must be logged in.' };
    const res = await updateProfileInDb(currentUser.id, data.name.trim());
    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }
    await refreshData();
    return { success: true };
  };

  // Operator Profile Upsert (`operator_profiles`)
  const upsertOperator = async (data: {
    business_name: string;
    contact_name: string;
    phone: string;
    email: string;
    categories: TravelCategory[];
    regions: string[];
    description?: string;
    licence_number?: string;
    verification_requested?: boolean;
  }): Promise<ActionResult> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || currentUser?.id;
    if (!userId) {
      const msg = 'You must be logged in to save your operator profile.';
      reportError(msg);
      return { success: false, error: msg };
    }

    const res = await upsertOperatorProfileInDb({
      user_id: userId,
      business_name: data.business_name.trim(),
      contact_person: data.contact_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      categories: data.categories,
      regions: data.regions,
      description: data.description?.trim() || '',
      tra_licence_number: data.licence_number?.trim() || undefined,
      verification_requested: Boolean(data.verification_requested || data.licence_number?.trim()),
    });

    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }

    await refreshData();
    return { success: true };
  };

  const registerOperator: AppContextType['registerOperator'] = upsertOperator;
  const updateOperatorProfile: AppContextType['updateOperatorProfile'] = upsertOperator;

  // Rule 9: Upload licence document to private storage bucket "verification-docs" at <user_id>/<filename>
  const uploadLicenceDocument = async (
    file: File
  ): Promise<{ success: boolean; path?: string; error?: string }> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || currentUser?.id;
    if (!userId) {
      const msg = 'You must be logged in to upload verification documents.';
      reportError(msg);
      return { success: false, error: msg };
    }

    const res = await uploadVerificationDocToStorage(userId, file);
    if (res.error || !res.data) {
      const errMsg = res.error || 'Failed to upload document.';
      reportError(errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, path: res.data };
  };

  const isProfileComplete = (operator: Operator | null): boolean => {
    if (!operator) return false;
    return Boolean(
      operator.business_name?.trim() &&
        operator.contact_name?.trim() &&
        operator.phone?.trim() &&
        operator.email?.trim() &&
        operator.categories &&
        operator.categories.length > 0
    );
  };

  // Rule 4: Operator inserts into `bids` ONLY. If insert fails due to no active pass, shows "Pay KSH 850 to bid" + real error.
  const submitBid: AppContextType['submitBid'] = async (data) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const operatorId = session?.user?.id || currentOperator?.user_id || currentUser?.id;
    if (!operatorId) {
      const msg = 'You must be signed in as an operator to submit a bid.';
      reportError(msg);
      return { success: false, error: msg };
    }

    const res = await insertBidInDb({
      request_id: data.request_id,
      operator_id: operatorId,
      amount_usd: Number(data.price),
      message: data.follow_up_message?.trim() || data.message.trim(),
      inclusions: data.inclusions,
      valid_until: data.valid_until,
    });

    if (res.error) {
      reportError(res.error);
      return { success: false, error: res.error };
    }

    await refreshData();
    return { success: true };
  };

  // Bookmarks (`bookmarks(operator_id, request_id)`)
  const toggleBookmark = async (requestId: string): Promise<void> => {
    const operatorId = currentOperator?.user_id || currentUser?.id;
    if (!operatorId) {
      reportError('Sign in as an operator to bookmark requests.');
      return;
    }

    const existing = bookmarks.find(
      (b) => b.operator_id === operatorId && b.request_id === requestId
    );
    const res = existing
      ? await removeBookmarkInDb(operatorId, requestId)
      : await addBookmarkInDb(operatorId, requestId);

    if (res.error) {
      reportError(res.error);
      return;
    }

    await refreshData();
  };

  const isBookmarked = (requestId: string): boolean => {
    const operatorId = currentOperator?.user_id || currentUser?.id;
    if (!operatorId) return false;
    return bookmarks.some((b) => b.operator_id === operatorId && b.request_id === requestId);
  };

  // Rule 5: Active pass = a row in `passes` with expires_at > now() for this operator.
  const getActivePassForOperator = useCallback(
    (operatorId: string | null | undefined): OperatorPassRecord | null => {
      if (!operatorId) return null;
      const nowMs = Date.now();
      const matching = passes
        .filter((p) => p.operator_id === operatorId)
        .filter((p) => {
          const expMs = new Date(p.expires_at).getTime();
          return !Number.isNaN(expMs) && expMs > nowMs;
        })
        .sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime());

      return matching[0] || null;
    },
    [passes]
  );

  const getBiddingPassTimeRemaining = useCallback(
    (operator: Operator | null) => {
      const opId = operator?.user_id || currentUser?.id;
      const activePass = getActivePassForOperator(opId);
      if (!activePass) {
        return { active: false, label: 'Inactive / Expired', hoursLeft: 0, minutesLeft: 0, expiresAt: null };
      }
      const diffMs = new Date(activePass.expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        return { active: false, label: 'Expired', hoursLeft: 0, minutesLeft: 0, expiresAt: activePass.expires_at };
      }
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        active: true,
        label: `${hoursLeft}h ${minutesLeft}m left`,
        hoursLeft,
        minutesLeft,
        expiresAt: activePass.expires_at,
      };
    },
    [currentUser?.id, getActivePassForOperator]
  );

  const isBiddingPassActive = useCallback(
    (operator: Operator | null): boolean => getBiddingPassTimeRemaining(operator).active,
    [getBiddingPassTimeRemaining]
  );

  const isPassActive = isBiddingPassActive;

  const getPassTimeRemaining = useCallback(
    (operator: Operator | null) => {
      const info = getBiddingPassTimeRemaining(operator);
      return { active: info.active, label: info.label, hoursLeft: info.hoursLeft };
    },
    [getBiddingPassTimeRemaining]
  );

  const isContactPassActive = () => false;
  const getContactPassTimeRemaining = () => ({
    active: false,
    label: 'Per-listing unlock',
    hoursLeft: 0,
    expiresAt: null,
  });

  const verifyPassOnServer = useCallback(
    async (operatorId: string) => {
      const { data, error } = await supabase
        .from('passes')
        .select('*')
        .eq('operator_id', operatorId)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1);

      if (error) {
        reportError(`select passes: ${error.message}`);
        return {
          active: false,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isEndingSoon: false,
          label: 'Unable to check pass',
          expiresAt: null,
        };
      }

      const activeRow = data && data[0];
      if (!activeRow?.expires_at) {
        return {
          active: false,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isEndingSoon: false,
          label: 'No active pass',
          expiresAt: null,
        };
      }

      const diffMs = new Date(activeRow.expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        return {
          active: false,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isEndingSoon: false,
          label: 'Expired',
          expiresAt: activeRow.expires_at,
        };
      }

      const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        active: true,
        hoursRemaining,
        minutesRemaining,
        isEndingSoon: diffMs < 2 * 60 * 60 * 1000,
        label: `${hoursRemaining}h ${minutesRemaining}m left`,
        expiresAt: activeRow.expires_at,
      };
    },
    [reportError]
  );

  const getPassHistory = useCallback(
    (operatorId: string): PassHistoryItem[] => {
      const nowMs = Date.now();
      return passes
        .filter((p) => p.operator_id === operatorId)
        .sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())
        .map((p) => {
          const expMs = new Date(p.expires_at).getTime();
          const startTime = p.created_at || new Date(expMs - 24 * 60 * 60 * 1000).toISOString();
          const active = expMs > nowMs;
          const bidsCount = bids.filter((b) => b.operator_id === operatorId).length;
          return {
            id: p.id,
            operator_id: p.operator_id,
            start: startTime,
            end: p.expires_at,
            status: active ? 'active' : 'expired',
            bids_sent_count: bidsCount,
            mpesa_transaction_id: p.id,
            amount: adminSettings.biddingPassFeeKsh || 850,
          };
        });
    },
    [adminSettings.biddingPassFeeKsh, bids, passes]
  );

  // Rule 6: Unlock fee from RPC `unlock_fee_ksh({ p_budget_usd })` & unlocks used from RPC `unlocks_used({ p_request })`
  const calculateUnlockFee = useCallback(
    (request: TravelRequest): { feeKsh: number; tierLabel: string } => {
      const rpcFee = unlockFeeKshByRequestId[request.id];
      const budgetUsd = request.budget_usd ?? request.budget;
      return {
        feeKsh: rpcFee !== undefined ? rpcFee : 0,
        tierLabel: `$${budgetUsd.toLocaleString()} USD`,
      };
    },
    [unlockFeeKshByRequestId]
  );

  const getListingUnlockInfo = useCallback(
    (requestId: string) => {
      const req = requests.find((r) => r.id === requestId);
      const total = req?.unlock_limit ?? 30;
      const bidsOnly = req?.unlocks_enabled === false || req?.bids_only === true;
      const paidCount = unlocksUsedByRequestId[requestId] ?? 0;
      const remaining = Math.max(0, total - paidCount);
      return {
        paidCount,
        remaining,
        isFull: remaining === 0,
        total,
        bidsOnly,
      };
    },
    [requests, unlocksUsedByRequestId]
  );

  // Rule 6: Contact details show ONLY if `request_contacts` returns a row for that request (RLS allows only after paid unlock)
  const isContactUnlocked = useCallback(
    (requestId: string, _operatorId: string): boolean => {
      return Boolean(requestContactsByRequestId[requestId]);
    },
    [requestContactsByRequestId]
  );

  const getUnlockedContact = useCallback(
    (requestId: string, _operatorId: string): TravelerContact | undefined => {
      return requestContactsByRequestId[requestId];
    },
    [requestContactsByRequestId]
  );

  const fetchRequestContactDetails = useCallback(
    async (requestId: string): Promise<TravelerContact | null> => {
      const [contactRes, usedRes] = await Promise.all([
        fetchRequestContactFromDb(requestId),
        rpcUnlocksUsed(requestId),
      ]);

      if (contactRes.error) {
        reportError(contactRes.error);
      } else if (contactRes.data) {
        setRequestContactsByRequestId((prev) => ({
          ...prev,
          [requestId]: contactRes.data!,
        }));
      }

      if (usedRes.error) {
        reportError(usedRes.error);
      } else if (usedRes.data !== null) {
        setUnlocksUsedByRequestId((prev) => ({
          ...prev,
          [requestId]: usedRes.data!,
        }));
      }

      const req = requests.find((r) => r.id === requestId);
      if (req) {
        const feeRes = await rpcUnlockFeeKsh(req.budget_usd ?? req.budget);
        if (feeRes.error) {
          reportError(feeRes.error);
        } else if (feeRes.data !== null) {
          setUnlockFeeKshByRequestId((prev) => ({
            ...prev,
            [requestId]: feeRes.data!,
          }));
        }
      }

      return contactRes.data;
    },
    [reportError, requests]
  );

  // Rule 7: Payments, passes, and unlocks are NOT created by the frontend.
  // Pay buttons call the placeholder Supabase Edge Function and show a clear "not connected yet" message.
  const payBiddingPass: AppContextType['payBiddingPass'] = async (_operatorId, phoneNumber) => {
    const res = await invokeMpesaPaymentEdgeFunction({
      paymentType: 'bidding_pass',
      phoneNumber,
    });
    if (!res.success) {
      reportError(res.message);
      return { success: false, message: res.message, notCharged: true };
    }
    await refreshData();
    return { success: true, message: res.message };
  };

  const submitMpesaPayment: AppContextType['submitMpesaPayment'] = async (
    operatorId,
    phoneNumber
  ) => {
    const res = await payBiddingPass(operatorId, phoneNumber);
    return {
      success: res.success,
      transactionId: '',
      message: res.message,
      notCharged: res.notCharged,
    };
  };

  const startUnlockHold: AppContextType['startUnlockHold'] = async (requestId) => {
    const req = requests.find((r) => r.id === requestId);
    const fee = req ? calculateUnlockFee(req).feeKsh : 0;
    return {
      success: true,
      holdId: `edge_unlock_${requestId}`,
      feeKsh: fee,
      heldUntil: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    };
  };

  const cancelUnlockHold: AppContextType['cancelUnlockHold'] = async () => {
    // No frontend writes to unlocks table
  };

  const confirmUnlockPayment: AppContextType['confirmUnlockPayment'] = async (data) => {
    const res = await invokeMpesaPaymentEdgeFunction({
      paymentType: 'contact_unlock',
      phoneNumber: data.phoneNumber,
      requestId: data.requestId,
    });
    if (!res.success) {
      reportError(res.message);
      return { success: false, message: res.message, notCharged: true };
    }
    await refreshData();
    return { success: true, message: res.message };
  };

  // Helpers
  const getBidsForRequest = useCallback(
    (requestId: string): Bid[] => {
      return bids
        .filter((b) => b.request_id === requestId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    [bids]
  );

  const getSlotInfo = useCallback(
    (requestId: string): SlotInfo => {
      const info = getListingUnlockInfo(requestId);
      const req = requests.find((r) => r.id === requestId);
      return {
        total: info.total,
        used: info.paidCount,
        left: info.remaining,
        isLocked: req?.status === 'closed' || info.isFull,
      };
    },
    [getListingUnlockInfo, requests]
  );

  const canEditRequest = useCallback(
    (requestId: string): { allowed: boolean; reason?: string } => {
      const req = requests.find((r) => r.id === requestId);
      if (!req) return { allowed: false, reason: 'Request not found.' };
      if (req.status === 'closed') return { allowed: false, reason: 'Closed enquiries cannot be edited.' };
      const reqBids = bids.filter((b) => b.request_id === requestId);
      const usedUnlocks = unlocksUsedByRequestId[requestId] ?? 0;
      if (reqBids.length > 0 || usedUnlocks > 0) {
        return {
          allowed: false,
          reason: 'Editing is disabled once bids or contact unlocks have been received.',
        };
      }
      return { allowed: true };
    },
    [bids, requests, unlocksUsedByRequestId]
  );

  const getTravelerUnlockNotifications = useCallback((): TravelerUnlockNotification[] => [], []);
  const getEligibleReviewOperators = useCallback((): Operator[] => [], []);
  const getContactShare = () => undefined;

  // Read-only / unsupported actions that do not have matching tables in the user's schema
  const shareContactWithOperator = () => {
    reportError('Direct contact sharing is managed via request_contacts unlocks.');
  };
  const shortlistBid = () => {
    reportError('Bid status updates are not enabled in the current bids table schema.');
  };
  const declineBid = () => {
    reportError('Bid status updates are not enabled in the current bids table schema.');
  };
  const reviewOperator = () => {
    reportError('Reviews table is not configured in Supabase.');
  };
  const adminApproveOperator = () => {
    reportError('Admin verification updates must be performed via Supabase admin tools.');
  };
  const adminRejectOperator = () => {
    reportError('Admin verification updates must be performed via Supabase admin tools.');
  };
  const adminResolveReport = () => {
    reportError('Moderation reports table is not configured in Supabase.');
  };
  const reportTarget = () => {
    reportError('Moderation reports table is not configured in Supabase.');
  };
  const updateAdminSettings = () => {
    reportError('Settings are read-only from the frontend.');
  };
  const createBlogPost = () => {
    reportError('Blog posts are static content and not stored in Supabase.');
    return '';
  };
  const deleteBlogPost = () => {
    reportError('Blog posts are static content and not stored in Supabase.');
  };
  const getBlogPostBySlug = (slug: string) => blogPosts.find((p) => p.slug === slug);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentOperator,
        allUsers,
        operators,
        requests,
        bids,
        passes,
        contactShares,
        payments,
        reviews,
        reports,
        blogPosts,
        bookmarks,
        unlocks,
        adminSettings,
        isLoadingData,
        supabaseError,
        clearSupabaseError,
        refreshData,
        toggleBookmark,
        isBookmarked,
        createBlogPost,
        deleteBlogPost,
        getBlogPostBySlug,
        activeTab,
        setActiveTab,
        tabParam,
        logoutUser,
        authPrompt,
        openAuthPrompt,
        closeAuthPrompt,
        createTravelRequest,
        extendRequestSlots,
        addRequestUnlocks,
        toggleRequestUnlocks,
        extendRequestTime,
        closeRequestEarly,
        reopenRequest,
        shareContactWithOperator,
        shortlistBid,
        declineBid,
        reviewOperator,
        canEditRequest,
        editTravelRequest,
        repostRequest,
        markRequestBooked,
        updateTravelerProfile,
        getTravelerUnlockNotifications,
        getEligibleReviewOperators,
        registerOperator,
        updateOperatorProfile,
        uploadLicenceDocument,
        isProfileComplete,
        submitMpesaPayment,
        submitBid,
        getPassHistory,
        verifyPassOnServer,
        adminApproveOperator,
        adminRejectOperator,
        adminResolveReport,
        reportTarget,
        getSlotInfo,
        getBidsForRequest,
        isPassActive,
        isBiddingPassActive,
        isContactPassActive,
        getPassTimeRemaining,
        getBiddingPassTimeRemaining,
        getContactPassTimeRemaining,
        getContactShare,
        calculateUnlockFee,
        getListingUnlockInfo,
        isContactUnlocked,
        getUnlockedContact,
        fetchRequestContactDetails,
        startUnlockHold,
        cancelUnlockHold,
        confirmUnlockPayment,
        payBiddingPass,
        updateAdminSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
