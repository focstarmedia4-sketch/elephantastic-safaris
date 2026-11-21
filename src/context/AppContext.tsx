import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  UnlockTier,
  TravelerUnlockNotification,
} from '../types';
import {
  SEED_USERS,
  SEED_OPERATORS,
  SEED_REQUESTS,
  SEED_BIDS,
  SEED_CONTACT_SHARES,
  SEED_PAYMENTS,
  SEED_REVIEWS,
  SEED_REPORTS,
  SEED_BLOG_POSTS,
  SEED_BOOKMARKS,
  SEED_UNLOCKS,
  SEED_ADMIN_SETTINGS,
} from '../data/seedData';
import { IMAGES } from '../assets/images';
import { getPathForTab, parseLocationToTab, getPageTitleForTab } from '../utils/routes';

interface SlotInfo {
  total: number;
  used: number;
  left: number;
  isLocked: boolean;
}

interface AppContextType {
  currentUser: User | null;
  currentOperator: Operator | null;
  allUsers: User[];
  operators: Operator[];
  requests: TravelRequest[];
  bids: Bid[];
  contactShares: ContactShare[];
  payments: PaymentRecord[];
  reviews: Review[];
  reports: FlaggedReport[];
  blogPosts: BlogPost[];
  bookmarks: Bookmark[];
  unlocks: ContactUnlockRecord[];
  adminSettings: AdminMarketplaceSettings;

  // Bookmarks
  toggleBookmark: (requestId: string) => void;
  isBookmarked: (requestId: string) => boolean;
  
  // Blog Actions
  createBlogPost: (data: Omit<BlogPost, 'id' | 'slug' | 'published_at'>) => string;
  deleteBlogPost: (id: string) => void;
  getBlogPostBySlug: (slug: string) => BlogPost | undefined;
  
  // Navigation & UI state
  activeTab: string;
  setActiveTab: (tab: string, param?: string) => void;
  tabParam: string | null;
  
  // User Management & Role Switcher
  switchUser: (userId: string) => void;
  loginUser: (email: string, role: UserRole, name: string, country: string, password?: string) => void;
  registerUser: (data: { email: string; password?: string; role: UserRole; name: string; country: string }) => { success: boolean; message?: string };
  loginWithCredentials: (email: string, password?: string) => { success: boolean; message?: string };
  logoutUser: () => void;
  authPrompt: {
    isOpen: boolean;
    role: UserRole;
    destinationTab: string;
    destinationParam?: string;
    reason?: string;
  } | null;
  openAuthPrompt: (role?: UserRole, destinationTab?: string, destinationParam?: string, reason?: string) => void;
  closeAuthPrompt: () => void;
  
  // Traveler Actions
  createTravelRequest: (data: {
    category: TravelCategory;
    title: string;
    start_date: string;
    end_date: string;
    flexible_month?: string;
    adults: number;
    children: number;
    budget: number;
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
  }) => string; // returns new request ID
  extendRequestSlots: (requestId: string, additionalSlots: 10 | 20) => void;
  addRequestUnlocks: (requestId: string, additionalUnlocks: 10 | 20) => void;
  toggleRequestUnlocks: (requestId: string) => void;
  extendRequestTime: (requestId: string, additionalDays: 3 | 7) => void;
  closeRequestEarly: (requestId: string, reason?: string) => void;
  reopenRequest: (requestId: string) => void;
  shareContactWithOperator: (requestId: string, operatorId: string, contact: TravelerContact) => void;
  shortlistBid: (bidId: string) => void;
  declineBid: (bidId: string) => void;
  reviewOperator: (operatorId: string, requestId: string, rating: number, comment: string, tripType: string) => void;
  canEditRequest: (requestId: string) => { allowed: boolean; reason?: string };
  editTravelRequest: (requestId: string, updates: Partial<TravelRequest>) => boolean;
  repostRequest: (requestId: string) => string;
  markRequestBooked: (requestId: string, operatorId: string) => void;
  updateTravelerProfile: (data: { name: string; country: string; phone?: string; preferred_currency?: Currency }) => void;
  getTravelerUnlockNotifications: (travelerId: string) => TravelerUnlockNotification[];
  getEligibleReviewOperators: (requestId: string) => Operator[];
  
