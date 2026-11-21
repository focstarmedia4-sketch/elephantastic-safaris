import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Currency, TravelerContact, Bid } from '../../types';
import { parseBidMessages } from '../../utils/bidFollowUps';
import { ShareRequestButton } from '../../components/ShareRequestButton';
import {
  Lock,
  Unlock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Send,
  Bookmark as BookmarkIcon,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  X,
  RefreshCw,
  Info,
  DollarSign,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const OperatorRequestDetailPage: React.FC = () => {
  const {
    tabParam: requestId,
    requests,
    currentOperator,
    currentUser,
    isProfileComplete,
    isBiddingPassActive,
    getBiddingPassTimeRemaining,
    getBidsForRequest,
    submitBid,
    setActiveTab,
    toggleBookmark,
    isBookmarked,
    calculateUnlockFee,
    getListingUnlockInfo,
    isContactUnlocked,
    getUnlockedContact,
    fetchRequestContactDetails,
    startUnlockHold,
    cancelUnlockHold,
    confirmUnlockPayment,
    payBiddingPass,
  } = useApp();

  // Bidding form state
  const [price, setPrice] = useState<number>(3800);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [inclusions, setInclusions] = useState<string[]>([
    'Customized 4x4 pop-up roof Toyota Land Cruiser with unlimited mileage',
    'Certified Silver-level KPSGA English-speaking safari guide',
    'All park conservation fees & government taxes',
    'Full board accommodation at luxury tented camp',
    'Complimentary Jomo Kenyatta Airport (JKIA) transfers',
    'Unlimited bottled drinking water during game drives',
  ]);
  const [newInclusionText, setNewInclusionText] = useState('');
  const [message, setMessage] = useState(
    'Jambo! We have curated a tailored safari itinerary aligned with your family preferences. Our vehicles are equipped with charging sockets and high-power binoculars.'
  );
  const [validUntil, setValidUntil] = useState('2026-11-25');
  const [operatorEmail, setOperatorEmail] = useState(currentOperator?.email || '');
  const [operatorWhatsapp, setOperatorWhatsapp] = useState(currentOperator?.phone || '');
  const [operatorPhone, setOperatorPhone] = useState(currentOperator?.phone || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');

  // Unlock Modal & Hold state
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(120);
  const [mpesaPhone, setMpesaPhone] = useState(currentOperator?.phone || '0722456789');
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const [unlockModalError, setUnlockModalError] = useState('');
  const [unlockModalSuccess, setUnlockModalSuccess] = useState('');
  const [unlockRefundNotice, setUnlockRefundNotice] = useState('');

  // Bidding Pass Modal state (to pay KSH 850 directly if pass is inactive)
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [isProcessingPass, setIsProcessingPass] = useState(false);
  const [passModalError, setPassModalError] = useState('');
  const [passModalSuccess, setPassModalSuccess] = useState('');

  const request = requests.find((r) => r.id === requestId);

  // Fetch request_contacts (RLS-gated) + unlocks_used & unlock_fee_ksh RPCs when request changes
  useEffect(() => {
    if (currentUser && request?.id) {
      void fetchRequestContactDetails(request.id);
    }
  }, [currentUser, request?.id, fetchRequestContactDetails]);

  // Sync operator contacts if empty
  useEffect(() => {
    if (currentOperator) {
      if (!operatorEmail) setOperatorEmail(currentOperator.email || '');
      if (!operatorWhatsapp) setOperatorWhatsapp(currentOperator.phone || '');
      if (!operatorPhone) setOperatorPhone(currentOperator.phone || '');
      if (!mpesaPhone) setMpesaPhone(currentOperator.phone || '0722456789');
    }
  }, [currentOperator]);

  // Hold timer countdown effect (2 minutes = 120s)
  useEffect(() => {
    let timer: any;
    if (unlockModalOpen && activeHoldId && holdSecondsRemaining > 0) {
      timer = setInterval(() => {
        setHoldSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (currentOperator) {
              cancelUnlockHold(activeHoldId, currentOperator.id, 'Hold expired after 2 minutes');
            }
            setActiveHoldId(null);
            setUnlockModalError('Slot hold expired after 2 minutes. The hold has been released. Please try again.');
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

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold text-stone-900 font-heading">Request Not Found</h2>
        <p className="text-xs text-stone-600">The requested travel inquiry does not exist or has been removed.</p>
        <button
          onClick={() => setActiveTab('operator-open-requests')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl min-h-[44px] cursor-pointer transition-colors"
        >
          Back to Open Requests
        </button>
      </div>
    );
  }

  const profileOk = isProfileComplete(currentOperator);
  const hasBiddingPass = isBiddingPassActive(currentOperator);
  const biddingPassInfo = getBiddingPassTimeRemaining(currentOperator);
  const myBids = getBidsForRequest(request.id);
  const hasAlreadyBid = myBids.length > 0;

  // Contact Unlock Info
  const unlockFee = calculateUnlockFee(request);
  const unlockInfo = getListingUnlockInfo(request.id);
  const isUnlocked = isContactUnlocked(request.id, currentOperator?.id || '');
  const unlockedContact = isUnlocked ? getUnlockedContact(request.id, currentOperator?.id || '') : undefined;

  const handleAddInclusion = () => {
    if (!newInclusionText.trim()) return;
    setInclusions([...inclusions, newInclusionText.trim()]);
    setNewInclusionText('');
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  // Direct test-mode simulation: clicking Unlock Contact immediately simulates payment & unlocks contact
  const handleOpenUnlockModal = async () => {
    if (!currentOperator) {
      setActiveTab('operator-signup');
      return;
    }
    if (!profileOk) {
      setActiveTab('operator-dashboard');
      return;
    }
    if (unlockInfo.bidsOnly || unlockInfo.isFull || isUnlocked || isProcessingUnlock) return;

    setUnlockModalError('');
    setUnlockModalSuccess('');
    setUnlockRefundNotice('');
    setIsProcessingUnlock(true);

    try {
      const holdRes = await startUnlockHold(request.id, currentOperator.id);
      if (!holdRes.success) {
        setUnlockModalError(holdRes.error || 'Unable to hold unlock slot at this time.');
        setIsProcessingUnlock(false);
        return;
      }

      const payRes = await confirmUnlockPayment({
        holdId: holdRes.holdId,
        requestId: request.id,
        operatorId: currentOperator.id,
        phoneNumber: currentOperator.phone || mpesaPhone || '0722456789',
        simulateFailure: false,
        simulateLatePaymentFull: false,
        requestTitle: request.title,
        requestCategory: request.category,
      });

      if (!payRes.success) {
        setUnlockModalError(payRes.message || 'Unable to simulate contact unlock payment.');
      }
    } catch (err: any) {
      setUnlockModalError(err?.message || 'Unable to simulate contact unlock payment.');
    } finally {
      setIsProcessingUnlock(false);
    }
  };

  const handleCloseUnlockModal = async () => {
    if (activeHoldId && currentOperator) {
      await cancelUnlockHold(activeHoldId, currentOperator.id, 'User closed M-Pesa prompt modal');
    }
    setActiveHoldId(null);
    setUnlockModalOpen(false);
  };

  // Confirm Unlock Payment (M-Pesa STK Push)
  const handleExecuteUnlock = async (simulateFailure: boolean = false, simulateLateRefund: boolean = false) => {
    if (!currentOperator) return;
    setIsProcessingUnlock(true);
    setUnlockModalError('');
    setUnlockModalSuccess('');
    setUnlockRefundNotice('');

    try {
      const res = await confirmUnlockPayment({
        holdId: activeHoldId || undefined,
        requestId: request.id,
        operatorId: currentOperator.id,
        phoneNumber: mpesaPhone,
        simulateFailure,
        simulateLatePaymentFull: simulateLateRefund,
        requestTitle: request.title,
        requestCategory: request.category,
      });

      setIsProcessingUnlock(false);

      if (res.refunded) {
        setUnlockRefundNotice(res.message);
        setActiveHoldId(null);
        return;
      }

      if (res.success) {
        setUnlockModalSuccess(res.message);
        setActiveHoldId(null);
        setTimeout(() => {
          setUnlockModalOpen(false);
        }, 1800);
      } else {
        setUnlockModalError(res.message);
      }
    } catch (err: any) {
      setIsProcessingUnlock(false);
      setUnlockModalError(err.message || 'Payment processing error');
    }
  };

  // Pay Bidding Pass (KSH 850)
  const handlePayBiddingPass = async (simulateFailure: boolean = false) => {
    if (!currentOperator) return;
    setIsProcessingPass(true);
    setPassModalError('');
    setPassModalSuccess('');

    const res = await payBiddingPass(currentOperator.id, mpesaPhone, simulateFailure);
    setIsProcessingPass(false);

    if (res.success) {
      setPassModalSuccess(res.message);
      setTimeout(() => {
        setPassModalOpen(false);
      }, 1500);
    } else {
      setPassModalError(res.message);
    }
  };

  // Direct test-mode simulation: clicking Pay KSH 850 immediately simulates paid Bidding Pass
  const handleTestSimulateBiddingPass = async () => {
    if (!currentOperator || isProcessingPass) return;
    setIsProcessingPass(true);
    setPassModalError('');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await payBiddingPass(
        currentOperator.id,
        currentOperator.phone || mpesaPhone || '0722456789',
        false
      );
      if (res.success) {
        setSuccessMessage(res.message || 'Test payment simulated: 24-Hour Bidding Pass is now active.');
      } else {
        setPassModalError(res.message || 'Unable to activate bidding pass.');
      }
    } catch (err: any) {
      setPassModalError(err?.message || 'Unable to activate bidding pass.');
    } finally {
      setIsProcessingPass(false);
    }
  };

  // Submit Bid (Rule 4: insert into `bids` only; if no active pass, shows "Pay KSH 850 to bid")
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await submitBid({
      request_id: request.id,
      price: Number(price),
      currency: 'USD',
      inclusions,
      message,
      valid_until: validUntil,
      operator_email: operatorEmail.trim(),
      operator_whatsapp: operatorWhatsapp.trim(),
      operator_phone: operatorPhone.trim(),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to submit bid.');
    } else {
      setFollowUpOpen(false);
      setSuccessMessage('Your bid has been submitted to Supabase.');
    }
  };

  // Send Follow-Up Request (inserts into bids)
  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedFollowUp = followUpMessage.trim();
    if (!trimmedFollowUp) {
      setErrorMessage('Please enter a follow-up message before sending.');
      return;
    }

    const latestBid = myBids[0];
    if (!latestBid) return;

    const parsed = parseBidMessages(latestBid);

    const res = await submitBid({
      request_id: request.id,
      price: latestBid.price,
      currency: 'USD',
      inclusions: latestBid.inclusions,
      message: parsed.initialMessage,
      follow_up_message: trimmedFollowUp,
      valid_until: latestBid.valid_until,
      operator_email: latestBid.operator_email || operatorEmail.trim(),
      operator_whatsapp: latestBid.operator_whatsapp || operatorWhatsapp.trim(),
      operator_phone: latestBid.operator_phone || operatorPhone.trim(),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send follow-up.');
    } else {
      setFollowUpMessage('');
      setFollowUpOpen(false);
      setSuccessMessage('Your follow-up bid has been sent.');
    }
  };

  const travelerFirstName = (request.traveler_name || 'Traveler').trim().split(/\s+/)[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Profile Gate Banner if incomplete */}
      {!profileOk && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm font-heading">Complete your profile to start bidding &amp; unlocking contacts</div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Your profile is private and never listed publicly. Fill in your business name, contact person, phone, email, categories, and regions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('operator-dashboard')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
          >
            Create Profile &rarr;
          </button>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DED3] pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setActiveTab('operator-open-requests')}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              &larr; Back to Open Requests
            </button>
            <button
              onClick={() => toggleBookmark(request.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${
                isBookmarked(request.id)
                  ? 'border-[#1E5B43] bg-[#EBF3EF] text-[#1E5B43] font-bold'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400 bg-white'
              }`}
            >
              <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked(request.id) ? 'fill-current' : ''}`} />
              <span>{isBookmarked(request.id) ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            <ShareRequestButton request={request} variant="compact" />
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-bold text-[#1E5B43] uppercase tracking-wider">
              {request.category}
            </span>
            <span aria-hidden="true">&middot;</span>
            <span>Origin: {request.traveler_country}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="font-mono tabular-nums">
              Dates: {request.start_date} &rarr; {request.end_date}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E5B43] tracking-tight font-heading mt-1">
            {request.title}
          </h1>
        </div>

        {/* Unlock Capacity Status Pill */}
        <div className="p-3 rounded-2xl bg-white border border-[#E2DED3] text-xs self-start sm:self-auto space-y-1.5 min-w-[210px] shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-500 font-medium">Unlock Capacity:</span>
            <span
              className={`font-bold font-mono tabular-nums ${
                unlockInfo.isFull ? 'text-amber-800' : 'text-[#1E5B43]'
              }`}
            >
              {unlockInfo.isFull ? 'Contacts full (30/30)' : `${unlockInfo.remaining} of ${unlockInfo.total} left`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                unlockInfo.paidCount / unlockInfo.total >= 0.8 ? 'bg-amber-500' : 'bg-[#1E5B43]'
              }`}
              style={{ width: `${Math.min(100, (unlockInfo.paidCount / unlockInfo.total) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>Bids: {myBids.length > 0 ? `${myBids.length} submitted` : 'No bid limit'}</span>
            <span className="font-bold text-[#1E5B43]">{unlockFee.feeKsh ? `KSH ${unlockFee.feeKsh.toLocaleString()}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Request Detail & Contact Unlocks (Left) + Bidding Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Full traveler inquiry + Contact details/unlock box */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2DED3] p-6 space-y-5 shadow-xs">
          <div className="border-b border-[#E2DED3] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#1E5B43] uppercase tracking-wider font-heading">
                Traveler Itinerary Request
              </h2>
              <div className="text-xs text-stone-500 mt-0.5">
                Target Budget: <strong className="text-stone-900 font-mono text-sm">{request.currency} {request.budget.toLocaleString()}</strong>
                {request.currency !== 'USD' && (
                  <span className="text-stone-500 ml-1">
                    (~USD {Math.round(request.budget_usd || (request.budget / 130)).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF3EF] text-[#1E5B43]">
              {request.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-500 block">Traveler</span>
              <span className="font-semibold text-stone-900">{travelerFirstName}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Country</span>
              <span className="font-semibold text-stone-900">{request.traveler_country}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Party Size</span>
              <span className="font-semibold text-stone-900">
                {request.adults} Adults {request.children > 0 ? `· ${request.children} Kids` : ''}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">Travel Dates</span>
              <span className="font-semibold text-stone-900 font-mono tabular-nums">
                {request.start_date} &rarr; {request.end_date}
              </span>
              {request.flexible_month && (
                <span className="text-stone-500 block mt-0.5">
                  ({request.flexible_month})
                </span>
              )}
            </div>
          </div>

          {/* Category specific details */}
          {request.safari_details && (
            <div className="text-xs space-y-2 pt-2 border-t border-stone-100">
              <div className="font-semibold text-stone-800">Safari Requirements:</div>
              <div className="text-stone-600">
                <strong>Duration:</strong> {request.safari_details.days} Days
              </div>
              <div>
                <span className="text-stone-500 block mb-1">Parks Requested:</span>
                <div className="flex flex-wrap gap-1">
                  {request.safari_details.parks.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-medium text-[11px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-stone-600 pt-1">
                <span>Tier: <strong className="capitalize">{request.safari_details.accommodation_level}</strong></span>
                <span>Vehicle: <strong className="capitalize">{request.safari_details.vehicle_type?.replace('_', ' ')}</strong></span>
              </div>
            </div>
          )}

          {request.hotel_details && (
            <div className="text-xs space-y-2 pt-2 border-t border-stone-100">
              <div className="font-semibold text-stone-800">Lodging Requirements:</div>
              <div>Destination: <strong>{request.hotel_details.destination}</strong></div>
              <div>Room: <strong>{request.hotel_details.room_type}</strong> ({request.hotel_details.rooms} rooms)</div>
              <div>Meal Plan: <strong className="capitalize">{request.hotel_details.meal_plan?.replace(/_/g, ' ')}</strong></div>
            </div>
          )}

          {request.bnb_details && (
            <div className="text-xs space-y-2 pt-2 border-t border-stone-100">
              <div className="font-semibold text-stone-800">BnB Requirements:</div>
              <div>Neighbourhood: <strong>{request.bnb_details.neighbourhood}</strong></div>
              <div>Bedrooms: <strong>{request.bnb_details.bedrooms}</strong> · <span className="capitalize">{request.bnb_details.place_type?.replace(/_/g, ' ')}</span></div>
            </div>
          )}

          <div className="pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500 font-medium block mb-1">Traveler Notes:</span>
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DED3]/60 text-stone-700 italic leading-relaxed">
              "{request.notes}"
            </div>
          </div>

          {/* TWO WAYS TO REACH TRAVELER - SECTION 1: CONTACT UNLOCK */}
          {isUnlocked ? (
            /* Unlocked View with Direct Action Buttons */
            <div className="p-4 rounded-2xl bg-[#EBF3EF] border border-[#1E5B43] text-xs text-[#1E5B43] space-y-3">
              <div className="font-bold flex items-center justify-between text-[#1E5B43] font-heading">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E5B43]" />
                  Traveler Contact Unlocked
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5B43] bg-white px-2 py-0.5 rounded-md border border-[#1E5B43]/30">
                  Paid KSH {unlockFee.feeKsh.toLocaleString()}
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-xs">
                You have unlocked verified direct contact with <strong>{unlockedContact?.name || request.traveler_name}</strong>. Reach them directly below:
              </p>

              <div className="space-y-2 pt-1">
                {unlockedContact?.whatsapp && (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2DED3]">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">WhatsApp Direct</span>
                      <span className="font-bold text-stone-900 font-mono text-sm">
                        {unlockedContact.whatsapp}
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/${unlockedContact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 min-h-[36px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </a>
                  </div>
                )}

                {unlockedContact?.phone && (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2DED3]">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Phone Call</span>
                      <span className="font-bold text-stone-900 font-mono text-sm">
                        {unlockedContact.phone}
                      </span>
                    </div>
                    <a
                      href={`tel:${unlockedContact.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-[#1E5B43] hover:bg-[#154331] text-white font-bold text-xs flex items-center gap-1.5 min-h-[36px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                )}

                {unlockedContact?.email && (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2DED3]">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Direct Email</span>
                      <span className="font-bold text-stone-900 text-xs">
                        {unlockedContact.email}
                      </span>
                    </div>
                    <a
                      href={`mailto:${unlockedContact.email}`}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 min-h-[36px]"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Locked View with Dynamic Fee Button and Budget Tiers */
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E2DED3] text-xs text-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1.5 text-[#1E5B43] font-heading">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Traveler Contact Details Locked
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                  {unlockFee.tierLabel}
                </span>
              </div>

              <p className="text-stone-600 leading-relaxed text-xs">
                Unlock <strong>{travelerFirstName}</strong>'s direct email, WhatsApp, and phone number with a one-time fee calculated strictly by the traveler's total budget. Maximum 30 unlocks allowed per listing.
              </p>

              {/* Unlock Capacity Counter */}
              <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white border border-[#E2DED3]">
                <span className="text-stone-500 font-medium">Capacity:</span>
                <span className="font-bold text-[#1E5B43] font-mono">
                  {unlockInfo.remaining} of {unlockInfo.total} unlocks left
                </span>
              </div>

              {/* Unlock Action Button */}
              {unlockInfo.bidsOnly ? (
                <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-center font-medium">
                  Bids only &bull; The traveler turned unlocking off for this request
                </div>
              ) : unlockInfo.isFull ? (
                <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 text-center font-medium">
                  Contacts full (30 of 30 unlocks reached). You can still place a bid below!
                </div>
              ) : !profileOk ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('operator-dashboard')}
                  className="w-full py-3 px-4 text-xs font-bold text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-stone-500" />
                  Create Profile to Unlock Contact
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenUnlockModal}
                  disabled={isProcessingUnlock}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {isProcessingUnlock
                      ? 'Connecting to M-Pesa...'
                      : `Unlock Contact: KSH ${unlockFee.feeKsh.toLocaleString()}`}
                  </span>
                </button>
              )}
              {unlockModalError && !unlockModalOpen && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {unlockModalError}
                </div>
              )}

              {/* Tier breakdown preview */}
              <div className="pt-2 border-t border-[#E2DED3] text-[11px] text-stone-500 space-y-1">
                <div className="font-bold text-stone-700">Official Unlock Fee Tiers:</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                  <span>Under $2,000: KSH 120</span>
                  <span>$2,000 - $4,999: KSH 300</span>
                  <span>$5,000 - $9,999: KSH 600</span>
                  <span>$10,000 - $19,999: KSH 1,200</span>
                  <span>$20,000 - $49,999: KSH 2,500</span>
                  <span>$50,000+: KSH 5,000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bid Submission Form / Follow-up */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2DED3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E2DED3] pb-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#1E5B43] font-heading">
                {hasAlreadyBid ? 'Your Bid & Follow-Up' : 'Place a Private Bid on this Request'}
              </h2>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#EBF3EF] text-[#1E5B43]">
                {hasAlreadyBid ? 'Bid Sent · Follow-Up Only' : '1 Bid Per Request'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {hasAlreadyBid
                ? 'Your bid has been sent and the initial bid form is closed. You can only send a follow-up request on this listing.'
                : "Bids live inside the platform only: they never go to the traveler's email or WhatsApp. Bids stay open until the traveler closes the enquiry and remain completely private between operators."}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Bidding Pass Warning if Inactive */}
          {!hasBiddingPass && (
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E2DED3] text-xs text-stone-800 space-y-2">
              <div className="font-bold flex items-center justify-between text-[#1E5B43] font-heading">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Active 24-Hour Bidding Pass Required
                </div>
                <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  KSH 850
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                To place bids on this and all other open requests in your categories, activate your 24-hour Bidding Pass (KSH 850 by M-Pesa). Unlocking contacts is separate and does not require a pass.
              </p>
              {!profileOk ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('operator-dashboard')}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl min-h-[44px] cursor-pointer"
                >
                  Create Profile to Bid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestSimulateBiddingPass}
                  disabled={isProcessingPass}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] disabled:opacity-60 rounded-xl transition-colors inline-flex items-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessingPass ? 'Connecting to M-Pesa...' : 'Pay KSH 850 with M-Pesa →'}
                </button>
              )}
              {passModalError && !passModalOpen && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mt-2">
                  {passModalError}
                </div>
              )}
            </div>
          )}

          {/* Previous Bids by this operator */}
          {hasAlreadyBid && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Your Submitted Bid
              </div>
              {myBids.map((b) => {
                const parsed = parseBidMessages(b);
                return (
                  <div key={b.id} className="p-4 rounded-xl bg-[#EBF3EF]/60 border border-[#1E5B43]/30 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E5B43] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#1E5B43]" />
                        Submitted on {new Date(b.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-bold text-stone-900 font-mono">
                        {b.currency} {b.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="italic text-stone-700 bg-white p-2.5 rounded-lg border border-[#E2DED3] whitespace-pre-line">
                      "{parsed.initialMessage}"
                    </p>
                    {parsed.followUps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-[#1E5B43] uppercase tracking-wider">
                          Follow-Up Messages Sent ({parsed.followUps.length})
                        </div>
                        {parsed.followUps.map((fu) => (
                          <div key={fu.id} className="bg-white p-2.5 rounded-lg border border-[#1E5B43]/25 space-y-0.5">
                            <div className="text-[10px] text-stone-500 font-medium">
                              {new Date(fu.created_at).toString() === 'Invalid Date'
                                ? fu.created_at
                                : new Date(fu.created_at).toLocaleDateString()}
                            </div>
                            <p className="text-stone-800 whitespace-pre-line">{fu.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                      <span>Valid until: <strong>{b.valid_until}</strong></span>
                      <span className="font-bold capitalize text-[#1E5B43]">Status: {b.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Follow-Up Only Mode once a bid has already been sent */}
          {hasAlreadyBid && hasBiddingPass && profileOk && (
            <div className="pt-2 border-t border-[#E2DED3] space-y-4">
              {request.status === 'closed' || request.status === 'expired' ? (
                <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600">
                  This enquiry is {request.status}. Follow-up requests are closed.
                </div>
              ) : !followUpOpen ? (
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-700">
                    <span className="font-bold text-[#1E5B43] block">Bidding closed for this request</span>
                    <span>Need to clarify dates, availability, or add an update? Send a follow-up request.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setFollowUpOpen(true);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors inline-flex items-center justify-center gap-2 min-h-[44px] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Follow-Up Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendFollowUp} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1E5B43] uppercase tracking-wider font-heading">
                      Follow-Up Request
                    </span>
                    <button
                      type="button"
                      onClick={() => setFollowUpOpen(false)}
                      className="text-xs font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    placeholder="Write a follow-up note or clarification for the traveler..."
                    className="w-full text-xs rounded-xl border border-stone-300 p-3 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E5B43]/20 focus:border-[#1E5B43] resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setFollowUpOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-300 bg-white min-h-[44px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Follow-Up
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Place New Bid Form (Supabase RLS verifies active pass; shows "Pay KSH 850 to bid" if missing) */}
          {!hasAlreadyBid && profileOk && (
            <form onSubmit={handleSubmitBid} className="space-y-5">
              <div className="text-xs font-bold text-[#1E5B43] uppercase tracking-wider font-heading">
                Submit Your Bid
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Proposed Price
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={10}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-base font-bold rounded-xl border border-stone-300 px-3.5 py-2.5 bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1E5B43]/20 focus:border-[#1E5B43]"
                  />
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    Traveler target budget: {request.currency} {request.budget.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full text-sm font-semibold rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[44px]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KSH">KSH (KES)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Inclusions ({inclusions.length} items)
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {inclusions.map((inc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#1E5B43] font-bold">✓</span>
                        {inc}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(idx)}
                        className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove inclusion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newInclusionText}
                    onChange={(e) => setNewInclusionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInclusion();
                      }
                    }}
                    placeholder="Add an inclusion (e.g. airport transfer, bush breakfast)..."
                    className="flex-1 text-xs rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-3.5 py-2 text-xs font-bold text-[#1E5B43] bg-[#EBF3EF] hover:bg-[#d8e8e0] rounded-xl cursor-pointer min-h-[40px] whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Validity & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Quote Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={operatorWhatsapp}
                    onChange={(e) => setOperatorWhatsapp(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Phone Call Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={operatorPhone}
                    onChange={(e) => setOperatorPhone(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-300 px-3 py-2.5 bg-white text-stone-900 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Message / Tailored Proposal
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-300 p-3 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E5B43]/20 focus:border-[#1E5B43] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                Submit Bid to Traveler's Dashboard
              </button>
            </form>
          )}
        </div>
      </div>

      {/* MODAL 1: Contact Unlock 2-Minute M-Pesa Slot Hold Modal */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E2DED3] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-[#1E5B43] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block font-heading">
                  M-Pesa STK Push Checkout
                </span>
                <h3 className="text-base font-bold text-white font-heading">
                  Unlock Traveler Contact Details
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseUnlockModal}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Slot Hold Timer */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                  <span className="font-semibold">Slot Held for Prompt:</span>
                </div>
                <span className="font-mono font-bold text-sm text-amber-900">
                  {Math.floor(holdSecondsRemaining / 60)}:
                  {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Price Callout */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Listing:</span>
                  <span className="font-bold text-stone-900 truncate max-w-[220px]">{request.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Traveler Budget:</span>
                  <span className="font-bold text-stone-900">{request.currency} {request.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E2DED3]">
                  <span className="text-stone-600 font-medium">Unlock Fee ({unlockFee.tierLabel}):</span>
                  <span className="text-base font-bold text-[#1E5B43] font-mono">
                    KSH {unlockFee.feeKsh.toLocaleString()}
                  </span>
                </div>
              </div>

              {unlockModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{unlockModalError}</div>
                </div>
              )}

              {unlockRefundNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    Automatic Refund Processed
                  </div>
                  <p>{unlockRefundNotice}</p>
                </div>
              )}

              {unlockModalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>{unlockModalSuccess}</div>
                </div>
              )}

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Safaricom M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="0722000000"
                  className="w-full text-sm font-mono font-bold rounded-xl border border-stone-300 p-2.5 bg-white text-stone-900 min-h-[44px]"
                />
                <span className="text-[11px] text-stone-500 block">
                  A Daraja STK Push prompt will appear on this phone for KSH {unlockFee.feeKsh}.
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingUnlock || holdSecondsRemaining <= 0}
                  onClick={() => handleExecuteUnlock(false, false)}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
                >
                  {isProcessingUnlock ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending M-Pesa Prompt...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Confirm &amp; Pay KSH {unlockFee.feeKsh.toLocaleString()}
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessingUnlock}
                    onClick={() => handleExecuteUnlock(true, false)}
                    className="flex-1 py-2 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg min-h-[36px]"
                    title="Simulate user cancelling M-Pesa PIN prompt"
                  >
                    Simulate Cancelled (Not charged)
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingUnlock}
                    onClick={() => handleExecuteUnlock(false, true)}
                    className="flex-1 py-2 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg min-h-[36px]"
                    title="Simulate payment confirming after hold expired when listing is full"
                  >
                    Simulate Late Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 24-Hour Bidding Pass Payment (KSH 850) */}
      {passModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E2DED3] overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#1E5B43] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block font-heading">
                  24-Hour Bidding Pass
                </span>
                <h3 className="text-base font-bold text-white font-heading">
                  Pay KSH 850 with M-Pesa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPassModalOpen(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-stone-600 leading-relaxed">
                Activate your 24-hour Bidding Pass to place unlimited private bids on all open travel requests in your categories.
              </p>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] flex items-center justify-between">
                <span className="text-stone-600 font-medium">Bidding Pass Duration:</span>
                <span className="font-bold text-[#1E5B43]">24 Hours (Full Access)</span>
              </div>

              {passModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{passModalError}</div>
                </div>
              )}

              {passModalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>{passModalSuccess}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="w-full text-sm font-mono font-bold rounded-xl border border-stone-300 p-2.5 bg-white text-stone-900 min-h-[44px]"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingPass}
                  onClick={() => handlePayBiddingPass(false)}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
                >
                  {isProcessingPass ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing M-Pesa STK...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay KSH 850 with M-Pesa
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isProcessingPass}
                  onClick={() => handlePayBiddingPass(true)}
                  className="w-full py-2 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg min-h-[36px]"
                >
                  Simulate Failed Attempt (Not charged)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
