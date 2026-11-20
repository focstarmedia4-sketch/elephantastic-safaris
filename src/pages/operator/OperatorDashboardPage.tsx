import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelRequest, TravelCategory, Currency, TravelerContact, Bid } from '../../types';
import {
  ShieldCheck,
  Clock,
  Bookmark as BookmarkIcon,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Lock,
  ArrowUpRight,
  FileText,
  Upload,
  EyeOff,
  Building2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Info,
  Phone,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

export const OperatorDashboardPage: React.FC = () => {
  const {
    currentUser,
    currentOperator,
    requests,
    payments,
    bids,
    bookmarks,
    unlocks,
    adminSettings,
    toggleBookmark,
    isBookmarked,
    isProfileComplete,
    updateOperatorProfile,
    payBiddingPass,
    getPassHistory,
    verifyPassOnServer,
    calculateUnlockFee,
    getListingUnlockInfo,
    isContactUnlocked,
    getUnlockedContact,
    startUnlockHold,
    cancelUnlockHold,
    confirmUnlockPayment,
    submitBid,
    setActiveTab,
  } = useApp();

  // Active History Tab: 'payments' | 'passes' | 'unlocks'
  const [historyTab, setHistoryTab] = useState<'payments' | 'passes' | 'unlocks'>('payments');

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Payment Pass modal state
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(currentOperator?.phone || '0722456789');
  const [isProcessingPass, setIsProcessingPass] = useState(false);
  const [passModalError, setPassModalError] = useState('');
  const [passModalNotice, setPassModalNotice] = useState('');

  // Unlock Contact modal state
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedUnlockRequest, setSelectedUnlockRequest] = useState<TravelRequest | null>(null);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(120);
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const [unlockModalError, setUnlockModalError] = useState('');
  const [unlockModalSuccess, setUnlockModalSuccess] = useState('');
  const [unlockModalRefundNotice, setUnlockModalRefundNotice] = useState('');

  // View Unlocked Contact modal state
  const [contactViewModalOpen, setContactViewModalOpen] = useState(false);
  const [contactViewData, setContactViewData] = useState<{
    request: TravelRequest | null;
    contact: TravelerContact | null;
    feePaid?: number;
    unlockedAt?: string;
  }>({ request: null, contact: null });

  // Place / Edit Bid modal state
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedBidRequest, setSelectedBidRequest] = useState<TravelRequest | null>(null);
  const [existingBidToEdit, setExistingBidToEdit] = useState<Bid | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(3500);
  const [bidCurrency, setBidCurrency] = useState<Currency>('USD');
  const [bidValidity, setBidValidity] = useState<string>('2026-12-31');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [bidInclusions, setBidInclusions] = useState<string[]>([]);
  const [newInclusionText, setNewInclusionText] = useState<string>('');
  const [bidEmail, setBidEmail] = useState<string>('');
  const [bidPhone, setBidPhone] = useState<string>('');
  const [bidWhatsApp, setBidWhatsApp] = useState<string>('');
  const [bidModalError, setBidModalError] = useState<string>('');
  const [bidModalSuccess, setBidModalSuccess] = useState<string>('');

  // Server-verified pass state
  const [serverPassInfo, setServerPassInfo] = useState<{
    active: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    isEndingSoon: boolean;
    label: string;
    expiresAt: string | null;
  }>({
    active: false,
    hoursRemaining: 0,
    minutesRemaining: 0,
    isEndingSoon: false,
    label: 'Checking pass status...',
    expiresAt: null,
  });

  // Check pass with server on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const checkServerPass = async () => {
      if (currentOperator) {
        const info = await verifyPassOnServer(currentOperator.id);
        if (isMounted) {
          setServerPassInfo(info);
        }
      }
    };

    checkServerPass();
    const interval = setInterval(checkServerPass, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentOperator, payments, verifyPassOnServer]);

  // Hold Countdown Timer effect when Unlock Modal is open with active hold
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (unlockModalOpen && activeHoldId && holdSecondsRemaining > 0) {
      timer = setInterval(() => {
        setHoldSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [unlockModalOpen, activeHoldId, holdSecondsRemaining]);

  // Profile Gate verification check
  const profileIsComplete = isProfileComplete(currentOperator);

  // Profile Form state
  const [businessName, setBusinessName] = useState(currentOperator?.business_name || '');
  const [contactName, setContactName] = useState(currentOperator?.contact_name || currentUser?.name || '');
  const [phone, setPhone] = useState(currentOperator?.phone || '');
  const [email, setEmail] = useState(currentOperator?.email || currentUser?.email || '');
  const [categories, setCategories] = useState<TravelCategory[]>(currentOperator?.categories || ['safari']);
  const [regions, setRegions] = useState<string[]>(
    currentOperator?.regions || ['Maasai Mara', 'Nairobi']
  );
  const [description, setDescription] = useState(currentOperator?.description || '');
  const [licenceNumber, setLicenceNumber] = useState(currentOperator?.licence_number || '');
  const [licenceFileName, setLicenceFileName] = useState(
    currentOperator?.licence_file_name || 'TRA_Class_A_Licence.pdf'
  );
  const [businessRegFileName, setBusinessRegFileName] = useState(
    currentOperator?.business_registration_file_name || 'BRS_Cert_Registration.pdf'
  );

  // Sync profile form when currentOperator changes
  useEffect(() => {
    if (currentOperator) {
      setBusinessName(currentOperator.business_name || '');
      setContactName(currentOperator.contact_name || currentUser?.name || '');
      setPhone(currentOperator.phone || '');
      setEmail(currentOperator.email || currentUser?.email || '');
      setCategories(currentOperator.categories || ['safari']);
      setRegions(currentOperator.regions || ['Maasai Mara', 'Nairobi']);
      setDescription(currentOperator.description || '');
      setLicenceNumber(currentOperator.licence_number || '');
      setLicenceFileName(currentOperator.licence_file_name || 'TRA_Class_A_Licence.pdf');
      setBusinessRegFileName(currentOperator.business_registration_file_name || 'BRS_Cert_Registration.pdf');
      setMpesaPhone(currentOperator.phone || '0722456789');
    }
  }, [currentOperator, currentUser]);

  // Summary Metrics
  const bookmarkedRequests = useMemo(() => {
    if (!currentOperator) return [];
    const operatorBmks = bookmarks.filter((b) => b.operator_id === currentOperator.id);
    const bmkIds = new Set(operatorBmks.map((b) => b.request_id));
    return requests.filter((r) => bmkIds.has(r.id));
  }, [currentOperator, bookmarks, requests]);

  const operatorPayments = useMemo(() => {
    if (!currentOperator) return [];
    return payments
      .filter((p) => p.operator_id === currentOperator.id)
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }, [currentOperator, payments]);

  const operatorUnlocks = useMemo(() => {
    if (!currentOperator) return [];
    return unlocks
      .filter((u) => u.operator_id === currentOperator.id && u.status === 'paid')
      .sort((a, b) => new Date(b.paid_at || '').getTime() - new Date(a.paid_at || '').getTime());
  }, [currentOperator, unlocks]);

  const completedPassPayments = useMemo(() => {
    return operatorPayments.filter((p) => (p.type === 'pass' || !p.type) && p.status === 'completed');
  }, [operatorPayments]);

  const completedUnlockPayments = useMemo(() => {
    return operatorPayments.filter((p) => p.type === 'unlock' && p.status === 'completed');
  }, [operatorPayments]);

  const totalSpentKsh = useMemo(() => {
    const passSum = completedPassPayments.reduce((sum, p) => sum + (p.amount_ksh || p.amount || 0), 0);
    const unlockSum = completedUnlockPayments.reduce((sum, p) => sum + (p.amount_ksh || p.amount || 0), 0);
    return passSum + unlockSum;
  }, [completedPassPayments, completedUnlockPayments]);

  const passHistory = useMemo(() => {
    if (!currentOperator) return [];
    return getPassHistory(currentOperator.id);
  }, [currentOperator, getPassHistory, payments, bids]);

  // Pass progress calculation (24 hours max)
  const passHoursRemaining = serverPassInfo.hoursRemaining;
  const passMinutesRemaining = serverPassInfo.minutesRemaining;
  const passActive = serverPassInfo.active;
  const passEndingSoon = serverPassInfo.isEndingSoon;

  const totalRemainingMinutes = passHoursRemaining * 60 + passMinutesRemaining;
  const progressPercent = Math.min(100, Math.max(0, (totalRemainingMinutes / (24 * 60)) * 100));

  // Profile Form helpers
  const toggleCategory = (cat: TravelCategory) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const toggleRegion = (reg: string) => {
    if (regions.includes(reg)) {
      if (regions.length > 1) {
        setRegions(regions.filter((r) => r !== reg));
      }
    } else {
      setRegions([...regions, reg]);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOperatorProfile({
      business_name: businessName,
      contact_name: contactName,
      phone,
      email,
      categories,
      regions,
      description,
      licence_number: licenceNumber,
      licence_file_name: licenceFileName,
      business_registration_file_name: businessRegFileName,
    });

    setProfileSuccessMsg('Profile updated and saved privately. You can now bid and unlock contacts.');
    setTimeout(() => {
      setProfileModalOpen(false);
      setProfileSuccessMsg('');
    }, 1200);
  };

  // Pay Bidding Pass (KSH 850 by M-Pesa for 24 hours)
  const handlePayBiddingPass = async (simulateFailure = false) => {
    if (!currentOperator) return;
    setIsProcessingPass(true);
    setPassModalError('');
    setPassModalNotice('');

    try {
      const result = await payBiddingPass(currentOperator.id, mpesaPhone, simulateFailure);
      if (result.success) {
        setPassModalNotice(result.message);
        setTimeout(() => {
          setPassModalOpen(false);
          setIsProcessingPass(false);
          setPassModalNotice('');
        }, 1500);
      } else {
        setIsProcessingPass(false);
        setPassModalError(result.message || 'Payment prompt cancelled. Not charged.');
      }
    } catch (err: any) {
      setIsProcessingPass(false);
      setPassModalError(err.message || 'Payment failed.');
    }
  };

  // Start Unlock Flow: Hold slot for 2 minutes and open modal
  const handleInitiateUnlock = async (request: TravelRequest) => {
    if (!currentOperator) return;
    if (!profileIsComplete) {
      setProfileModalOpen(true);
      return;
    }

    setSelectedUnlockRequest(request);
    setUnlockModalError('');
    setUnlockModalSuccess('');
    setUnlockModalRefundNotice('');
    setIsProcessingUnlock(false);
    setHoldSecondsRemaining(120);
    setUnlockModalOpen(true);

    const holdResult = await startUnlockHold(request.id, currentOperator.id);
    if (holdResult.success && holdResult.holdId) {
      setActiveHoldId(holdResult.holdId);
    } else {
      setUnlockModalError(holdResult.error || 'Failed to hold slot. It may be full or closed.');
    }
  };

  // Confirm Unlock Payment (M-Pesa STK)
  const handleConfirmUnlockPayment = async (options?: { simulateFailure?: boolean; simulateLatePaymentFull?: boolean }) => {
    if (!currentOperator || !selectedUnlockRequest) return;
    setIsProcessingUnlock(true);
    setUnlockModalError('');
    setUnlockModalSuccess('');
    setUnlockModalRefundNotice('');

    try {
      const res = await confirmUnlockPayment({
        holdId: activeHoldId || undefined,
        requestId: selectedUnlockRequest.id,
        operatorId: currentOperator.id,
        phoneNumber: mpesaPhone,
        requestTitle: selectedUnlockRequest.title,
        requestCategory: selectedUnlockRequest.category,
        simulateFailure: options?.simulateFailure,
        simulateLatePaymentFull: options?.simulateLatePaymentFull,
      });

      setIsProcessingUnlock(false);

      if (res.notCharged) {
        setUnlockModalError(res.message);
        setActiveHoldId(null);
      } else if (res.refunded) {
        setUnlockModalRefundNotice(res.message);
        setActiveHoldId(null);
      } else if (res.success) {
        setUnlockModalSuccess(res.message);
        setActiveHoldId(null);
        setTimeout(() => {
          setUnlockModalOpen(false);
          setUnlockModalSuccess('');
          // Automatically show unlocked contact details
          const contact = getUnlockedContact(selectedUnlockRequest.id, currentOperator.id);
          setContactViewData({
            request: selectedUnlockRequest,
            contact: contact || null,
            feePaid: calculateUnlockFee(selectedUnlockRequest).feeKsh,
            unlockedAt: new Date().toISOString(),
          });
          setContactViewModalOpen(true);
        }, 1200);
      } else {
        setUnlockModalError(res.message);
      }
    } catch (err: any) {
      setIsProcessingUnlock(false);
      setUnlockModalError(err.message || 'Payment processing error');
    }
  };

  // Cancel / Close Unlock Modal
  const handleCloseUnlockModal = async () => {
    if (activeHoldId && currentOperator) {
      await cancelUnlockHold(activeHoldId, currentOperator.id, 'Operator dismissed unlock modal. Not charged.');
    }
    setActiveHoldId(null);
    setUnlockModalOpen(false);
    setSelectedUnlockRequest(null);
  };

  // Open View Contact Modal
  const handleViewContact = (request: TravelRequest) => {
    if (!currentOperator) return;
    const contact = getUnlockedContact(request.id, currentOperator.id);
    const unlockRecord = unlocks.find((u) => u.request_id === request.id && u.operator_id === currentOperator.id && u.status === 'paid');
    setContactViewData({
      request,
      contact: contact || null,
      feePaid: unlockRecord?.fee_ksh || calculateUnlockFee(request).feeKsh,
      unlockedAt: unlockRecord?.paid_at || undefined,
    });
    setContactViewModalOpen(true);
  };

  // Open Place / Edit Bid Modal
  const handleOpenBidModal = (request: TravelRequest) => {
    if (!currentOperator) return;
    if (!profileIsComplete) {
      setProfileModalOpen(true);
      return;
    }
    if (!passActive) {
      setPassModalOpen(true);
      return;
    }

    setSelectedBidRequest(request);
    const existing = bids.find((b) => b.request_id === request.id && b.operator_id === currentOperator.id);
    setExistingBidToEdit(existing || null);

    if (existing) {
      setBidPrice(existing.price);
      setBidCurrency(existing.currency);
      setBidValidity(existing.valid_until);
      setBidMessage(existing.message);
      setBidInclusions(existing.inclusions);
      setBidEmail(existing.operator_email || currentOperator.email);
      setBidPhone(existing.operator_phone || currentOperator.phone);
      setBidWhatsApp(existing.operator_whatsapp || currentOperator.phone);
    } else {
      setBidPrice(request.budget || 3500);
      setBidCurrency(request.currency || 'USD');
      setBidValidity(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
      setBidMessage(`Jambo! ${currentOperator.business_name} would be delighted to host your safari. We offer customized 4x4 Land Cruisers with certified naturalist guides and full AMREF medical cover.`);
      setBidInclusions([
        'Customized 4x4 Land Cruiser with pop-up roof & inverter',
        'Certified KPSGA professional safari naturalist guide',
        'All national park & conservation entry fees',
        'Complimentary airport pickup & transfer in Nairobi',
        'Bottled drinking water & emergency evacuation cover',
      ]);
      setBidEmail(currentOperator.email);
      setBidPhone(currentOperator.phone);
      setBidWhatsApp(currentOperator.phone);
    }

    setBidModalError('');
    setBidModalSuccess('');
    setBidModalOpen(true);
  };

  // Submit Bid Handler
  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidRequest || !currentOperator) return;
    setBidModalError('');

    const res = submitBid({
      request_id: selectedBidRequest.id,
      price: Number(bidPrice),
      currency: bidCurrency,
      inclusions: bidInclusions,
      message: bidMessage,
      valid_until: bidValidity,
      operator_email: bidEmail,
      operator_whatsapp: bidWhatsApp,
      operator_phone: bidPhone,
    });

    if (res.success) {
      setBidModalSuccess(existingBidToEdit ? 'Bid updated successfully.' : 'Bid submitted successfully.');
      setTimeout(() => {
        setBidModalOpen(false);
        setBidModalSuccess('');
      }, 1000);
    } else {
      setBidModalError(res.error || 'Failed to submit quote.');
    }
  };

  // Scroll smoothly to bookmarked requests
  const scrollToBookmarks = () => {
    const el = document.getElementById('bookmarked-requests-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F6F4EE] min-h-screen text-[#22332B] font-body pb-20">
      {/* Top Header Breadcrumb & Identity */}
      <div className="border-b border-[#E2DED3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1">
                <span>Elephantastic Safaris</span>
                <span aria-hidden="true">&middot;</span>
                <span className="text-[#1E5B43] font-semibold">Operator Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E5B43] font-heading">
                {currentOperator?.business_name || 'Operator Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E2DED3] bg-white text-[#22332B] hover:bg-stone-50 transition-colors min-h-[44px]"
              >
                <Building2 className="w-4 h-4 mr-2 text-[#1E5B43]" />
                <span>Operator Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('operator-open-requests')}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1E5B43] hover:bg-[#164634] text-white transition-colors min-h-[44px]"
              >
                <Search className="w-4 h-4 mr-2" />
                <span>Browse Requests</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Profile Gate Banner (Rule: If incomplete, show banner and disable every Pay, Bid and Unlock button) */}
        {!profileIsComplete && (
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 font-heading">
                  Create your profile to start bidding. Your profile is private.
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your profile details are visible only to you and administrators. Complete business details to enable bidding passes and contact unlocks.
                </p>
              </div>
            </div>
            <button
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-amber-900 text-amber-50 hover:bg-amber-950 transition-colors whitespace-nowrap min-h-[44px] shrink-0"
            >
              Create profile
            </button>
          </div>
        )}

        {/* Dashboard Top Row: Pass Card (largest) + 3 Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Pass card (largest, 6 cols on lg) */}
          <div className="lg:col-span-6 bg-white border border-[#E2DED3] rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-semibold tracking-wider uppercase text-stone-500 font-heading">
                  24-Hour Bidding Pass
                </span>
                {passActive && (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      passEndingSoon
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-[#EBF3EF] text-[#1E5B43] border border-[#1E5B43]/20'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {passEndingSoon ? 'Ending soon' : 'Active Pass'}
                  </span>
                )}
              </div>

              {passActive ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold font-heading text-[#1E5B43] tabular-nums">
                      {passHoursRemaining}
                    </span>
                    <span className="text-stone-600 font-medium">
                      hours left
                      {passMinutesRemaining > 0 && ` (${passMinutesRemaining}m)`}
                    </span>
                  </div>

                  {/* 0 to 24 h progress bar */}
                  <div className="mt-4 mb-2">
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-[#E2DED3]">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          passEndingSoon ? 'bg-amber-500' : 'bg-[#1E5B43]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500 font-mono tabular-nums mt-1.5">
                      <span>0h</span>
                      <span>12h</span>
                      <span>24h</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-2">
                  <div className="text-3xl sm:text-4xl font-bold font-heading text-stone-800 mb-2">
                    No active pass
                  </div>
                  <p className="text-sm text-stone-600 mb-4">
                    Activate a 24-hour pass to place unlimited private quotes directly to travelers in your categories.
                  </p>
                  <button
                    onClick={() => setPassModalOpen(true)}
                    disabled={!profileIsComplete}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1E5B43] hover:bg-[#164634] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors min-h-[44px]"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>Pay KSH 850 with M-Pesa</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[#E2DED3] text-xs text-stone-500">
              Unlocking a contact is separate and does not need a pass.
            </div>
          </div>

          {/* 2. Three summary cards beside it (6 cols on lg, arranged 3 in a row or stack) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Summary Card 1: Bookmarked requests */}
            <div className="bg-white border border-[#E2DED3] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-500 font-heading">Bookmarked requests</span>
                  <BookmarkIcon className="w-4 h-4 text-[#1E5B43]" />
                </div>
                <div className="text-3xl font-bold font-heading text-[#1E5B43] tabular-nums mt-1">
                  {bookmarkedRequests.length}
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2DED3] mt-3">
                <button
                  onClick={scrollToBookmarks}
                  className="text-xs font-medium text-[#1E5B43] hover:underline flex items-center gap-1 min-h-[24px]"
                >
                  <span>View bookmarks</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Summary Card 2: Contacts unlocked */}
            <div className="bg-white border border-[#E2DED3] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-500 font-heading">Contacts unlocked</span>
                  <Phone className="w-4 h-4 text-[#1E5B43]" />
                </div>
                <div className="text-3xl font-bold font-heading text-[#1E5B43] tabular-nums mt-1">
                  {operatorUnlocks.length}
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2DED3] mt-3">
                <button
                  onClick={() => setHistoryTab('unlocks')}
                  className="text-xs font-medium text-[#1E5B43] hover:underline flex items-center gap-1 min-h-[24px]"
                >
                  <span>View contacts</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Summary Card 3: Total spent */}
            <div className="bg-white border border-[#E2DED3] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-500 font-heading">Total spent</span>
                  <CreditCard className="w-4 h-4 text-[#1E5B43]" />
                </div>
                <div className="text-2xl font-bold font-heading text-[#1E5B43] tabular-nums mt-1">
                  KSH {totalSpentKsh.toLocaleString()}
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2DED3] mt-3 text-xs text-stone-600">
                {completedPassPayments.length} passes, {completedUnlockPayments.length} unlocks
              </div>
            </div>
          </div>
        </div>

        {/* 3. History with three tabs, newest first */}
        <div className="bg-white border border-[#E2DED3] rounded-2xl shadow-xs overflow-hidden">
          {/* Tabs bar */}
          <div className="border-b border-[#E2DED3] px-6 pt-4 flex gap-6 overflow-x-auto">
            <button
              onClick={() => setHistoryTab('payments')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 font-heading whitespace-nowrap min-h-[44px] flex items-center ${
                historyTab === 'payments'
                  ? 'border-[#1E5B43] text-[#1E5B43]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Payments ({operatorPayments.length})
            </button>
            <button
              onClick={() => setHistoryTab('passes')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 font-heading whitespace-nowrap min-h-[44px] flex items-center ${
                historyTab === 'passes'
                  ? 'border-[#1E5B43] text-[#1E5B43]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Pass history ({passHistory.length})
            </button>
            <button
              onClick={() => setHistoryTab('unlocks')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 font-heading whitespace-nowrap min-h-[44px] flex items-center ${
                historyTab === 'unlocks'
                  ? 'border-[#1E5B43] text-[#1E5B43]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Unlocked contacts ({operatorUnlocks.length})
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Tab 1: Payments */}
            {historyTab === 'payments' && (
              <div>
                {operatorPayments.length === 0 ? (
                  <p className="text-sm text-stone-500 py-6 text-center">No payment transactions recorded yet.</p>
                ) : (
                  <div>
                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2DED3] text-stone-500 font-heading text-xs uppercase">
                          <th className="pb-3 font-semibold">Date &amp; Time</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">M-Pesa Receipt</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DED3]">
                        {operatorPayments.map((p) => {
                          const isPass = p.type === 'pass' || !p.request_id;
                          const isPaid = p.status === 'completed';
                          const displayType = isPass
                            ? '24-hour pass'
                            : `Unlock: ${p.request_title || 'Listing contact'}`;
                          return (
                            <tr key={p.id} className="hover:bg-stone-50/50">
                              <td className="py-3.5 text-stone-600 font-mono text-xs tabular-nums">
                                {new Date(p.paid_at).toLocaleString('en-KE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 font-medium text-stone-900 max-w-xs truncate" title={displayType}>
                                {displayType}
                              </td>
                              <td className="py-3.5 font-mono text-xs text-stone-600 tabular-nums">
                                {p.mpesa_transaction_id}
                              </td>
                              <td className="py-3.5 font-mono text-stone-900 font-semibold tabular-nums">
                                KSH {(p.amount_ksh || p.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3.5">
                                {isPaid ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    Paid
                                  </span>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="inline-flex items-center text-xs font-semibold text-rose-700">
                                      Failed
                                    </span>
                                    <span className="text-[11px] text-stone-500">Not charged</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile cards (hides headers and shows small label above each value) */}
                    <div className="md:hidden space-y-4">
                      {operatorPayments.map((p) => {
                        const isPass = p.type === 'pass' || !p.request_id;
                        const isPaid = p.status === 'completed';
                        const displayType = isPass
                          ? '24-hour pass'
                          : `Unlock: ${p.request_title || 'Listing contact'}`;
                        return (
                          <div key={p.id} className="p-4 rounded-xl border border-[#E2DED3] bg-stone-50/60 space-y-2">
                            <div>
                              <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">Type</div>
                              <div className="text-sm font-semibold text-stone-900">{displayType}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DED3]/60">
                              <div>
                                <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">Amount</div>
                                <div className="text-sm font-mono font-semibold text-stone-900">
                                  KSH {(p.amount_ksh || p.amount || 0).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">Status</div>
                                <div>
                                  {isPaid ? (
                                    <span className="text-xs font-semibold text-emerald-700">Paid</span>
                                  ) : (
                                    <span className="text-xs font-semibold text-rose-700">Failed (Not charged)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DED3]/60 text-xs text-stone-600">
                              <div>
                                <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">Receipt</div>
                                <div className="font-mono text-xs">{p.mpesa_transaction_id}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">Date &amp; Time</div>
                                <div className="font-mono text-[11px]">
                                  {new Date(p.paid_at).toLocaleString('en-KE', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Pass history */}
            {historyTab === 'passes' && (
              <div>
                {passHistory.length === 0 ? (
                  <p className="text-sm text-stone-500 py-6 text-center">No past passes found.</p>
                ) : (
                  <div>
                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2DED3] text-stone-500 font-heading text-xs uppercase">
                          <th className="pb-3 font-semibold">Start</th>
                          <th className="pb-3 font-semibold">End</th>
                          <th className="pb-3 font-semibold">Bids Sent</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DED3]">
                        {passHistory.map((ph) => {
                          const isActive = ph.status === 'active';
                          return (
                            <tr key={ph.id} className="hover:bg-stone-50/50">
                              <td className="py-3.5 font-mono text-xs text-stone-700 tabular-nums">
                                {new Date(ph.start).toLocaleString('en-KE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 font-mono text-xs text-stone-700 tabular-nums">
                                {new Date(ph.end).toLocaleString('en-KE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 font-mono font-medium text-stone-900 tabular-nums">
                                {ph.bids_sent_count} quotes
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isActive
                                      ? 'bg-[#EBF3EF] text-[#1E5B43]'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {isActive ? 'Active' : 'Expired'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                      {passHistory.map((ph) => (
                        <div key={ph.id} className="p-4 rounded-xl border border-[#E2DED3] bg-stone-50/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-700">24-Hour Bidding Window</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                ph.status === 'active' ? 'bg-[#EBF3EF] text-[#1E5B43]' : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {ph.status === 'active' ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DED3]/60 text-xs">
                            <div>
                              <div className="text-[10px] font-semibold text-stone-500 uppercase">Start</div>
                              <div className="font-mono text-stone-800">
                                {new Date(ph.start).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-stone-500 uppercase">End</div>
                              <div className="font-mono text-stone-800">
                                {new Date(ph.end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-[#E2DED3]/60 text-xs">
                            <span className="text-stone-500">Bids sent during pass: </span>
                            <strong className="text-stone-900 font-mono">{ph.bids_sent_count} quotes</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Unlocked contacts */}
            {historyTab === 'unlocks' && (
              <div>
                {operatorUnlocks.length === 0 ? (
                  <p className="text-sm text-stone-500 py-6 text-center">No traveler contacts unlocked yet.</p>
                ) : (
                  <div>
                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2DED3] text-stone-500 font-heading text-xs uppercase">
                          <th className="pb-3 font-semibold">Listing</th>
                          <th className="pb-3 font-semibold">Category</th>
                          <th className="pb-3 font-semibold">Fee Paid</th>
                          <th className="pb-3 font-semibold">Unlock Date</th>
                          <th className="pb-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DED3]">
                        {operatorUnlocks.map((u) => {
                          return (
                            <tr key={u.id} className="hover:bg-stone-50/50">
                              <td className="py-3.5 font-medium text-stone-900 max-w-sm truncate">
                                {u.request_title}
                              </td>
                              <td className="py-3.5 text-stone-600 capitalize">
                                {u.request_category}
                              </td>
                              <td className="py-3.5 font-mono text-stone-900 font-semibold tabular-nums">
                                KSH {u.fee_ksh.toLocaleString()}
                              </td>
                              <td className="py-3.5 font-mono text-xs text-stone-600 tabular-nums">
                                {u.paid_at ? new Date(u.paid_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Confirmed'}
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('operator-request-detail', u.request_id)}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E5B43] text-white hover:bg-[#164634] transition-colors min-h-[36px] cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  <span>View full request</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                      {operatorUnlocks.map((u) => {
                        return (
                          <div key={u.id} className="p-4 rounded-xl border border-[#E2DED3] bg-stone-50/60 space-y-3">
                            <div>
                              <div className="text-[10px] font-semibold text-stone-500 uppercase">Listing Title</div>
                              <div className="text-sm font-semibold text-stone-900">{u.request_title}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-[10px] font-semibold text-stone-500 uppercase">Category</div>
                                <div className="capitalize text-stone-800">{u.request_category}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-stone-500 uppercase">Fee Paid</div>
                                <div className="font-mono font-semibold text-stone-900">KSH {u.fee_ksh.toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-[#E2DED3]/60 flex items-center justify-between">
                              <span className="text-xs text-stone-500 font-mono">
                                {u.paid_at ? new Date(u.paid_at).toLocaleDateString() : 'Paid'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveTab('operator-request-detail', u.request_id)}
                                className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-[#1E5B43] text-white hover:bg-[#164634] min-h-[44px] cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                <span>View full request</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Bookmarked requests list */}
        <div id="bookmarked-requests-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#1E5B43]">
                Bookmarked Requests
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Saved travel enquiries. Reach travelers by placing a bid or paying to unlock their direct contacts.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('operator-open-requests')}
              className="text-xs font-semibold text-[#1E5B43] hover:underline flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
            >
              <span>Browse all requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {bookmarkedRequests.length === 0 ? (
            <div className="bg-white border border-[#E2DED3] rounded-2xl p-8 text-center">
              <BookmarkIcon className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold font-heading text-stone-800">No bookmarked requests</h3>
              <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
                Bookmark enquiries from the Open Requests feed to track them closely and quickly bid or unlock contacts here.
              </p>
              <button
                onClick={() => setActiveTab('operator-open-requests')}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#1E5B43] text-white hover:bg-[#164634] min-h-[44px]"
              >
                Go to Open Requests
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarkedRequests.map((request) => {
                const unlockInfo = getListingUnlockInfo(request.id);
                const isUnlocked = currentOperator ? isContactUnlocked(request.id, currentOperator.id) : false;
                const { feeKsh } = calculateUnlockFee(request);
                const hasExistingBid = currentOperator
                  ? bids.some((b) => b.request_id === request.id && b.operator_id === currentOperator.id)
                  : false;
                const isClosed = request.status === 'closed' || request.status === 'expired';

                return (
                  <div
                    key={request.id}
                    className="bg-white border border-[#E2DED3] rounded-2xl p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Top Row: Category tag, Traveler country, Bookmark toggle */}
                    <div className="flex items-center justify-between gap-3 text-xs text-stone-500 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold uppercase tracking-wider text-[#1E5B43]">
                          {request.category === 'safari'
                            ? 'Safari & Tours'
                            : request.category === 'hotel'
                            ? 'Hotels'
                            : 'BnBs'}
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="text-stone-700 font-medium">
                          From {request.traveler_country}
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="font-mono text-stone-500 tabular-nums">
                          Posted {new Date(request.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBookmark(request.id)}
                        className="text-stone-400 hover:text-stone-700 p-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Remove bookmark"
                      >
                        <BookmarkIcon className="w-4 h-4 fill-[#1E5B43] text-[#1E5B43]" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold font-heading text-stone-900 mb-2">
                      {request.title}
                    </h3>

                    {/* Details: group size, dates, budget */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-600 mb-4 py-2 border-y border-[#E2DED3]/60">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {request.adults} Adults{request.children > 0 && `, ${request.children} Kids`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(request.end_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-semibold text-stone-900">
                          Budget: {request.currency} {request.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Marketplace Rules Indicators: "No bid limit" and "X of 30 unlocks left" */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* No bid limit */}
                        <span className="text-stone-600 font-medium">
                          No bid limit
                        </span>
                        <span aria-hidden="true" className="text-stone-300">&middot;</span>
                        {/* X of 30 unlocks left */}
                        {request.bids_only ? (
                          <span className="font-semibold text-stone-500">
                            Bids only (Contact unlocking turned off)
                          </span>
                        ) : unlockInfo.isFull ? (
                          <span className="font-semibold text-rose-700">
                            Contacts full (30 of 30 unlocked)
                          </span>
                        ) : (
                          <span className="text-stone-700 font-medium">
                            <strong className="text-[#1E5B43] font-semibold">{unlockInfo.remaining}</strong> of 30 unlocks left
                          </span>
                        )}
                      </div>

                      {isClosed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-stone-200 text-stone-700">
                          Enquiry closed
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: 2 Buttons per row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                      {/* Button 1: "Place bid" (needs profile and active pass) */}
                      {(() => {
                        if (isClosed) {
                          return (
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-400 cursor-not-allowed min-h-[44px]"
                            >
                              Enquiry closed
                            </button>
                          );
                        }
                        if (!profileIsComplete) {
                          return (
                            <button
                              onClick={() => setProfileModalOpen(true)}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-500 hover:bg-stone-200 min-h-[44px]"
                            >
                              Create profile to bid
                            </button>
                          );
                        }
                        if (!passActive) {
                          return (
                            <button
                              onClick={() => setPassModalOpen(true)}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 min-h-[44px]"
                            >
                              Pay KSH 850 to bid
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => handleOpenBidModal(request)}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#1E5B43] text-[#1E5B43] bg-white hover:bg-[#EBF3EF] transition-colors min-h-[44px]"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            <span>{hasExistingBid ? 'Edit bid' : 'Place bid'}</span>
                          </button>
                        );
                      })()}

                      {/* Button 2: "Unlock contact: KSH [fee]" (needs profile) */}
                      {(() => {
                        if (isUnlocked) {
                          return (
                            <button
                              onClick={() => handleViewContact(request)}
                              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#EBF3EF] text-[#1E5B43] border border-[#1E5B43]/30 hover:bg-[#1E5B43] hover:text-white transition-colors min-h-[44px]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              <span>Contact unlocked (View)</span>
                            </button>
                          );
                        }
                        if (isClosed) {
                          return (
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-400 cursor-not-allowed min-h-[44px]"
                            >
                              Enquiry closed
                            </button>
                          );
                        }
                        if (request.bids_only) {
                          return (
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-400 cursor-not-allowed min-h-[44px]"
                              title="The traveler chose to receive bids only"
                            >
                              Bids only
                            </button>
                          );
                        }
                        if (unlockInfo.isFull) {
                          return (
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-400 cursor-not-allowed min-h-[44px]"
                            >
                              Contacts full
                            </button>
                          );
                        }
                        if (!profileIsComplete) {
                          return (
                            <button
                              onClick={() => setProfileModalOpen(true)}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-500 hover:bg-stone-200 min-h-[44px]"
                            >
                              Create profile to unlock
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => handleInitiateUnlock(request)}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1E5B43] hover:bg-[#164634] text-white transition-colors min-h-[44px]"
                          >
                            <Phone className="w-3.5 h-3.5 mr-1.5" />
                            <span>Unlock contact: KSH {feeKsh.toLocaleString()}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Operator Profile Gate Modal (All required fields) */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#E2DED3] shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DED3] mb-5">
              <div>
                <h3 className="text-xl font-bold font-heading text-[#1E5B43]">
                  Operator Profile
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Your profile is private between you and platform admins. It is never publicly searchable.
                </p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mara Wild Expeditions & Safaris"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Jackson Ole Kaelo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Official Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 722 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jackson@marawild.co.ke"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm"
                  />
                </div>
              </div>

              {/* Categories Served */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1.5">
                  Categories Served *
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'safari' as TravelCategory, label: 'Safari and tours' },
                    { id: 'hotel' as TravelCategory, label: 'Hotels' },
                    { id: 'bnb' as TravelCategory, label: 'BnBs' },
                  ].map((cat) => {
                    const active = categories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors min-h-[38px] ${
                          active
                            ? 'bg-[#1E5B43] text-white border-[#1E5B43]'
                            : 'bg-stone-50 text-stone-700 border-[#E2DED3] hover:bg-stone-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regions Covered */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1.5">
                  Regions Covered *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Maasai Mara', 'Amboseli', 'Nairobi', 'Diani Beach', 'Watamu', 'Lake Nakuru', 'Naivasha', 'Samburu', 'Tsavo'].map((reg) => {
                    const active = regions.includes(reg);
                    return (
                      <button
                        type="button"
                        key={reg}
                        onClick={() => toggleRegion(reg)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-[#EBF3EF] text-[#1E5B43] border-[#1E5B43]'
                            : 'bg-white text-stone-600 border-[#E2DED3] hover:bg-stone-50'
                        }`}
                      >
                        {reg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Business Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your fleet, experience, guide certifications, and specialties..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm"
                />
              </div>

              {/* Licensing & Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2DED3]">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    TRA Licence Number
                  </label>
                  <input
                    type="text"
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                    placeholder="TRA/TO/2026/0419"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Licence Upload (File)
                  </label>
                  <input
                    type="text"
                    value={licenceFileName}
                    onChange={(e) => setLicenceFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono text-stone-600 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Business Registration File
                  </label>
                  <input
                    type="text"
                    value={businessRegFileName}
                    onChange={(e) => setBusinessRegFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono text-stone-600 bg-stone-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DED3]">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E2DED3] hover:bg-stone-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1E5B43] hover:bg-[#164634] text-white min-h-[44px]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bidding Pass STK Push Modal (KSH 850 for 24 hours) */}
      {passModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 border border-[#E2DED3] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED3] mb-4">
              <h3 className="text-xl font-bold font-heading text-[#1E5B43]">
                24-Hour Bidding Pass
              </h3>
              <button
                onClick={() => setPassModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-stone-600 mb-4">
              Get 24 hours of unlimited bidding across all open requests in your selected categories.
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-[#E2DED3] mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Access Duration:</span>
                <span className="font-semibold text-stone-900">24 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount to Pay:</span>
                <span className="font-bold text-[#1E5B43] text-base font-mono">KSH 850</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-semibold text-stone-900">Safaricom M-Pesa STK Push</span>
              </div>
            </div>

            {passModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-3">
                {passModalError}
              </div>
            )}

            {passModalNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passModalNotice}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="0722000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handlePayBiddingPass(false)}
                disabled={isProcessingPass}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-[#1E5B43] hover:bg-[#164634] text-white disabled:opacity-50 min-h-[44px]"
              >
                {isProcessingPass ? 'Prompting M-Pesa PIN...' : 'Pay KSH 850 with M-Pesa'}
              </button>

              <button
                onClick={() => handlePayBiddingPass(true)}
                disabled={isProcessingPass}
                className="w-full text-xs text-stone-500 hover:text-stone-700 py-1.5 min-h-[36px]"
              >
                Simulate User PIN Cancel (Not charged)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Contact Unlock Payment Modal with 2-Minute Hold */}
      {unlockModalOpen && selectedUnlockRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 border border-[#E2DED3] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED3] mb-4">
              <h3 className="text-xl font-bold font-heading text-[#1E5B43]">
                Unlock Traveler Contact
              </h3>
              <button
                onClick={handleCloseUnlockModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-3">
              Direct access reveals traveler email, WhatsApp, and phone number. Does not require a bidding pass.
            </p>

            {/* 2-minute Slot Hold Notice */}
            <div className="p-3 rounded-xl border border-[#1E5B43]/30 bg-[#EBF3EF] mb-4 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E5B43]" />
                <span className="font-semibold text-[#1E5B43]">Slot held for checkout</span>
              </div>
              <span className="font-mono font-bold text-[#1E5B43] tabular-nums">
                {Math.floor(holdSecondsRemaining / 60)}:
                {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-[#E2DED3] mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Listing:</span>
                <span className="font-medium text-stone-900 max-w-[200px] truncate">{selectedUnlockRequest.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Traveler Budget:</span>
                <span className="font-medium text-stone-900">
                  {selectedUnlockRequest.currency} {selectedUnlockRequest.budget.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Budget Tier:</span>
                <span className="font-medium text-stone-900">{calculateUnlockFee(selectedUnlockRequest).tierLabel}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E2DED3]">
                <span className="font-semibold text-stone-700">Fee to Pay:</span>
                <span className="font-bold text-[#1E5B43] text-base font-mono">
                  KSH {calculateUnlockFee(selectedUnlockRequest).feeKsh.toLocaleString()}
                </span>
              </div>
            </div>

            {unlockModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-3">
                {unlockModalError}
              </div>
            )}

            {unlockModalRefundNotice && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl mb-3">
                {unlockModalRefundNotice}
              </div>
            )}

            {unlockModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{unlockModalSuccess}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="0722000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleConfirmUnlockPayment()}
                disabled={isProcessingUnlock}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-[#1E5B43] hover:bg-[#164634] text-white disabled:opacity-50 min-h-[44px]"
              >
                {isProcessingUnlock
                  ? 'Confirming M-Pesa STK push...'
                  : `Pay KSH ${calculateUnlockFee(selectedUnlockRequest).feeKsh} with M-Pesa`}
              </button>

              <button
                onClick={() => handleConfirmUnlockPayment({ simulateFailure: true })}
                disabled={isProcessingUnlock}
                className="w-full text-xs text-stone-500 hover:text-stone-700 py-1.5 min-h-[36px]"
              >
                Simulate User PIN Cancel (Not charged)
              </button>

              <button
                onClick={() => handleConfirmUnlockPayment({ simulateLatePaymentFull: true })}
                disabled={isProcessingUnlock}
                className="w-full text-xs text-amber-700 hover:text-amber-800 py-1.5 min-h-[36px]"
              >
                Simulate Payment After Hold Expired When Full (Auto-Refund)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: View Unlocked Contact Modal */}
      {contactViewModalOpen && contactViewData.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 border border-[#E2DED3] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED3] mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Contact Unlocked
                </span>
                <h3 className="text-xl font-bold font-heading text-stone-900 mt-1">
                  {contactViewData.contact?.name || contactViewData.request.traveler_name}
                </h3>
              </div>
              <button
                onClick={() => setContactViewModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              Re: <strong>{contactViewData.request.title}</strong>
            </p>

            <div className="space-y-3 mb-6">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${(contactViewData.contact?.whatsapp || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl border border-[#E2DED3] hover:border-[#1E5B43] bg-stone-50 hover:bg-[#EBF3EF] transition-colors flex items-center justify-between min-h-[50px]"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase">WhatsApp</div>
                    <div className="text-sm font-semibold text-stone-900 font-mono">
                      {contactViewData.contact?.whatsapp || contactViewData.request.whatsapp_number || '+254700000000'}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </a>

              {/* Phone Call */}
              <a
                href={`tel:${contactViewData.contact?.phone || contactViewData.request.call_number}`}
                className="p-3.5 rounded-xl border border-[#E2DED3] hover:border-[#1E5B43] bg-stone-50 hover:bg-[#EBF3EF] transition-colors flex items-center justify-between min-h-[50px]"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#1E5B43]" />
                  <div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase">Phone Call</div>
                    <div className="text-sm font-semibold text-stone-900 font-mono">
                      {contactViewData.contact?.phone || contactViewData.request.call_number || '+254700000000'}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </a>

              {/* Email */}
              <a
                href={`mailto:${contactViewData.contact?.email || contactViewData.request.email_address}`}
                className="p-3.5 rounded-xl border border-[#E2DED3] hover:border-[#1E5B43] bg-stone-50 hover:bg-[#EBF3EF] transition-colors flex items-center justify-between min-h-[50px]"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase">Email Address</div>
                    <div className="text-sm font-semibold text-stone-900 font-mono">
                      {contactViewData.contact?.email || contactViewData.request.email_address || 'traveler@safari-stays.com'}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </a>
            </div>

            <div className="pt-3 border-t border-[#E2DED3] text-xs text-stone-500 flex justify-between">
              <span>Origin: {contactViewData.request.traveler_country}</span>
              <span>Prefers: {contactViewData.contact?.preferred_channel || 'WhatsApp'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Place / Edit Bid Modal */}
      {bidModalOpen && selectedBidRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 border border-[#E2DED3] shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED3] mb-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-[#1E5B43]">
                  {existingBidToEdit ? 'Edit Your Bid' : 'Place a Private Bid'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Bids live inside the platform only: they never go to the traveler&apos;s email or WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setBidModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bidModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-3">
                {bidModalError}
              </div>
            )}

            {bidModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bidModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBidSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Proposed Amount *
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={bidCurrency}
                      onChange={(e) => setBidCurrency(e.target.value as Currency)}
                      className="px-2.5 py-2 rounded-xl border border-[#E2DED3] bg-stone-50 text-sm font-semibold"
                    >
                      <option value="USD">USD</option>
                      <option value="KSH">KSH</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <input
                      type="number"
                      required
                      min={100}
                      value={bidPrice}
                      onChange={(e) => setBidPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] text-sm font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    required
                    value={bidValidity}
                    onChange={(e) => setBidValidity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] text-sm font-mono"
                  />
                </div>
              </div>

              {/* Message to traveler */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Message / Cover Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Detail your vehicle, driver guide qualifications, and customized proposal..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DED3] text-sm"
                />
              </div>

              {/* Inclusions */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Package Inclusions
                </label>
                <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                  {bidInclusions.map((inc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-[#E2DED3] text-xs">
                      <span>{inc}</span>
                      <button
                        type="button"
                        onClick={() => setBidInclusions(bidInclusions.filter((_, idx) => idx !== i))}
                        className="text-stone-400 hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInclusionText}
                    onChange={(e) => setNewInclusionText(e.target.value)}
                    placeholder="Add an inclusion (e.g. AMREF flying doctors cover)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E2DED3] text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newInclusionText.trim()) {
                          setBidInclusions([...bidInclusions, newInclusionText.trim()]);
                          setNewInclusionText('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newInclusionText.trim()) {
                        setBidInclusions([...bidInclusions, newInclusionText.trim()]);
                        setNewInclusionText('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Operator Contacts visible to traveler on bid card */}
              <div className="pt-3 border-t border-[#E2DED3]">
                <label className="block text-stone-700 font-semibold mb-1.5">
                  Your Direct Contacts (Shared on traveler&apos;s bid board)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="email"
                    required
                    value={bidEmail}
                    onChange={(e) => setBidEmail(e.target.value)}
                    placeholder="Email"
                    className="px-2.5 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono"
                  />
                  <input
                    type="tel"
                    required
                    value={bidWhatsApp}
                    onChange={(e) => setBidWhatsApp(e.target.value)}
                    placeholder="WhatsApp"
                    className="px-2.5 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono"
                  />
                  <input
                    type="tel"
                    required
                    value={bidPhone}
                    onChange={(e) => setBidPhone(e.target.value)}
                    placeholder="Phone"
                    className="px-2.5 py-2 rounded-xl border border-[#E2DED3] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DED3]">
                <button
                  type="button"
                  onClick={() => setBidModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E2DED3] hover:bg-stone-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1E5B43] hover:bg-[#164634] text-white min-h-[44px]"
                >
                  {existingBidToEdit ? 'Save Changes' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