  // Operator Actions
  registerOperator: (data: {
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
  }) => void;
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
  }) => void;
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
  }) => { success: boolean; error?: string };
  getPassHistory: (operatorId: string) => PassHistoryItem[];
  verifyPassOnServer: (operatorId: string) => Promise<{
    active: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    isEndingSoon: boolean;
    label: string;
    expiresAt: string | null;
  }>;
  
  // Admin Actions
  adminApproveOperator: (operatorId: string) => void;
  adminRejectOperator: (operatorId: string, reason: string) => void;
  adminResolveReport: (reportId: string, status: 'resolved' | 'dismissed') => void;
  
  // Trust & Safety
  reportTarget: (data: {
    target_type: 'operator' | 'bid' | 'request';
    target_id: string;
    target_title: string;
    reason: string;
    details: string;
  }) => void;

  // Helpers
  getSlotInfo: (requestId: string) => SlotInfo;
  getBidsForRequest: (requestId: string) => Bid[];
  isPassActive: (operator: Operator | null) => boolean;
  isBiddingPassActive: (operator: Operator | null) => boolean;
  isContactPassActive: (operator: Operator | null) => boolean;
  getPassTimeRemaining: (operator: Operator | null) => { active: boolean; label: string; hoursLeft: number };
  getBiddingPassTimeRemaining: (operator: Operator | null) => { active: boolean; label: string; hoursLeft: number; expiresAt: string | null };
  getContactPassTimeRemaining: (operator: Operator | null) => { active: boolean; label: string; hoursLeft: number; expiresAt: string | null };
  getContactShare: (requestId: string, operatorId: string) => ContactShare | undefined;
  
  // Unlocks & Pricing
  calculateUnlockFee: (request: TravelRequest) => { feeKsh: number; tierLabel: string };
  getListingUnlockInfo: (requestId: string) => { paidCount: number; remaining: number; isFull: boolean; total: number; bidsOnly: boolean };
  isContactUnlocked: (requestId: string, operatorId: string) => boolean;
  getUnlockedContact: (requestId: string, operatorId: string) => TravelerContact | undefined;
  startUnlockHold: (requestId: string, operatorId: string) => Promise<{ success: boolean; holdId?: string; feeKsh?: number; error?: string; heldUntil?: string }>;
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
  }) => Promise<{ success: boolean; message: string; refunded?: boolean; notCharged?: boolean; unlock?: ContactUnlockRecord }>;
  payBiddingPass: (operatorId: string, phoneNumber: string, simulateFailure?: boolean) => Promise<{ success: boolean; message: string; notCharged?: boolean }>;
  updateAdminSettings: (updates: Partial<AdminMarketplaceSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'safari_stays_v1_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load or initialize state
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    // Clear demo user auto-login so users are logged out as requested
    const saved = localStorage.getItem(`${STORAGE_PREFIX}current_user_id`);
    if (saved === 'user_traveler_1' || saved === 'user_operator_1' || !saved) {
      localStorage.removeItem(`${STORAGE_PREFIX}current_user_id`);
      return null;
    }
    return saved;
  });

  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}operators`);
    return saved ? JSON.parse(saved) : SEED_OPERATORS;
  });

  const [requests, setRequests] = useState<TravelRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}requests`);
    return saved ? JSON.parse(saved) : SEED_REQUESTS;
  });

  const [bids, setBids] = useState<Bid[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}bids`);
    return saved ? JSON.parse(saved) : SEED_BIDS;
  });

  const [contactShares, setContactShares] = useState<ContactShare[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}contact_shares`);
    return saved ? JSON.parse(saved) : SEED_CONTACT_SHARES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}payments`);
    return saved ? JSON.parse(saved) : SEED_PAYMENTS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}reviews`);
    return saved ? JSON.parse(saved) : SEED_REVIEWS;
  });

  const [reports, setReports] = useState<FlaggedReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}reports`);
    return saved ? JSON.parse(saved) : SEED_REPORTS;
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}blog_posts_v4`);
    if (!saved) return SEED_BLOG_POSTS;
    const parsed: BlogPost[] = JSON.parse(saved);
    const seedById = new Map(SEED_BLOG_POSTS.map((p) => [p.id, p]));
    const legacyAssetMap: Record<string, string> = {
      'safari_tour_card_1794323355207.jpg': IMAGES.safariTours,
      'hotel_lodge_card_1794323356040.jpg': IMAGES.hotelLodge,
      'bnb_villa_card_1794323357592.jpg': IMAGES.bnbVilla,
      'blog_mara_migration_1794325893622.jpg': IMAGES.blogMara,
      'blog_diani_dhow_coast_1794325893839.jpg': IMAGES.blogDiani,
      'blog_mount_kenya_peaks_1794325893931.jpg': IMAGES.blogMountKenya,
      'blog_bush_camp_1794996241796.jpg': IMAGES.blogBushCamp,
      'blog_nyama_choma_1794996243727.jpg': IMAGES.blogNyamaChoma,
      'blog_kenya_guides_1794996242266.jpg': IMAGES.blogKenyaGuides,
      'blog_hidden_gems_1794996922161.jpg': IMAGES.blogHiddenGems,
      'blog_kenyan_culture_1794996923091.jpg': IMAGES.blogKenyanCulture,
      'blog_romantic_kenya_1794996923892.jpg': IMAGES.blogRomanticKenya,
      'blog_rift_valley_1794996921433.jpg': IMAGES.blogRiftValley,
    };

    return parsed.map((post) => {
      if (post.image_url.startsWith('/src/assets/images/')) {
        const seedMatch = seedById.get(post.id);
        if (seedMatch) {
          return { ...post, image_url: seedMatch.image_url };
        }
        const filename = post.image_url.split('/').pop() || '';
        return { ...post, image_url: legacyAssetMap[filename] || IMAGES.blogMara };
      }
      return post;
    });
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}bookmarks`);
    return saved ? JSON.parse(saved) : SEED_BOOKMARKS;
  });

  const [unlocks, setUnlocks] = useState<ContactUnlockRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}unlocks`);
    return saved ? JSON.parse(saved) : SEED_UNLOCKS;
  });

  const [adminSettings, setAdminSettings] = useState<AdminMarketplaceSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}admin_settings`);
    return saved ? JSON.parse(saved) : SEED_ADMIN_SETTINGS;
  });

  const updateAdminSettings = (updates: Partial<AdminMarketplaceSettings>) => {
    setAdminSettings((prev) => ({ ...prev, ...updates }));
  };

  // Navigation tab state initialized from the browser URL so shared links open directly to that page
  const initialRoute = useMemo(() => parseLocationToTab(window.location.pathname), []);
  const [activeTab, setActiveTabState] = useState<string>(initialRoute.tab);
  const [tabParam, setTabParam] = useState<string | null>(initialRoute.param);

  const setActiveTab = (tab: string, param?: string) => {
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
  };

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

  // Auth Prompt Modal State (prompts user to register or sign up first)
  const [authPrompt, setAuthPrompt] = useState<{
    isOpen: boolean;
    role: UserRole;
    destinationTab: string;
    destinationParam?: string;
    reason?: string;
  } | null>(null);

  const openAuthPrompt = (
    role: UserRole = 'traveler',
    destinationTab: string = 'traveler-post',
    destinationParam?: string,
    reason?: string
  ) => {
    setAuthPrompt({
      isOpen: true,
      role,
      destinationTab,
      destinationParam,
      reason,
    });
  };

  const closeAuthPrompt = () => {
    setAuthPrompt(null);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(allUsers));
    if (currentUserId) {
      localStorage.setItem(`${STORAGE_PREFIX}current_user_id`, currentUserId);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}current_user_id`);
    }
    localStorage.setItem(`${STORAGE_PREFIX}operators`, JSON.stringify(operators));
    localStorage.setItem(`${STORAGE_PREFIX}requests`, JSON.stringify(requests));
    localStorage.setItem(`${STORAGE_PREFIX}bids`, JSON.stringify(bids));
    localStorage.setItem(`${STORAGE_PREFIX}contact_shares`, JSON.stringify(contactShares));
    localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify(payments));
    localStorage.setItem(`${STORAGE_PREFIX}reviews`, JSON.stringify(reviews));
    localStorage.setItem(`${STORAGE_PREFIX}reports`, JSON.stringify(reports));
    localStorage.setItem(`${STORAGE_PREFIX}blog_posts_v4`, JSON.stringify(blogPosts));
    localStorage.setItem(`${STORAGE_PREFIX}bookmarks`, JSON.stringify(bookmarks));
    localStorage.setItem(`${STORAGE_PREFIX}unlocks`, JSON.stringify(unlocks));
    localStorage.setItem(`${STORAGE_PREFIX}admin_settings`, JSON.stringify(adminSettings));
  }, [allUsers, currentUserId, operators, requests, bids, contactShares, payments, reviews, reports, blogPosts, bookmarks, unlocks, adminSettings]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return allUsers.find((u) => u.id === currentUserId) || null;
  }, [allUsers, currentUserId]);

  const currentOperator = useMemo(() => {
    if (!currentUser || currentUser.role !== 'operator') return null;
    return operators.find((op) => op.user_id === currentUser.id) || null;
  }, [currentUser, operators]);

  const switchUser = (userId: string) => {
    if (!userId || userId === 'logout') {
      logoutUser();
      return;
    }
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      // Auto-navigate to appropriate home if role changes
      if (target.role === 'traveler') {
        setActiveTab('traveler-my-requests');
      } else if (target.role === 'operator') {
        setActiveTab('operator-dashboard');
      } else if (target.role === 'admin') {
        setActiveTab('admin-verification');
      }
    }
  };

  const allUsersRef = React.useRef(allUsers);
  allUsersRef.current = allUsers;

  useEffect(() => {
    const syncGoogleSession = (
      sessionUser: {
        email?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
      } | null
    ) => {
      if (!sessionUser?.email) return;
      const provider = sessionUser.app_metadata?.provider;
      if (provider !== 'google') return;

      const email = sessionUser.email.trim();
      const storedRole = localStorage.getItem('elephantastic_oauth_role') as UserRole | null;
      const role: UserRole =
        storedRole === 'operator' || storedRole === 'traveler' ? storedRole : 'traveler';
      const displayName =
        (sessionUser.user_metadata?.full_name as string | undefined) ||
        (sessionUser.user_metadata?.name as string | undefined) ||
        email.split('@')[0] ||
        'Traveler';

      localStorage.setItem('elephantastic_has_registered', 'true');
      localStorage.removeItem('elephantastic_oauth_role');

      const existing = allUsersRef.current.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (existing) {
        setCurrentUserId(existing.id);
        return;
      }

      const newId = `user_${Date.now()}`;
      const newUser: User = {
        id: newId,
        email,
        role,
        name: displayName,
        country: role === 'operator' ? 'Kenya' : 'United Kingdom',
        created_at: new Date().toISOString(),
      };
      setAllUsers((prev) =>
        prev.some((u) => u.email.toLowerCase() === email.toLowerCase()) ? prev : [...prev, newUser]
      );
      setCurrentUserId(newId);

      if (role === 'operator') {
        const newOp: Operator = {
          id: `op_${Date.now()}`,
          user_id: newId,
          business_name: `${displayName} Safaris & Hospitality`,
          contact_name: displayName,
          phone: '+254 700 000 000',
          email,
          categories: ['safari', 'hotel'],
          regions: ['Maasai Mara', 'Nairobi'],
          status: 'approved',
          is_profile_complete: true,
          access_expires_at: null,
          rating: 5.0,
          review_count: 0,
          created_at: new Date().toISOString(),
        };
        setOperators((prev) =>
          prev.some((op) => op.email.toLowerCase() === email.toLowerCase()) ? prev : [...prev, newOp]
        );
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncGoogleSession(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'google') {
        syncGoogleSession(session.user);
        setAuthPrompt(null);
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
        setActiveTabState('home');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logoutUser = () => {
    void supabase.auth.signOut();
    setCurrentUserId(null);
    localStorage.removeItem(`${STORAGE_PREFIX}current_user_id`);
    setActiveTab('home');
  };

  const loginUser = (email: string, role: UserRole, name: string, country: string, password?: string) => {
    let existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (password && !existing.password) {
        // save password if not previously set
        setAllUsers((prev) =>
          prev.map((u) => (u.id === existing.id ? { ...u, password } : u))
        );
      }
      setCurrentUserId(existing.id);
    } else {
      const newId = `user_${Date.now()}`;
      const newUser: User = {
        id: newId,
        email,
        role,
        name: name || (email.split('@')[0] ?? 'User'),
        country: country || (role === 'operator' ? 'Kenya' : 'United Kingdom'),
        password: password || 'safari123',
        created_at: new Date().toISOString(),
      };
      setAllUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newId);

      if (role === 'operator') {
        // Create initial pending operator shell
        const newOp: Operator = {
          id: `op_${Date.now()}`,
          user_id: newId,
          business_name: `${name} Safaris & Hospitality`,
          contact_name: name,
          phone: '+254 700 000 000',
          email,
          categories: ['safari', 'hotel'],
          regions: ['Maasai Mara', 'Nairobi'],
          status: 'approved',
          is_profile_complete: true,
          access_expires_at: null,
          rating: 5.0,
          review_count: 0,
          created_at: new Date().toISOString(),
        };
        setOperators((prev) => [...prev, newOp]);
      }
    }

    if (role === 'traveler') {
      setActiveTab('traveler-dashboard');
    } else if (role === 'operator') {
      setActiveTab('operator-dashboard');
    } else {
      setActiveTab('admin-verification');
    }
  };

  const registerUser = (data: {
    email: string;
    password?: string;
    role: UserRole;
    name: string;
    country: string;
  }): { success: boolean; message?: string } => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in with your password instead.',
      };
    }

    const newId = `user_${Date.now()}`;
    const newUser: User = {
      id: newId,
      email: trimmedEmail,
      role: data.role,
      name: data.name.trim() || (trimmedEmail.split('@')[0] ?? 'User'),
      country: data.country.trim() || (data.role === 'operator' ? 'Kenya' : 'United Kingdom'),
      password: data.password || 'safari123',
      created_at: new Date().toISOString(),
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newId);

    if (data.role === 'operator') {
      const newOp: Operator = {
        id: `op_${Date.now()}`,
        user_id: newId,
        business_name: `${newUser.name} Safaris & Hospitality`,
        contact_name: newUser.name,
        phone: '+254 700 000 000',
        email: trimmedEmail,
        categories: ['safari', 'hotel'],
        regions: ['Maasai Mara', 'Nairobi'],
        status: 'approved',
        is_profile_complete: true,
        access_expires_at: null,
        rating: 5.0,
        review_count: 0,
        created_at: new Date().toISOString(),
      };
      setOperators((prev) => [...prev, newOp]);
      setActiveTab('operator-open-requests');
    } else if (data.role === 'traveler') {
      setActiveTab('traveler-dashboard');
    } else {
      setActiveTab('admin-verification');
    }

    return { success: true };
  };

  const loginWithCredentials = (
    email: string,
    password?: string
  ): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = allUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!user) {
      return {
        success: false,
        message: 'No registered account found with this email. Please register to create an account.',
      };
    }

    if (user.password && password && user.password !== password) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your password and try again.',
      };
    }

    // Password matches or user has no password
    setCurrentUserId(user.id);

    if (user.role === 'traveler') {
      setActiveTab('traveler-dashboard');
    } else if (user.role === 'operator') {
      setActiveTab('operator-dashboard');
    } else {
      setActiveTab('admin-verification');
    }

    return { success: true };
  };

  // Traveler: Create Request
  const createTravelRequest = (data: {
    category: TravelCategory;
    title: string;
    start_date: string;
    end_date: string;
    flexible_month?: string;
    adults: number;
    children: number;
    budget: number;
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
  }): string => {
    const id = `req_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newReq: TravelRequest = {
      id,
      traveler_id: currentUser ? currentUser.id : `traveler_guest_${Date.now()}`,
      traveler_name: currentUser ? currentUser.name : 'Guest Traveler',
      traveler_country: data.traveler_country?.trim() || (currentUser ? currentUser.country : 'United Kingdom'),
      category: data.category,
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      flexible_month: data.flexible_month,
      adults: data.adults,
      children: data.children,
      budget: data.budget,
      currency: data.currency,
      budget_usd: data.currency === 'USD' ? data.budget : Math.round(data.budget / 130),
      notes: data.notes,
      safari_details: data.safari_details,
      hotel_details: data.hotel_details,
      bnb_details: data.bnb_details,
      whatsapp_number: data.whatsapp_number,
      call_number: data.call_number,
      email_address: data.email_address,
      preferred_contact_method: data.preferred_contact_method,
      preferred_contact_methods: data.preferred_contact_methods,
      slot_limit: 30, // Default 30 slots
      unlock_limit: 30, // Default 30 unlocks
      unlocks_enabled: true,
      status: 'open',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);

    // Update currentUser contact info if logged in
    if (currentUser && (data.whatsapp_number || data.call_number)) {
      const bestPhone = data.whatsapp_number || data.call_number;
      setAllUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, phone: u.phone || bestPhone } : u))
      );
    }
    return id;
  };

  // Traveler: Add more unlocks (+10, +20)
  const addRequestUnlocks = (requestId: string, additionalUnlocks: 10 | 20) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const currentLimit = req.unlock_limit || req.slot_limit || 30;
        const newLimit = currentLimit + additionalUnlocks;
        return {
          ...req,
          unlock_limit: newLimit,
          slot_limit: newLimit,
        };
      })
    );
  };

  const extendRequestSlots = (requestId: string, additionalSlots: 10 | 20) => {
    addRequestUnlocks(requestId, additionalSlots);
  };

  // Traveler: Allow or stop unlocking (switch that stops new unlocks without affecting bids or contacts already unlocked)
  const toggleRequestUnlocks = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const currentEnabled = req.unlocks_enabled !== false;
        const newEnabled = !currentEnabled;
        return {
          ...req,
          unlocks_enabled: newEnabled,
          bids_only: !newEnabled,
        };
      })
    );
  };

  // Traveler: Extend time (+3 days, +7 days)
  const extendRequestTime = (requestId: string, additionalDays: 3 | 7) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const currentExp = new Date(req.expires_at).getTime();
        const base = Math.max(currentExp, Date.now());
        const newExp = new Date(base + additionalDays * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...req,
          expires_at: newExp,
          status: req.status === 'expired' ? 'open' : req.status,
        };
      })
    );
  };

  // Traveler: Close early
  // Rule: stops new bids AND new unlocks. Confirmation text: "Operators will no longer be able to bid or unlock your contact. You can still see all bids."
  const closeRequestEarly = (requestId: string, reason?: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'closed',
              closed_reason: reason || 'Operators will no longer be able to bid or unlock your contact. You can still see all bids.',
            }
          : req
      )
    );
  };

  // Traveler: Reopen closed request
  const reopenRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const currentExp = new Date(req.expires_at).getTime();
        // Ensure request has at least 7 days from now
        const newExp =
          currentExp > Date.now() + 24 * 60 * 60 * 1000
            ? req.expires_at
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...req,
          status: 'open',
          expires_at: newExp,
          closed_reason: undefined,
        };
      })
    );
  };

  // Traveler: Share contact
  const shareContactWithOperator = (
    requestId: string,
    operatorId: string,
    contact: TravelerContact
  ) => {
    const newShare: ContactShare = {
      id: `cs_${Date.now()}`,
      request_id: requestId,
      operator_id: operatorId,
      traveler_id: currentUser ? currentUser.id : 'guest_traveler',
      traveler_contact: contact,
      shared_at: new Date().toISOString(),
    };
    setContactShares((prev) => [...prev, newShare]);

    // Update the bid status to 'contact_shared'
    setBids((prev) =>
      prev.map((b) =>
        b.request_id === requestId && b.operator_id === operatorId
          ? { ...b, status: 'contact_shared' }
          : b
      )
    );
  };

  // Traveler: Shortlist bid
  const shortlistBid = (bidId: string) => {
    setBids((prev) =>
      prev.map((b) => (b.id === bidId ? { ...b, status: 'shortlisted' } : b))
    );
  };

  // Traveler: Decline bid
  const declineBid = (bidId: string) => {
    setBids((prev) =>
      prev.map((b) => (b.id === bidId ? { ...b, status: 'declined' } : b))
    );
  };

  // Rule: "Edit request: allowed only while the request has no bids and no unlocks"
  const canEditRequest = (requestId: string): { allowed: boolean; reason?: string } => {
    const bidsCount = bids.filter((b) => b.request_id === requestId).length;
    const unlocksCount = unlocks.filter((u) => u.request_id === requestId && u.status === 'paid').length;
    if (bidsCount > 0 && unlocksCount > 0) {
      return {
        allowed: false,
        reason: `Editing is locked because this request already has ${bidsCount} ${bidsCount === 1 ? 'bid' : 'bids'} and ${unlocksCount} ${unlocksCount === 1 ? 'contact unlock' : 'contact unlocks'}.`,
      };
    }
    if (bidsCount > 0) {
      return {
        allowed: false,
        reason: `Editing is locked because this request already has ${bidsCount} ${bidsCount === 1 ? 'bid' : 'bids'} from verified operators.`,
      };
    }
    if (unlocksCount > 0) {
      return {
        allowed: false,
        reason: `Editing is locked because ${unlocksCount} ${unlocksCount === 1 ? 'operator has' : 'operators have'} unlocked your contact details.`,
      };
    }
    return { allowed: true };
  };

  // Traveler: Edit request details
  const editTravelRequest = (requestId: string, updates: Partial<TravelRequest>): boolean => {
    const check = canEditRequest(requestId);
    if (!check.allowed) {
      return false;
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, ...updates } : r))
    );
    return true;
  };

  // Traveler: Repost expired request (prefilled from old one)
  const repostRequest = (requestId: string): string => {
    const oldReq = requests.find((r) => r.id === requestId);
    if (!oldReq) return '';
    const newId = `req_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newReq: TravelRequest = {
      ...oldReq,
      id: newId,
      status: 'open',
      slot_limit: 30,
      unlock_limit: 30,
      unlocks_enabled: true,
      bids_only: false,
      is_booked: false,
      booked_operator_id: undefined,
      booked_at: undefined,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      closed_reason: undefined,
    };
    setRequests((prev) => [newReq, ...prev]);
    return newId;
  };

  // Traveler: Mark as booked or completed
  const markRequestBooked = (requestId: string, operatorId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              is_booked: true,
              booked_operator_id: operatorId,
              booked_at: new Date().toISOString(),
              status: 'closed',
              closed_reason: 'Booked with operator.',
            }
          : r
      )
    );
  };

  // In-platform Traveler Contact Unlock Notifications
  // Rule: "Notify the traveler inside the platform whenever an operator unlocks their contact. Never send bid alerts to their email or WhatsApp."
  const getTravelerUnlockNotifications = (travelerId: string): TravelerUnlockNotification[] => {
    const travelerReqs = requests.filter((r) => r.traveler_id === travelerId);
    const travelerReqIds = new Set(travelerReqs.map((r) => r.id));
    const relevantUnlocks = unlocks.filter((u) => travelerReqIds.has(u.request_id) && u.status === 'paid');

    return relevantUnlocks
      .map((u) => {
        const op = operators.find((o) => o.id === u.operator_id);
        const req = requests.find((r) => r.id === u.request_id);
        return {
          id: `notif_${u.id}`,
          request_id: u.request_id,
          request_title: req?.title || u.request_title,
          operator_id: u.operator_id,
          operator_business_name: op?.business_name || 'Verified Kenyan Operator',
          operator_phone: op?.phone,
          operator_email: op?.email,
          unlocked_at: u.paid_at || u.held_until,
          fee_ksh: u.fee_ksh,
        };
      })
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());
  };

  // Rule: "The traveler marks the request as booked or completed, then can rate and review the operator. Allow reviews only for operators who bid or unlocked on that request."
  const getEligibleReviewOperators = (requestId: string): Operator[] => {
    const operatorIds = new Set<string>();
    bids.filter((b) => b.request_id === requestId).forEach((b) => operatorIds.add(b.operator_id));
    unlocks
      .filter((u) => u.request_id === requestId && u.status === 'paid')
      .forEach((u) => operatorIds.add(u.operator_id));
    return operators.filter((op) => operatorIds.has(op.id));
  };

  // Traveler: Update Profile
  const updateTravelerProfile = (data: { name: string; country: string; phone?: string; preferred_currency?: Currency }) => {
    if (!currentUser) return;
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
  };

  // Traveler: Review operator
  const reviewOperator = (
    operatorId: string,
    requestId: string,
    rating: number,
    comment: string,
    tripType: string
  ) => {
    const newRev: Review = {
      id: `rev_${Date.now()}`,
      operator_id: operatorId,
      traveler_id: currentUser ? currentUser.id : 'guest_traveler',
      traveler_name: currentUser ? currentUser.name : 'Verified Traveler',
      traveler_country: currentUser ? currentUser.country : 'United Kingdom',
      request_id: requestId,
      rating,
      comment,
      trip_type: tripType,
      created_at: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);

    // Update operator rating and review count
    setOperators((prev) =>
      prev.map((op) => {
        if (op.id !== operatorId) return op;
        const totalReviews = op.review_count + 1;
        const newRating = +((op.rating * op.review_count + rating) / totalReviews).toFixed(1);
        return {
          ...op,
          rating: newRating,
          review_count: totalReviews,
        };
      })
    );
  };

  // Operator Profile Gate validator
  const isProfileComplete = (operator: Operator | null): boolean => {
    if (!operator) return false;
    if (operator.is_profile_complete === false) return false;
    return Boolean(
      operator.business_name && operator.business_name.trim().length > 0 &&
      operator.contact_name && operator.contact_name.trim().length > 0 &&
      operator.phone && operator.phone.trim().length > 0 &&
      operator.email && operator.email.trim().length > 0 &&
      operator.categories && operator.categories.length > 0 &&
      operator.regions && operator.regions.length > 0
    );
  };

  // Operator: Bookmarking
  const toggleBookmark = (requestId: string) => {
    if (!currentOperator) return;
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.operator_id === currentOperator.id && b.request_id === requestId);
      if (exists) {
        return prev.filter((b) => !(b.operator_id === currentOperator.id && b.request_id === requestId));
      } else {
        const newBmk: Bookmark = {
          id: `bmk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          operator_id: currentOperator.id,
          request_id: requestId,
          created_at: new Date().toISOString(),
        };
        return [newBmk, ...prev];
      }
    });
  };

  const isBookmarked = (requestId: string): boolean => {
    if (!currentOperator) return false;
    return bookmarks.some((b) => b.operator_id === currentOperator.id && b.request_id === requestId);
  };

  // Operator: Register business
  const registerOperator = (data: {
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
  }) => {
    const currentUid = currentUser?.id || `user_op_${Date.now()}`;
    let op = operators.find((o) => o.user_id === currentUid);
    if (op) {
      setOperators((prev) =>
        prev.map((o) =>
          o.user_id === currentUid
            ? {
                ...o,
                ...data,
                status: 'approved',
                is_profile_complete: true,
                rejection_reason: undefined,
              }
            : o
        )
      );
    } else {
      const newOp: Operator = {
        id: `op_${Date.now()}`,
        user_id: currentUid,
        business_name: data.business_name,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        categories: data.categories,
        regions: data.regions,
        description: data.description || '',
        licence_file_name: data.licence_file_name,
        business_registration_file_name: data.business_registration_file_name,
        licence_number: data.licence_number,
        status: 'approved',
        is_profile_complete: true,
        access_expires_at: null,
        rating: 5.0,
        review_count: 0,
        created_at: new Date().toISOString(),
      };
      setOperators((prev) => [...prev, newOp]);
    }
  };

  // Operator: Update private profile
  const updateOperatorProfile = (data: {
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
  }) => {
    const currentUid = currentUser?.id || `user_op_${Date.now()}`;
    let op = operators.find((o) => o.user_id === currentUid);
    if (op) {
      setOperators((prev) =>
        prev.map((o) =>
          o.user_id === currentUid
            ? {
                ...o,
                ...data,
                is_profile_complete: true,
                status: 'approved',
                rejection_reason: undefined,
              }
            : o
        )
      );
    } else {
      const newOp: Operator = {
        id: `op_${Date.now()}`,
        user_id: currentUid,
        business_name: data.business_name,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        categories: data.categories,
        regions: data.regions,
        description: data.description || '',
        licence_file_name: data.licence_file_name,
        business_registration_file_name: data.business_registration_file_name,
        licence_number: data.licence_number,
        status: 'approved',
        is_profile_complete: true,
        access_expires_at: null,
        rating: 5.0,
        review_count: 0,
        created_at: new Date().toISOString(),
      };
      setOperators((prev) => [...prev, newOp]);
    }
  };

  // Operator: Pay via Safaricom M-Pesa Daraja STK Push (KSH 850 24-Hour Bidding Pass)
  const submitMpesaPayment = async (
    operatorId: string,
    phoneNumber: string,
    passType: 'bidding' | 'contact_unlock' = 'bidding',
    simulateFailure?: boolean
  ): Promise<{ success: boolean; transactionId: string; message: string; notCharged?: boolean }> => {
    // Generate authentic Safaricom Daraja M-Pesa receipt code e.g. "RJK82937XJ"
    const prefix = ['QHK', 'RJK', 'SMT', 'TLP', 'UKW', 'VMN'][Math.floor(Math.random() * 6)];
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    const transactionId = `${prefix}${randomSuffix.substring(0, 7)}`;

    const targetOp = operators.find((o) => o.id === operatorId);
    if (!targetOp) {
      return { success: false, transactionId: '', message: 'Operator account not found.' };
    }

    // Profile Gate check
    if (!isProfileComplete(targetOp)) {
      return {
        success: false,
        transactionId: '',
        message: 'Profile incomplete. Please submit your business profile before paying for a pass.',
      };
    }

    const isContactUnlock = passType === 'contact_unlock';
    const amount = adminSettings.biddingPassFeeKsh || 850;
    const passTitle = '24-Hour Bidding Pass';

    // Check duplicate transaction ID rule: "Grant a pass once per confirmed transaction ID"
    const isDuplicate = payments.some(
      (p) => p.mpesa_transaction_id === transactionId && p.status === 'completed'
    );
    if (isDuplicate) {
      return {
        success: false,
        transactionId,
        message: 'Transaction ID already utilized for a previous pass.',
      };
    }

    // Handle intentional or simulated failed attempt
    if (simulateFailure) {
      const failedPaymentRec: PaymentRecord = {
        id: `pay_fail_${Date.now()}`,
        operator_id: operatorId,
        operator_business_name: targetOp.business_name,
        amount,
        pass_type: passType,
        currency: 'KSH',
        mpesa_transaction_id: transactionId,
        phone_number: phoneNumber,
        status: 'failed',
        failure_reason: 'User cancelled M-Pesa PIN prompt / STK request timeout',
        paid_at: new Date().toISOString(),
        pass_expires_at: '',
      };
      setPayments((prev) => [failedPaymentRec, ...prev]);
      return {
        success: false,
        transactionId,
        message: 'M-Pesa payment attempt was cancelled. Not charged.',
        notCharged: true,
      };
    }

    // 24-hour pass calculation from current confirmed time
    const passExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const paymentRec: PaymentRecord = {
      id: `pay_${Date.now()}`,
      operator_id: operatorId,
      operator_business_name: targetOp.business_name,
      amount,
      pass_type: passType,
      currency: 'KSH',
      mpesa_transaction_id: transactionId,
      phone_number: phoneNumber,
      status: 'completed',
      paid_at: new Date().toISOString(),
      pass_expires_at: passExpiresAt,
    };

    setPayments((prev) => [paymentRec, ...prev]);

    setOperators((prev) =>
      prev.map((op) => {
        if (op.id !== operatorId) return op;
        if (isContactUnlock) {
          return {
            ...op,
            contact_unlock_expires_at: passExpiresAt,
          };
        } else {
          return {
            ...op,
            bidding_pass_expires_at: passExpiresAt,
            access_expires_at: passExpiresAt,
          };
        }
      })
    );

    return {
      success: true,
      transactionId,
      message: `M-Pesa payment of KSH ${amount} confirmed (Ref: ${transactionId}). Your ${passTitle} is now active for 24 hours!`,
    };
  };

  // Pass History calculation from payments table and bids table
  const getPassHistory = (operatorId: string): PassHistoryItem[] => {
    const completedPayments = payments.filter(
      (p) => p.operator_id === operatorId && p.status === 'completed' && p.pass_expires_at
    );

    const operatorBids = bids.filter((b) => b.operator_id === operatorId);

    return completedPayments
      .map((payment) => {
        const startTime = new Date(payment.paid_at).getTime();
        const endTime = payment.pass_expires_at ? new Date(payment.pass_expires_at).getTime() : 0;
        const now = Date.now();

        // Bids sent is a count from the bids table between pass start and end
        const bidsInPass = operatorBids.filter((b) => {
          const bidTime = new Date(b.created_at).getTime();
          return bidTime >= startTime && bidTime <= endTime;
        }).length;

        const isActive = now >= startTime && now <= endTime;

        return {
          id: `pass_${payment.id}`,
          operator_id: operatorId,
          start: payment.paid_at,
          end: payment.pass_expires_at || '',
          bids_sent_count: bidsInPass,
          status: (isActive ? 'active' : 'expired') as 'active' | 'expired',
          mpesa_transaction_id: payment.mpesa_transaction_id,
          amount: payment.amount,
        };
      })
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  };

  // Server-side pass verification
  const verifyPassOnServer = async (
    operatorId: string
  ): Promise<{
    active: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    isEndingSoon: boolean;
    label: string;
    expiresAt: string | null;
  }> => {
    try {
      const res = await fetch('/api/pass/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Graceful local server-consistent evaluation fallback
    }

    const op = operators.find((o) => o.id === operatorId);
    if (!op || !op.access_expires_at) {
      return {
        active: false,
        hoursRemaining: 0,
        minutesRemaining: 0,
        isEndingSoon: false,
        label: 'No active pass',
        expiresAt: null,
      };
    }

    const diff = new Date(op.access_expires_at).getTime() - Date.now();
    if (diff <= 0) {
      return {
        active: false,
        hoursRemaining: 0,
        minutesRemaining: 0,
        isEndingSoon: false,
        label: 'Pass Expired',
        expiresAt: op.access_expires_at,
      };
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      active: true,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      isEndingSoon: hours <= 3,
      label: hours >= 1 ? `${hours} hours left` : `${minutes} minutes left`,
      expiresAt: op.access_expires_at,
    };
  };

  // Anti-circumvention detector (prevents phone numbers or email addresses in bids)
  const containsContactInfo = (text: string): boolean => {
    // Email regex
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    // Phone regex (e.g., +254..., 07..., 10+ digits separated by space or dash)
    const phoneRegex = /(\+?254|\b07|\b01|\b\+1|\b\+44)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
    const genericNumberSequence = /\b\d{3,4}[\s.-]\d{3,4}[\s.-]\d{3,4}\b/;
    // WhatsApp/Telegram/Call handles
    const socialBypass = /(whatsapp|call me|reach me at|tel:|phone:|wa\.me|t\.me)/i;

    return emailRegex.test(text) || phoneRegex.test(text) || genericNumberSequence.test(text) || socialBypass.test(text);
  };

  // Operator: Submit or Edit Bid / Send Follow-Up
  const submitBid = (data: {
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
  }): { success: boolean; error?: string } => {
    if (!currentOperator) {
      return { success: false, error: 'You must be logged in as an operator to bid.' };
    }

    if (!isProfileComplete(currentOperator)) {
      return { success: false, error: 'Create your profile to start bidding. Your profile is private.' };
    }

    // Check bidding pass active
    if (!isBiddingPassActive(currentOperator)) {
      return { success: false, error: 'Your 24-hour operator bidding pass has expired. Activate for KSH 850 via M-Pesa to submit quotes.' };
    }

    const targetRequest = requests.find((r) => r.id === data.request_id);
    if (!targetRequest) {
      return { success: false, error: 'Request not found.' };
    }

    // When the traveler closes the enquiry, bids and unlocks both stop.
    if (targetRequest.status === 'closed' || targetRequest.status === 'expired') {
      return { success: false, error: `This enquiry is closed. Bids can no longer be submitted or edited.` };
    }

    // Operator contact details: email, whatsapp, and call number
    const email = data.operator_email?.trim() || currentOperator.email;
    const phone = data.operator_phone?.trim() || currentOperator.phone;
    const whatsapp = data.operator_whatsapp?.trim() || currentOperator.phone;

    if (!email || !phone || !whatsapp) {
      return {
        success: false,
        error: 'Please provide all your contact details (Email, WhatsApp number, and Phone Call number).',
      };
    }

    // Check if operator already submitted a bid on this request:
    // Rule: "One bid per operator per request, which the operator can send follow-ups on while open."
    const existingBid = bids.find(
      (b) => b.request_id === data.request_id && b.operator_id === currentOperator.id
    );

    if (existingBid) {
      const trimmedFollowUp = data.follow_up_message?.trim();
      setBids((prev) =>
        prev.map((b) =>
          b.id === existingBid.id
            ? {
                ...b,
                price: data.price,
                currency: data.currency,
                inclusions: data.inclusions,
                message: data.message,
                follow_ups: trimmedFollowUp
                  ? [
                      ...(b.follow_ups || []),
                      {
                        id: `fu_${Date.now()}`,
                        message: trimmedFollowUp,
                        created_at: new Date().toISOString(),
                      },
                    ]
                  : b.follow_ups,
                valid_until: data.valid_until,
                operator_email: email,
                operator_whatsapp: whatsapp,
                operator_phone: phone,
              }
            : b
        )
      );
      return { success: true };
    }

    const newBid: Bid = {
      id: `bid_${Date.now()}`,
      request_id: data.request_id,
      operator_id: currentOperator.id,
      operator_business_name: currentOperator.business_name,
      operator_rating: currentOperator.rating,
      operator_review_count: currentOperator.review_count,
      operator_verified: true,
      price: data.price,
      currency: data.currency,
      inclusions: data.inclusions,
      message: data.message,
      valid_until: data.valid_until,
      status: 'sent',
      created_at: new Date().toISOString(),
      operator_email: email,
      operator_whatsapp: whatsapp,
      operator_phone: phone,
    };

    // There is no limit on the number of bids per request. They stay open until the traveler closes the enquiry.
    setBids((prev) => [newBid, ...prev]);
    return { success: true };
  };

  // Admin Actions
  const adminApproveOperator = (operatorId: string) => {
    setOperators((prev) =>
      prev.map((op) =>
        op.id === operatorId
          ? {
              ...op,
              status: 'approved',
              rejection_reason: undefined,
            }
          : op
      )
    );
  };

  const adminRejectOperator = (operatorId: string, reason: string) => {
    setOperators((prev) =>
      prev.map((op) =>
        op.id === operatorId
          ? {
              ...op,
              status: 'rejected',
              rejection_reason: reason,
            }
          : op
      )
    );
  };

  const adminResolveReport = (reportId: string, status: 'resolved' | 'dismissed') => {
    setReports((prev) =>
      prev.map((rep) => (rep.id === reportId ? { ...rep, status } : rep))
    );
  };

  // Reporting
  const reportTarget = (data: {
    target_type: 'operator' | 'bid' | 'request';
    target_id: string;
    target_title: string;
    reason: string;
    details: string;
  }) => {
    const newRep: FlaggedReport = {
      id: `rep_${Date.now()}`,
      reported_by_id: currentUser ? currentUser.id : 'guest',
      reported_by_name: currentUser ? currentUser.name : 'Guest User',
      target_type: data.target_type,
      target_id: data.target_id,
      target_title: data.target_title,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setReports((prev) => [newRep, ...prev]);
  };

  // Helpers
  const getSlotInfo = (requestId: string): SlotInfo => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { total: 30, used: 0, left: 30, isLocked: false };
    const used = bids.filter((b) => b.request_id === requestId).length;
    const total = req.slot_limit || 30;
    const left = Math.max(0, total - used);
    const isLocked = req.status === 'locked' || left === 0;
    return { total, used, left, isLocked };
  };

  // Bid Privacy Rule: "Operators never see each other's bids or prices."
  const getBidsForRequest = (requestId: string): Bid[] => {
    const allForReq = bids.filter((b) => b.request_id === requestId);
    if (currentUser && currentUser.role === 'operator') {
      // Operator ONLY sees their own bid on this request!
      if (!currentOperator) return [];
      return allForReq.filter((b) => b.operator_id === currentOperator.id);
    }
    // Traveler and Admin can see all bids submitted for this request
    return allForReq;
  };

  const isBiddingPassActive = (operator: Operator | null): boolean => {
    if (!operator) return false;
    const expiry = operator.bidding_pass_expires_at || operator.access_expires_at;
    if (!expiry) return false;
    return new Date(expiry).getTime() > Date.now();
  };

  const isContactPassActive = (operator: Operator | null): boolean => {
    if (!operator || !operator.contact_unlock_expires_at) return false;
    return new Date(operator.contact_unlock_expires_at).getTime() > Date.now();
  };

  const isPassActive = (operator: Operator | null): boolean => {
    return isBiddingPassActive(operator);
  };

  const getPassTimeRemaining = (operator: Operator | null): { active: boolean; label: string; hoursLeft: number } => {
    const res = getBiddingPassTimeRemaining(operator);
    return { active: res.active, label: res.label, hoursLeft: res.hoursLeft };
  };

  const getBiddingPassTimeRemaining = (operator: Operator | null): { active: boolean; label: string; hoursLeft: number; expiresAt: string | null } => {
    if (!operator) return { active: false, label: 'No active pass', hoursLeft: 0, expiresAt: null };
    const expiry = operator.bidding_pass_expires_at || operator.access_expires_at;
    if (!expiry) {
      return { active: false, label: 'No active pass', hoursLeft: 0, expiresAt: null };
    }
    const diff = new Date(expiry).getTime() - Date.now();
    if (diff <= 0) {
      return { active: false, label: 'Pass Expired', hoursLeft: 0, expiresAt: expiry };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      active: true,
      label: `${hours}h ${minutes}m left`,
      hoursLeft: hours,
      expiresAt: expiry,
    };
  };

  const getContactPassTimeRemaining = (operator: Operator | null): { active: boolean; label: string; hoursLeft: number; expiresAt: string | null } => {
    if (!operator || !operator.contact_unlock_expires_at) {
      return { active: false, label: 'No active unlock pass', hoursLeft: 0, expiresAt: null };
    }
    const diff = new Date(operator.contact_unlock_expires_at).getTime() - Date.now();
    if (diff <= 0) {
      return { active: false, label: 'Pass Expired', hoursLeft: 0, expiresAt: operator.contact_unlock_expires_at };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      active: true,
      label: `${hours}h ${minutes}m left`,
      hoursLeft: hours,
      expiresAt: operator.contact_unlock_expires_at,
    };
  };

  const getContactShare = (requestId: string, operatorId: string): ContactShare | undefined => {
    return contactShares.find(
      (cs) => cs.request_id === requestId && cs.operator_id === operatorId
    );
  };

  const createBlogPost = (data: Omit<BlogPost, 'id' | 'slug' | 'published_at'>): string => {
    const id = `blog_${Date.now()}`;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const newPost: BlogPost = {
      ...data,
      id,
      slug: slug || `kenya-guide-${Date.now()}`,
      published_at: new Date().toISOString(),
    };
    setBlogPosts((prev) => [newPost, ...prev]);
    return newPost.slug;
  };

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
    return blogPosts.find((p) => p.slug === slug || p.id === slug);
  };

  // Pricing calculation by traveler total budget (converted to USD at fixed admin rate)
  const calculateUnlockFee = (request: TravelRequest): { feeKsh: number; tierLabel: string } => {
    let budgetUsd = request.budget_usd || request.budget;
    if (!request.budget_usd) {
      if (request.currency === 'KSH') {
        budgetUsd = request.budget / (adminSettings.exchangeRateKshPerUsd || 130);
      } else if (request.currency === 'EUR') {
        budgetUsd = request.budget * 1.08;
      } else if (request.currency === 'GBP') {
        budgetUsd = request.budget * 1.25;
      }
    }

    if (budgetUsd < 2000) return { feeKsh: 120, tierLabel: 'Under USD 2,000: KSH 120' };
    if (budgetUsd < 5000) return { feeKsh: 300, tierLabel: 'USD 2,000 to 4,999: KSH 300' };
    if (budgetUsd < 10000) return { feeKsh: 600, tierLabel: 'USD 5,000 to 9,999: KSH 600' };
    if (budgetUsd < 20000) return { feeKsh: 1200, tierLabel: 'USD 10,000 to 19,999: KSH 1,200' };
    if (budgetUsd < 50000) return { feeKsh: 2500, tierLabel: 'USD 20,000 to 49,999: KSH 2,500' };
    return { feeKsh: 5000, tierLabel: 'USD 50,000 and above: KSH 5,000' };
  };

  const getListingUnlockInfo = (requestId: string): { paidCount: number; remaining: number; isFull: boolean; total: number; bidsOnly: boolean } => {
    const paidCount = unlocks.filter((u) => u.request_id === requestId && u.status === 'paid').length;
    const targetReq = requests.find((r) => r.id === requestId);
    const total = targetReq?.unlock_limit || targetReq?.slot_limit || adminSettings.maxUnlocksPerListing || 30;
    const remaining = Math.max(0, total - paidCount);
    const bidsOnly = Boolean(targetReq?.bids_only || targetReq?.unlocks_enabled === false);
    return {
      paidCount,
      remaining,
      isFull: paidCount >= total,
      total,
      bidsOnly,
    };
  };

  const isContactUnlocked = (requestId: string, operatorId: string): boolean => {
    return unlocks.some(
      (u) => u.request_id === requestId && u.operator_id === operatorId && u.status === 'paid'
    );
  };

  const getUnlockedContact = (requestId: string, operatorId: string): TravelerContact | undefined => {
    const unlock = unlocks.find(
      (u) => u.request_id === requestId && u.operator_id === operatorId && u.status === 'paid'
    );
    if (unlock?.traveler_contact) return unlock.traveler_contact;
    const targetReq = requests.find((r) => r.id === requestId);
    if (targetReq && isContactUnlocked(requestId, operatorId)) {
      return {
        name: targetReq.traveler_name,
        email: targetReq.email_address || 'traveler@safari-stays.com',
        phone: targetReq.call_number || targetReq.whatsapp_number || '+254700000000',
        whatsapp: targetReq.whatsapp_number || targetReq.call_number || '+254700000000',
        preferred_channel:
          (targetReq.preferred_contact_methods?.length
            ? targetReq.preferred_contact_methods.join(', ')
            : targetReq.preferred_contact_method) || 'whatsapp',
      };
    }
    return undefined;
  };

  const startUnlockHold = async (
    requestId: string,
    operatorId: string
  ): Promise<{ success: boolean; holdId?: string; feeKsh?: number; error?: string; heldUntil?: string }> => {
    const targetReq = requests.find((r) => r.id === requestId);
    const targetOp = operators.find((o) => o.id === operatorId);

    if (!isProfileComplete(targetOp || null)) {
      return {
        success: false,
        error: 'Create your profile to start unlocking contacts. Your profile is private.',
      };
    }

    if (targetReq?.status === 'closed' || targetReq?.status === 'expired') {
      return { success: false, error: 'This enquiry is closed. Bids and unlocks are stopped.' };
    }

    if (targetReq?.bids_only) {
      return { success: false, error: 'This listing is marked as Bids only. Unlocking is disabled.' };
    }

    const budgetUsd = targetReq?.currency === 'USD' ? targetReq.budget : (targetReq?.budget || 2000) / adminSettings.exchangeRateKshPerUsd;

    try {
      const res = await fetch('/api/unlock/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          request_id: requestId,
          budget_usd: budgetUsd,
          request_status: targetReq?.status || 'open',
          bids_only: targetReq?.bids_only || false,
          is_profile_complete: isProfileComplete(targetOp || null),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || 'Slot hold failed' };
      }
      return {
        success: true,
        holdId: data.hold_id,
        feeKsh: data.fee_ksh,
        heldUntil: data.held_until,
      };
    } catch {
      const { feeKsh } = targetReq ? calculateUnlockFee(targetReq) : { feeKsh: 300 };
      return {
        success: true,
        holdId: `hld_${Date.now()}`,
        feeKsh,
        heldUntil: new Date(Date.now() + 120 * 1000).toISOString(),
      };
    }
  };

  const cancelUnlockHold = async (holdId: string, operatorId: string, reason?: string) => {
    try {
      await fetch('/api/unlock/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hold_id: holdId, operator_id: operatorId, reason }),
      });
    } catch {
      // ignore
    }
  };

  const confirmUnlockPayment = async (data: {
    holdId?: string;
    requestId: string;
    operatorId: string;
    phoneNumber: string;
    simulateFailure?: boolean;
    simulateLatePaymentFull?: boolean;
    requestTitle?: string;
    requestCategory?: TravelCategory;
  }): Promise<{ success: boolean; message: string; refunded?: boolean; notCharged?: boolean; unlock?: ContactUnlockRecord }> => {
    const targetReq = requests.find((r) => r.id === data.requestId);
    const targetOp = operators.find((o) => o.id === data.operatorId);
    const budgetUsd = targetReq?.currency === 'USD' ? targetReq.budget : (targetReq?.budget || 2000) / adminSettings.exchangeRateKshPerUsd;
    const { feeKsh, tierLabel } = targetReq ? calculateUnlockFee(targetReq) : { feeKsh: 300, tierLabel: 'USD 2,000 to 4,999: KSH 300' };

    try {
      const res = await fetch('/api/unlock/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hold_id: data.holdId,
          request_id: data.requestId,
          operator_id: data.operatorId,
          phone_number: data.phoneNumber,
          request_title: data.requestTitle || targetReq?.title || 'Travel Request',
          request_category: data.requestCategory || targetReq?.category || 'safari',
          budget_usd: budgetUsd,
          simulate_failure: data.simulateFailure,
          simulate_late_payment_full: data.simulateLatePaymentFull,
        }),
      });
      const result = await res.json();

      if (result.notCharged || data.simulateFailure) {
        const failedPayment: PaymentRecord = {
          id: `pay_fail_${Date.now()}`,
          operator_id: data.operatorId,
          operator_business_name: targetOp?.business_name,
          type: 'unlock',
          request_id: data.requestId,
          request_title: targetReq?.title || 'Unlock contact',
          amount_ksh: feeKsh,
          amount: feeKsh,
          currency: 'KSH',
          mpesa_transaction_id: result.transactionId || `FLX${Date.now()}`,
          phone_number: data.phoneNumber,
          status: 'failed',
          failure_reason: result.failureReason || 'User cancelled M-Pesa PIN prompt or request timed out',
          paid_at: new Date().toISOString(),
          pass_expires_at: null,
        };
        setPayments((prev) => [failedPayment, ...prev]);
        return {
          success: false,
          notCharged: true,
          message: result.message || 'M-Pesa payment attempt was cancelled. Not charged.',
        };
      }

      if (result.refunded || data.simulateLatePaymentFull) {
        const refundPayment: PaymentRecord = {
          id: `pay_ref_${Date.now()}`,
          operator_id: data.operatorId,
          operator_business_name: targetOp?.business_name,
          type: 'unlock',
          request_id: data.requestId,
          request_title: targetReq?.title || 'Unlock contact',
          amount_ksh: feeKsh,
          amount: feeKsh,
          currency: 'KSH',
          mpesa_transaction_id: result.transactionId || `REF${Date.now()}`,
          phone_number: data.phoneNumber,
          status: 'failed',
          failure_reason: 'Slot filled before payment confirmed. Automatic M-Pesa refund processed.',
          paid_at: new Date().toISOString(),
          pass_expires_at: null,
        };
        setPayments((prev) => [refundPayment, ...prev]);
        return {
          success: false,
          refunded: true,
          message: result.message || 'Payment confirmed after hold expired and listing is full. KSH ' + feeKsh + ' refunded automatically.',
        };
      }

      if (result.success) {
        const travelerContact: TravelerContact = {
          name: targetReq?.traveler_name || 'Traveler',
          email: targetReq?.email_address || 'traveler@safari-stays.com',
          phone: targetReq?.call_number || targetReq?.whatsapp_number || '+254700000000',
          whatsapp: targetReq?.whatsapp_number || targetReq?.call_number || '+254700000000',
          preferred_channel:
            (targetReq?.preferred_contact_methods?.length
              ? targetReq.preferred_contact_methods.join(', ')
              : targetReq?.preferred_contact_method) || 'whatsapp',
        };

        const newUnlock: ContactUnlockRecord = {
          id: result.unlock?.id || `unl_${Date.now()}`,
          request_id: data.requestId,
          operator_id: data.operatorId,
          tier: tierLabel,
          fee_ksh: feeKsh,
          status: 'paid',
          held_until: new Date().toISOString(),
          paid_at: result.paid_at || new Date().toISOString(),
          request_title: targetReq?.title || 'Travel Request',
          request_category: targetReq?.category || 'safari',
          traveler_country: targetReq?.traveler_country,
          traveler_contact: travelerContact,
          mpesa_transaction_id: result.transactionId,
        };

        const newPayment: PaymentRecord = {
          id: `pay_${Date.now()}`,
          operator_id: data.operatorId,
          operator_business_name: targetOp?.business_name,
          type: 'unlock',
          request_id: data.requestId,
          request_title: targetReq?.title || 'Contact Unlock',
          amount_ksh: feeKsh,
          amount: feeKsh,
          currency: 'KSH',
          mpesa_transaction_id: result.transactionId,
          phone_number: data.phoneNumber,
          status: 'completed',
          paid_at: new Date().toISOString(),
          pass_expires_at: null,
        };

        setUnlocks((prev) => [newUnlock, ...prev]);
        setPayments((prev) => [newPayment, ...prev]);

        return {
          success: true,
          message: result.message || `M-Pesa payment of KSH ${feeKsh} confirmed (${result.transactionId}). Contact unlocked!`,
          unlock: newUnlock,
        };
      }

      return { success: false, message: result.message || 'Payment failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Payment processing error' };
    }
  };

  const payBiddingPass = async (
    operatorId: string,
    phoneNumber: string,
    simulateFailure?: boolean
  ): Promise<{ success: boolean; message: string; notCharged?: boolean }> => {
    const targetOp = operators.find((o) => o.id === operatorId);
    const amount = adminSettings.biddingPassFeeKsh || 850;

    if (!isProfileComplete(targetOp || null)) {
      return {
        success: false,
        message: 'Create your profile to start bidding. Your profile is private.',
      };
    }

    try {
      const res = await fetch('/api/pass/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          phone_number: phoneNumber,
          simulate_failure: simulateFailure,
          is_profile_complete: isProfileComplete(targetOp || null),
        }),
      });
      const result = await res.json();

      if (result.notCharged || !result.success) {
        if (result.notCharged) {
          const failedPay: PaymentRecord = {
            id: `pay_fail_${Date.now()}`,
            operator_id: operatorId,
            operator_business_name: targetOp?.business_name,
            type: 'pass',
            request_id: null,
            request_title: '24-hour pass',
            amount_ksh: amount,
            amount: amount,
            currency: 'KSH',
            mpesa_transaction_id: result.transactionId || `FLX${Date.now()}`,
            phone_number: phoneNumber,
            status: 'failed',
            failure_reason: result.failureReason || 'User cancelled M-Pesa PIN prompt or request timed out',
            paid_at: new Date().toISOString(),
            pass_expires_at: null,
          };
          setPayments((prev) => [failedPay, ...prev]);
        }
        return {
          success: false,
          notCharged: Boolean(result.notCharged),
          message: result.message || 'M-Pesa payment attempt was cancelled. Not charged.',
        };
      }

      const passExpiresAt = result.passExpiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const newPayment: PaymentRecord = {
        id: `pay_${Date.now()}`,
        operator_id: operatorId,
        operator_business_name: targetOp?.business_name,
        type: 'pass',
        request_id: null,
        request_title: '24-hour pass',
        amount_ksh: amount,
        amount: amount,
        currency: 'KSH',
        mpesa_transaction_id: result.transactionId,
        phone_number: phoneNumber,
        status: 'completed',
        paid_at: new Date().toISOString(),
        pass_expires_at: passExpiresAt,
      };

      setPayments((prev) => [newPayment, ...prev]);
      setOperators((prev) =>
        prev.map((op) =>
          op.id === operatorId
            ? {
                ...op,
                access_expires_at: passExpiresAt,
                bidding_pass_expires_at: passExpiresAt,
              }
            : op
        )
      );

      return {
        success: true,
        message: result.message || `M-Pesa payment of KSH ${amount} confirmed (${result.transactionId}). 24-hour bidding pass active.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Pass payment failed' };
    }
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_PREFIX}users`);
    localStorage.removeItem(`${STORAGE_PREFIX}current_user_id`);
    localStorage.removeItem(`${STORAGE_PREFIX}operators`);
    localStorage.removeItem(`${STORAGE_PREFIX}requests`);
    localStorage.removeItem(`${STORAGE_PREFIX}bids`);
    localStorage.removeItem(`${STORAGE_PREFIX}contact_shares`);
    localStorage.removeItem(`${STORAGE_PREFIX}payments`);
    localStorage.removeItem(`${STORAGE_PREFIX}reviews`);
    localStorage.removeItem(`${STORAGE_PREFIX}reports`);
    localStorage.removeItem(`${STORAGE_PREFIX}blog_posts`);
    localStorage.removeItem(`${STORAGE_PREFIX}blog_posts_v2`);
    localStorage.removeItem(`${STORAGE_PREFIX}blog_posts_v3`);
    localStorage.removeItem(`${STORAGE_PREFIX}blog_posts_v4`);
    localStorage.removeItem(`${STORAGE_PREFIX}bookmarks`);
    localStorage.removeItem(`${STORAGE_PREFIX}unlocks`);
    localStorage.removeItem(`${STORAGE_PREFIX}admin_settings`);
    setAllUsers(SEED_USERS);
    setCurrentUserId('user_traveler_1');
    setOperators(SEED_OPERATORS);
    setRequests(SEED_REQUESTS);
    setBids(SEED_BIDS);
    setContactShares(SEED_CONTACT_SHARES);
    setPayments(SEED_PAYMENTS);
    setReviews(SEED_REVIEWS);
    setReports(SEED_REPORTS);
    setBlogPosts(SEED_BLOG_POSTS);
    setBookmarks(SEED_BOOKMARKS);
    setUnlocks(SEED_UNLOCKS);
    setAdminSettings(SEED_ADMIN_SETTINGS);
    setActiveTab('home');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentOperator,
        allUsers,
        operators,
        requests,
        bids,
        contactShares,
        payments,
        reviews,
        reports,
        blogPosts,
        bookmarks,
        unlocks,
        adminSettings,
        updateAdminSettings,
        toggleBookmark,
        isBookmarked,
        createBlogPost,
        deleteBlogPost,
        getBlogPostBySlug,
        activeTab,
        setActiveTab,
        tabParam,
        switchUser,
        loginUser,
        registerUser,
        loginWithCredentials,
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
        getTravelerUnlockNotifications,
        getEligibleReviewOperators,
        updateTravelerProfile,
        registerOperator,
        updateOperatorProfile,
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
        startUnlockHold,
        cancelUnlockHold,
        confirmUnlockPayment,
        payBiddingPass,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
