import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Share2,
  CheckCircle2,
  Lock,
  Unlock,
  Compass,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  XCircle,
  Check,
  User,
  PhoneCall,
  MessageCircle,
  Mail,
  Edit3,
  Sliders,
  Bell,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { Currency, Operator } from '../../types';
import { ReportModal } from '../../components/ReportModal';
import { parseBidMessages } from '../../utils/bidFollowUps';

export const TravelerRequestDetailPage: React.FC = () => {
  const {
    tabParam: requestId,
    requests,
    getBidsForRequest,
    extendRequestTime,
    closeRequestEarly,
    reopenRequest,
    editTravelRequest,
    addRequestUnlocks,
    toggleRequestUnlocks,
    canEditRequest,
    markRequestBooked,
    shortlistBid,
    declineBid,
    reviewOperator,
    getTravelerUnlockNotifications,
    getEligibleReviewOperators,
    operators,
    unlocks,
    setActiveTab,
    currentUser,
  } = useApp();

  const [reportModalData, setReportModalData] = useState<{ id: string; title: string; type: 'bid' | 'operator' } | null>(null);

  // Sorting state: amount, rating, newest
  const [sortBy, setSortBy] = useState<'amount' | 'rating' | 'newest'>('amount');

  // Filter state: "Hide declined"
  const [hideDeclined, setHideDeclined] = useState<boolean>(false);

  // Controls confirmation states
  const [unlocksConfirm, setUnlocksConfirm] = useState<10 | 20 | null>(null);
  const [timeConfirm, setTimeConfirm] = useState<3 | 7 | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<boolean>(false);
  const [reopenConfirm, setReopenConfirm] = useState<boolean>(false);

  // Booking & Review states
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedBookedOperatorId, setSelectedBookedOperatorId] = useState<string>('');
  const [reviewModalOp, setReviewModalOp] = useState<Operator | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Server error / notice banner
  const [serverNotice, setServerNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Edit modal (allowed ONLY while request has 0 bids and 0 unlocks)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBudget, setEditBudget] = useState(0);
  const [editCurrency, setEditCurrency] = useState<Currency>('USD');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAdults, setEditAdults] = useState(2);
  const [editChildren, setEditChildren] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    return (
      <div className="bg-[#F6F4EE] min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4 bg-white p-8 rounded-2xl border border-[#E2DED3]">
          <h2 className="text-xl font-bold text-stone-900 font-['Space_Grotesk']">Request Not Found</h2>
          <p className="text-xs text-stone-600">The requested travel enquiry does not exist or was removed.</p>
          <button
            onClick={() => setActiveTab('traveler-my-requests')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl cursor-pointer min-h-[44px]"
          >
            Back to My Requests
          </button>
        </div>
      </div>
    );
  }

  const allBids = getBidsForRequest(request.id);
  const paidUnlocks = unlocks.filter((u) => u.request_id === request.id && u.status === 'paid');
  const unlockLimit = request.unlock_limit || request.slot_limit || 30;
  const unlocksPaidCount = paidUnlocks.length;
  const unlocksLeft = Math.max(0, unlockLimit - unlocksPaidCount);
  const unlockPercentage = (unlocksPaidCount / unlockLimit) * 100;
  const isUnlocksFull = unlocksPaidCount >= unlockLimit;
  const isUnlocksNearFull = unlockPercentage >= 80;
  const isUnlocksDisabled = request.unlocks_enabled === false || request.bids_only === true;

  const daysLeft = (() => {
    const diff = new Date(request.expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  })();

  const isExpired = request.status === 'expired' || daysLeft === 'Expired';
  const isClosed = request.status === 'closed';

  // Check edit permission: allowed only while request has no bids and no unlocks
  const editCheck = canEditRequest(request.id);
  const eligibleReviewOperators = getEligibleReviewOperators(request.id);

  // In-platform unlock notifications for this request
  const travelerId = currentUser?.id || request.traveler_id;
  const unlockNotifications = getTravelerUnlockNotifications(travelerId).filter(
    (n) => n.request_id === request.id
  );

  // Filter & Sort Bids
  const filteredBids = allBids.filter((b) => {
    if (hideDeclined && b.status === 'declined') return false;
    return true;
  });

  const sortedBids = [...filteredBids].sort((a, b) => {
    // Keep shortlisted bids up front
    if (a.status === 'shortlisted' && b.status !== 'shortlisted') return -1;
    if (b.status === 'shortlisted' && a.status !== 'shortlisted') return 1;

    if (sortBy === 'amount') {
      const amountA = a.amount || a.price;
      const amountB = b.amount || b.price;
      return amountA - amountB;
    } else if (sortBy === 'rating') {
      return b.operator_rating - a.operator_rating;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Server-authoritative check for control actions
  const verifyServerControl = async (action: string, extra: Record<string, any> = {}): Promise<boolean> => {
    try {
      const res = await fetch('/api/traveler/request-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || request.traveler_id,
          traveler_id: request.traveler_id,
          action,
          request_id: request.id,
          bid_count: allBids.length,
          unlock_count: unlocksPaidCount,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setServerNotice({ type: 'error', text: data.message || 'Action forbidden by server policy.' });
        setTimeout(() => setServerNotice(null), 5000);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const executeAddUnlocks = async (add: 10 | 20) => {
    const ok = await verifyServerControl('add_unlocks', { additional_unlocks: add });
    if (ok) {
      addRequestUnlocks(request.id, add);
      setServerNotice({
        type: 'success',
        text: `Increased unlock capacity from ${unlockLimit} to ${unlockLimit + add}.`,
      });
      setTimeout(() => setServerNotice(null), 5000);
      setUnlocksConfirm(null);
    }
  };

  const handleToggleUnlocking = async () => {
    const nextState = !request.unlocks_enabled;
    const ok = await verifyServerControl('toggle_unlocks', { unlocks_enabled: nextState });
    if (ok) {
      toggleRequestUnlocks(request.id);
      setServerNotice({
        type: 'success',
        text: nextState
          ? 'Contact unlocking allowed. Operators can now unlock your contact.'
          : 'Contact unlocking stopped. New unlocks are paused; operators can bid only.',
      });
      setTimeout(() => setServerNotice(null), 5000);
    }
  };

  const executeExtendTime = async (days: 3 | 7) => {
    const ok = await verifyServerControl('extend_time', { additional_days: days });
    if (ok) {
      extendRequestTime(request.id, days);
      setServerNotice({ type: 'success', text: `Enquiry extended by +${days} days.` });
      setTimeout(() => setServerNotice(null), 5000);
      setTimeConfirm(null);
    }
  };

  const executeCloseEnquiry = async () => {
    const ok = await verifyServerControl('close_enquiry');
    if (ok) {
      closeRequestEarly(request.id, 'Operators will no longer be able to bid or unlock your contact. You can still see all bids.');
      setServerNotice({
        type: 'success',
        text: 'Enquiry closed. Operators will no longer be able to bid or unlock your contact. You can still see all bids.',
      });
      setTimeout(() => setServerNotice(null), 6000);
      setCloseConfirm(false);
    }
  };

  const executeReopenRequest = async () => {
    const ok = await verifyServerControl('reopen_request');
    if (ok) {
      reopenRequest(request.id);
      setServerNotice({ type: 'success', text: 'Enquiry reopened. Operators can resume bidding and unlocking contact.' });
      setTimeout(() => setServerNotice(null), 5000);
      setReopenConfirm(false);
    }
  };

  const openEditModal = () => {
    if (!editCheck.allowed) {
      setServerNotice({
        type: 'error',
        text: editCheck.reason || 'Edit request is allowed only while the request has no bids and no unlocks.',
      });
      return;
    }
    setEditTitle(request.title);
    setEditBudget(request.budget);
    setEditCurrency(request.currency);
    setEditStartDate(request.start_date);
    setEditEndDate(request.end_date);
    setEditAdults(request.adults);
    setEditChildren(request.children || 0);
    setEditNotes(request.notes || '');
    setEditModalOpen(true);
  };

  const executeEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyServerControl('edit_request');
    if (ok) {
      const success = editTravelRequest(request.id, {
        title: editTitle.trim(),
        budget: Number(editBudget),
        currency: editCurrency,
        budget_usd: editCurrency === 'USD' ? Number(editBudget) : Math.round(Number(editBudget) / 130),
        start_date: editStartDate,
        end_date: editEndDate,
        adults: Number(editAdults),
        children: Number(editChildren),
        notes: editNotes.trim(),
      });
      if (success) {
        setServerNotice({ type: 'success', text: 'Listing details updated successfully.' });
        setTimeout(() => setServerNotice(null), 4000);
        setEditModalOpen(false);
      }
    }
  };

  const executeMarkBooked = async () => {
    if (!selectedBookedOperatorId) return;
    const ok = await verifyServerControl('mark_booked', { booked_operator_id: selectedBookedOperatorId });
    if (ok) {
      markRequestBooked(request.id, selectedBookedOperatorId);
      const bookedOp = operators.find((o) => o.id === selectedBookedOperatorId);
      setBookingModalOpen(false);
      if (bookedOp) {
        setReviewModalOp(bookedOp);
      }
      setServerNotice({
        type: 'success',
        text: 'Request marked as booked! You can now rate and review this operator.',
      });
      setTimeout(() => setServerNotice(null), 5000);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOp) return;
    reviewOperator(
      reviewModalOp.id,
      request.id,
      reviewRating,
      reviewComment.trim(),
      request.title
    );
    setServerNotice({
      type: 'success',
      text: `Review submitted for ${reviewModalOp.business_name}. Thank you!`,
    });
    setTimeout(() => setServerNotice(null), 5000);
    setReviewModalOp(null);
    setReviewComment('');
  };

  return (
    <div className="bg-[#F6F4EE] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans text-stone-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Server Notice Banner */}
        {serverNotice && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs ${
              serverNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#1E5B43]'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {serverNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#1E5B43] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
              )}
              <span>{serverNotice.text}</span>
            </div>
            <button
              onClick={() => setServerNotice(null)}
              className="text-xs font-bold underline hover:opacity-80 ml-4 shrink-0 px-2 min-h-[32px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* In-Platform Unlock Notification Banner */}
        {unlockNotifications.length > 0 && (
          <div className="bg-white border border-[#E2DED3] rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E5B43] uppercase tracking-wide font-['Space_Grotesk']">
              <Bell className="w-4 h-4" />
              <span>Contact Unlocked Alert</span>
            </div>
            <div className="space-y-1.5 text-xs text-stone-700">
              {unlockNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F6F4EE] border border-[#E2DED3]"
                >
                  <p>
                    <strong>{notif.operator_business_name}</strong> unlocked your direct contact details on{' '}
                    {new Date(notif.unlocked_at).toLocaleDateString()} at{' '}
                    {new Date(notif.unlocked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {notif.operator_phone && (
                      <a
                        href={`https://wa.me/${notif.operator_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-[#1E5B43] text-white rounded-lg font-bold hover:bg-[#174834] transition-colors text-xs"
                      >
                        WhatsApp
                      </a>
                    )}
                    {notif.operator_phone && (
                      <a
                        href={`tel:${notif.operator_phone}`}
                        className="px-3 py-1 bg-white border border-[#E2DED3] text-stone-800 rounded-lg font-semibold hover:bg-stone-50 transition-colors text-xs"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Breadcrumb & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DED3] pb-4">
          <div>
            <button
              onClick={() => setActiveTab('traveler-my-requests')}
              className="text-xs font-semibold text-stone-600 hover:text-[#1E5B43] flex items-center gap-1 mb-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Requests
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-['Space_Grotesk']">
              <span className="font-bold text-[#1E5B43] uppercase tracking-wider">
                {request.category === 'safari' ? 'Safari & Tours' : request.category === 'hotel' ? 'Hotel & Lodge' : 'BnB & Villa'}
              </span>
              <span>·</span>
              <span>{request.traveler_country}</span>
              <span>·</span>
              <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span className="font-medium text-stone-700">{daysLeft}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-['Space_Grotesk'] mt-1">
              {request.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-xl border font-['Space_Grotesk'] ${
                isClosed
                  ? 'bg-stone-100 text-stone-800 border-stone-300'
                  : isExpired
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-[#1E5B43] border-emerald-200'
              }`}
            >
              {isClosed ? 'Closed' : isExpired ? 'Expired' : 'Open for Bids'}
            </span>

            {request.is_booked && (
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 font-['Space_Grotesk']">
                <CheckCircle className="w-3.5 h-3.5 text-[#1E5B43]" />
                Booked
              </span>
            )}

            {isUnlocksDisabled ? (
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-stone-100 text-stone-800 border border-stone-300 font-['Space_Grotesk']">
                Bids only
              </span>
            ) : (
              <span className="text-xs font-mono tabular-nums font-bold px-3 py-1 rounded-xl bg-white text-stone-800 border border-[#E2DED3]">
                {unlocksLeft} of {unlockLimit} unlocks left
              </span>
            )}
          </div>
        </div>

        {/* Request Details & Slot Management Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Trip Specs */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2DED3] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2DED3] pb-2">
              <h2 className="text-xs font-bold text-[#1E5B43] uppercase tracking-wide font-['Space_Grotesk']">
                Trip Specifications
              </h2>
              {!isClosed && !isExpired && (
                <button
                  onClick={openEditModal}
                  disabled={!editCheck.allowed}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-colors min-h-[36px] ${
                    editCheck.allowed
                      ? 'text-[#1E5B43] bg-emerald-50 hover:bg-emerald-100 border-emerald-200 cursor-pointer'
                      : 'text-stone-400 bg-stone-100 border-stone-200 cursor-not-allowed'
                  }`}
                  title={
                    editCheck.allowed
                      ? 'Edit request specifications'
                      : editCheck.reason || 'Allowed only while the request has no bids and no unlocks'
                  }
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Request</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-stone-500 block font-medium">Dates</span>
                <span className="font-semibold text-stone-900 font-mono">
                  {request.start_date} to {request.end_date}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">Party Size</span>
                <span className="font-semibold text-stone-900">
                  {request.adults} Adults {request.children > 0 ? `· ${request.children} Kids` : ''}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">Budget</span>
                <span className="font-bold text-[#1E5B43] font-['Space_Grotesk'] tabular-nums">
                  {request.currency} {request.budget.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">Origin</span>
                <span className="font-semibold text-stone-900">{request.traveler_country}</span>
              </div>
            </div>

            {request.safari_details && (
              <div className="pt-2 border-t border-[#E2DED3] text-xs space-y-2">
                <div className="text-stone-700 font-semibold font-['Space_Grotesk']">Parks &amp; Activities:</div>
                <div className="flex flex-wrap gap-1.5">
                  {request.safari_details.parks.map((p) => (
                    <span key={p} className="px-2.5 py-0.5 rounded-lg bg-[#F6F4EE] text-stone-800 font-medium border border-[#E2DED3]">
                      {p}
                    </span>
                  ))}
                  {request.safari_details.activities.map((a) => (
                    <span key={a} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-[#1E5B43] font-medium border border-emerald-100">
                      {a}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-stone-600 pt-1">
                  <span>Tier: <strong className="capitalize text-stone-800">{request.safari_details.accommodation_level}</strong></span>
                  <span>Vehicle: <strong className="capitalize text-stone-800">{request.safari_details.vehicle_type.replace('_', ' ')}</strong></span>
                  <span>Airport Pickup: <strong className="text-stone-800">{request.safari_details.airport_pickup ? 'Included' : 'Not Needed'}</strong></span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E2DED3] text-xs">
              <span className="text-stone-500 font-semibold block mb-1">Traveler Notes:</span>
              <p className="text-stone-800 leading-relaxed bg-[#F6F4EE] p-3 rounded-xl border border-[#E2DED3]">
                "{request.notes}"
              </p>
            </div>
          </div>

          {/* Right: Controls & Unlock Progress */}
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wide font-['Space_Grotesk']">
                Unlock Controls &amp; Status
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Only the posting traveler can manage unlocks or close this enquiry.
              </p>
            </div>

            {/* Unlock meter */}
            <div className="space-y-2 p-3.5 bg-[#F6F4EE] rounded-xl border border-[#E2DED3]">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                <span className="font-['Space_Grotesk']">Direct Unlocks</span>
                {isUnlocksDisabled ? (
                  <span className="font-bold text-stone-600">Bids only</span>
                ) : (
                  <span className="font-mono tabular-nums text-[#1E5B43]">
                    {unlocksPaidCount} / {unlockLimit}
                  </span>
                )}
              </div>

              {isUnlocksDisabled ? (
                <p className="text-xs text-stone-600">
                  Unlocking is currently turned off. Operators submit bids only.
                </p>
              ) : (
                <>
                  <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        unlockPercentage >= 100
                          ? 'bg-amber-600'
                          : unlockPercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-[#1E5B43]'
                      }`}
                      style={{ width: `${Math.min(100, unlockPercentage)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-stone-600 flex items-center justify-between font-mono tabular-nums">
                    <span>{unlocksLeft} unlocks left</span>
                    {unlockPercentage >= 100 && (
                      <span className="text-amber-800 font-bold font-['Space_Grotesk'] uppercase tracking-wide">
                        Contacts full
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action buttons if not closed */}
            {!isClosed && (
              <div className="space-y-3 pt-2 text-xs">
                {/* Add more unlocks */}
                <div>
                  <span className="font-bold text-stone-800 block mb-1">Add More Unlocks:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setUnlocksConfirm(10)}
                      disabled={!isUnlocksNearFull}
                      title={isUnlocksNearFull ? 'Add +10 unlocks' : 'Available when unlocks are 80%+ full'}
                      className="px-3 py-2 text-xs font-semibold text-[#1E5B43] bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 border border-emerald-200 rounded-xl min-h-[44px] cursor-pointer"
                    >
                      +10 Unlocks
                    </button>
                    <button
                      onClick={() => setUnlocksConfirm(20)}
                      disabled={!isUnlocksNearFull}
                      title={isUnlocksNearFull ? 'Add +20 unlocks' : 'Available when unlocks are 80%+ full'}
                      className="px-3 py-2 text-xs font-semibold text-[#1E5B43] bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 border border-emerald-200 rounded-xl min-h-[44px] cursor-pointer"
                    >
                      +20 Unlocks
                    </button>
                  </div>
                </div>

                {/* Allow or stop unlocking switch */}
                <div>
                  <button
                    onClick={handleToggleUnlocking}
                    className="w-full py-2.5 px-3 text-xs font-semibold text-stone-800 bg-white border border-[#E2DED3] hover:border-stone-400 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-[#1E5B43]" />
                    <span>{request.unlocks_enabled !== false ? 'Stop Unlocking (Bids Only)' : 'Allow Unlocking'}</span>
                  </button>
                </div>

                {/* Extend time */}
                <div>
                  <span className="font-bold text-stone-800 block mb-1">Extend Time:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTimeConfirm(3)}
                      className="px-3 py-2 text-xs font-semibold text-stone-700 bg-[#F6F4EE] hover:bg-stone-200 border border-[#E2DED3] rounded-xl min-h-[44px] cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      onClick={() => setTimeConfirm(7)}
                      className="px-3 py-2 text-xs font-semibold text-stone-700 bg-[#F6F4EE] hover:bg-stone-200 border border-[#E2DED3] rounded-xl min-h-[44px] cursor-pointer"
                    >
                      +7 Days
                    </button>
                  </div>
                </div>

                {/* Close enquiry */}
                <div className="pt-2">
                  <button
                    onClick={() => setCloseConfirm(true)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-stone-300 rounded-xl transition-colors min-h-[44px] cursor-pointer"
                  >
                    Close Enquiry
                  </button>
                </div>
              </div>
            )}

            {/* Closed State Banner */}
            {isClosed && (
              <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 font-['Space_Grotesk']">Enquiry Closed</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 uppercase">
                    Closed
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Operators will no longer be able to bid or unlock your contact. You can still see all bids.
                </p>
                <button
                  onClick={() => setReopenConfirm(true)}
                  className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Reopen Enquiry
                </button>
              </div>
            )}

            {/* Mark Booked / Rate & Review Strip */}
            {eligibleReviewOperators.length > 0 && (
              <div className="pt-2 border-t border-[#E2DED3] space-y-2">
                {!request.is_booked ? (
                  <button
                    onClick={() => {
                      setSelectedBookedOperatorId(eligibleReviewOperators[0]?.id || '');
                      setBookingModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-[#1E5B43]" />
                    <span>Mark Request as Booked</span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#1E5B43]">
                      <span>Trip Booked</span>
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-stone-600">
                      You can rate and review operators who bid or unlocked on this request.
                    </p>
                    <div className="space-y-1 pt-1">
                      {eligibleReviewOperators.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => setReviewModalOp(op)}
                          className="w-full p-2 bg-white rounded-lg border border-emerald-300 text-left flex items-center justify-between text-xs font-bold text-[#1E5B43] hover:bg-emerald-50 cursor-pointer min-h-[36px]"
                        >
                          <span>{op.business_name}</span>
                          <span className="text-[11px] underline">Review &rarr;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bids Section Header with Sort Bar & Hide Declined Filter */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#E2DED3]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-['Space_Grotesk'] flex items-center gap-2">
              Compare Operator Bids ({allBids.length})
            </h2>
            <p className="text-xs text-stone-600">
              Bids are private to the traveler. Operators never see each other's bids. You can compare proposals and contact operators directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter: Hide declined */}
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer bg-white px-3 py-2 rounded-xl border border-[#E2DED3] min-h-[44px]">
              <input
                type="checkbox"
                checked={hideDeclined}
                onChange={(e) => setHideDeclined(e.target.checked)}
                className="w-4 h-4 accent-[#1E5B43] rounded"
              />
              <span>Hide declined</span>
            </label>

            {/* Sort by: Amount, Rating, Newest */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2DED3] min-h-[44px]">
              <span className="text-xs font-semibold text-stone-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold bg-transparent text-stone-900 outline-hidden cursor-pointer"
              >
                <option value="amount">Proposed Amount (Lowest)</option>
                <option value="rating">Rating (Highest)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bids View: Side-by-Side Comparison Grid */}
        {sortedBids.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-12 text-center space-y-3">
            <Clock className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
              {allBids.length === 0 ? 'No bids yet. Operators are being notified.' : 'All bids match current filter.'}
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Verified Kenyan operators are reviewing your request. Custom quotes will appear here side by side as they arrive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {sortedBids.map((bid) => {
              const isShortlisted = bid.status === 'shortlisted';
              const isDeclined = bid.status === 'declined';
              const proposedAmount = bid.amount || bid.price;
              const isBelowBudget = proposedAmount < request.budget;
              const parsed = parseBidMessages(bid);

              return (
                <div
                  key={bid.id}
                  className={`bg-white rounded-2xl border flex flex-col justify-between transition-all shadow-xs ${
                    isShortlisted
                      ? 'border-[#1E5B43] ring-1 ring-[#1E5B43]/30'
                      : isDeclined
                      ? 'border-stone-200 opacity-60 bg-stone-50'
                      : 'border-[#E2DED3] hover:border-stone-400'
                  }`}
                >
                  {/* Card Body */}
                  <div className="p-5 space-y-3.5 border-b border-[#E2DED3]">
                    {/* Header: Business name, Verified badge, rating, proposed amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-stone-900 font-['Space_Grotesk'] leading-snug">
                          {bid.operator_business_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="flex items-center gap-1 text-[#1E5B43] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 font-medium text-stone-800">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {bid.operator_rating} ({bid.operator_review_count})
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-[#1E5B43] font-['Space_Grotesk'] tabular-nums">
                          {bid.currency} {proposedAmount.toLocaleString()}
                        </div>
                        {isBelowBudget && (
                          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 inline-block">
                            {request.currency} {(request.budget - proposedAmount).toLocaleString()} below budget
                          </div>
                        )}
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Valid until {bid.valid_until}
                        </div>
                      </div>
                    </div>

                    {/* Shortlisted or Declined Tags */}
                    {isShortlisted && (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#1E5B43] flex items-center gap-1.5 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-[#1E5B43] text-[#1E5B43]" />
                        Shortlisted by you
                      </div>
                    )}

                    {isDeclined && (
                      <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                        <XCircle className="w-3.5 h-3.5 text-stone-400" />
                        Declined
                      </div>
                    )}

                    {/* Operator Pitch Message */}
                    <div className="text-xs text-stone-800 bg-[#F6F4EE] p-3.5 rounded-xl border border-[#E2DED3] leading-relaxed">
                      <p className="whitespace-pre-line">{parsed.initialMessage}</p>
                    </div>

                    {/* Operator Follow-Up Messages */}
                    {parsed.followUps.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                        <div className="text-[11px] font-bold text-[#1E5B43] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Follow-Up Messages ({parsed.followUps.length})</span>
                        </div>
                        <div className="space-y-2">
                          {parsed.followUps.map((fu) => {
                            const parsedDate = new Date(fu.created_at);
                            const dateText = Number.isNaN(parsedDate.getTime())
                              ? fu.created_at
                              : `${parsedDate.toLocaleDateString()} at ${parsedDate.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`;
                            return (
                              <div
                                key={fu.id}
                                className="p-2.5 rounded-lg bg-white border border-emerald-200/80 space-y-1 text-xs"
                              >
                                <div className="text-[10px] font-semibold text-stone-500">
                                  {dateText}
                                </div>
                                <p className="text-stone-800 whitespace-pre-line leading-relaxed">
                                  {fu.message}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inclusions */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-bold text-stone-900 font-['Space_Grotesk']">
                        Inclusions ({bid.inclusions.length} items):
                      </div>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {bid.inclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#1E5B43] font-bold shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Operator Contact Details (Left by operator when bidding) */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1E5B43] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5" />
                          Operator Contact Details
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">Direct Reach</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 text-xs">
                        {(bid.operator_whatsapp || '+254 722 456 789') && (
                          <a
                            href={`https://wa.me/${(bid.operator_whatsapp || '+254722456789').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-[#1E5B43] hover:bg-emerald-50 transition-colors font-medium min-h-[36px]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>WhatsApp: <strong>{bid.operator_whatsapp || '+254 722 456 789'}</strong></span>
                            </span>
                            <span className="text-[11px] font-bold underline shrink-0">Chat &rarr;</span>
                          </a>
                        )}

                        {(bid.operator_phone || '+254 722 456 789') && (
                          <a
                            href={`tel:${bid.operator_phone || '+254722456789'}`}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-stone-800 hover:bg-stone-50 transition-colors font-medium min-h-[36px]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <PhoneCall className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                              <span>Call: <strong>{bid.operator_phone || '+254 722 456 789'}</strong></span>
                            </span>
                            <span className="text-[11px] font-bold underline text-[#1E5B43] shrink-0">Call &rarr;</span>
                          </a>
                        )}

                        {(bid.operator_email || 'operator@safari-stays.com') && (
                          <a
                            href={`mailto:${bid.operator_email || 'operator@safari-stays.com'}`}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-stone-800 hover:bg-stone-50 transition-colors font-medium min-h-[36px]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                              <span className="truncate">Email: <strong>{bid.operator_email || 'operator@safari-stays.com'}</strong></span>
                            </span>
                            <span className="text-[11px] font-bold underline text-[#1E5B43] shrink-0">Email &rarr;</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Shortlist, Decline, Report, Contact */}
                  <div className="p-4 bg-[#F6F4EE] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isDeclined && (
                        <button
                          onClick={() => shortlistBid(bid.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors min-h-[40px] cursor-pointer ${
                            isShortlisted
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : 'bg-white border-[#E2DED3] text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      )}

                      {!isDeclined && (
                        <button
                          onClick={() => declineBid(bid.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#E2DED3] bg-white text-stone-500 hover:text-red-700 hover:border-red-300 transition-colors min-h-[40px] cursor-pointer"
                          title="Decline this bid"
                        >
                          Decline
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setReportModalData({
                            id: bid.id,
                            title: `Bid by ${bid.operator_business_name}`,
                            type: 'bid',
                          })
                        }
                        className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                        title="Report this bid"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <a
                      href={`https://wa.me/${(bid.operator_whatsapp || bid.operator_phone || '+254722456789').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal 1: Add Unlocks */}
        {unlocksConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                Add More Unlocks
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Confirm adding <strong>+{unlocksConfirm} unlocks</strong> to this enquiry.
                The limit will increase from{' '}
                <span className="font-mono font-bold text-[#1E5B43]">
                  {unlockLimit} to {unlockLimit + unlocksConfirm}
                </span>
                .
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  onClick={() => setUnlocksConfirm(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeAddUnlocks(unlocksConfirm)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Confirm ({unlockLimit} to {unlockLimit + unlocksConfirm})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal 2: Extend Time */}
        {timeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                Extend Enquiry Duration
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Confirm extending bidding duration by <strong>+{timeConfirm} days</strong>.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  onClick={() => setTimeConfirm(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeExtendTime(timeConfirm)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Confirm +{timeConfirm} Days
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal 3: Close Enquiry */}
        {closeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                Close Enquiry
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed bg-[#F6F4EE] p-3.5 rounded-xl border border-[#E2DED3]">
                "Operators will no longer be able to bid or unlock your contact. You can still see all bids."
              </p>
              <p className="text-[11px] text-stone-500">
                After closing, the add-unlocks and extend buttons are disabled.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  onClick={() => setCloseConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeCloseEnquiry}
                  className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl min-h-[44px] cursor-pointer"
                >
                  Confirm Close Enquiry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal 4: Reopen Enquiry */}
        {reopenConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#1E5B43]">
                <Unlock className="w-5 h-5" />
                <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                  Reopen Enquiry
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Confirm reopening this enquiry. Operators across Kenya will be able to submit bids and unlock your contact details again.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  onClick={() => setReopenConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeReopenRequest}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Confirm Reopen Enquiry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mark Booked Modal */}
        {bookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#1E5B43]">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                  Mark Request as Booked
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Select which verified operator you finalized this booking with:
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  Booked Operator
                </label>
                <select
                  value={selectedBookedOperatorId}
                  onChange={(e) => setSelectedBookedOperatorId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-[#E2DED3] px-3 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
                >
                  {eligibleReviewOperators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.business_name} ({op.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeMarkBooked}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rate & Review Modal (Rule: Allow reviews only for operators who bid or unlocked on that request) */}
        {reviewModalOp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E2DED3] pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                    Review {reviewModalOp.business_name}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Verified Trip Review for "{request.title}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOp(null)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-stone-200 text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2 font-mono">{reviewRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Your Review</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience regarding responsiveness, vehicle quality, guiding expertise, and safari itinerary execution..."
                  className="w-full text-xs rounded-xl border border-[#E2DED3] p-3 bg-[#F6F4EE] text-stone-900 leading-relaxed font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  type="button"
                  onClick={() => setReviewModalOp(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Request Modal (Allowed ONLY while request has 0 bids and 0 unlocks) */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <form
              onSubmit={executeEditRequest}
              className="bg-white rounded-2xl border border-[#E2DED3] max-w-lg w-full p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-[#E2DED3] pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                    Edit Request Specifications
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Allowed because this request currently has 0 bids and 0 unlocks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Trip Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#F6F4EE] text-stone-900 font-medium min-h-[44px]"
                />
              </div>

              {/* Budget & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Budget</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#F6F4EE] text-stone-900 font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Currency</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as Currency)}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3 py-2.5 bg-[#F6F4EE] text-stone-900 font-medium min-h-[44px]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="KSH">KSH (KES)</option>
                  </select>
                </div>
              </div>

              {/* Travel Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Party Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Adults</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editAdults}
                    onChange={(e) => setEditAdults(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Children</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editChildren}
                    onChange={(e) => setEditChildren(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Itinerary Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#F6F4EE] text-stone-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Report Modal */}
        {reportModalData && (
          <ReportModal
            isOpen={true}
            onClose={() => setReportModalData(null)}
            targetId={reportModalData.id}
            targetTitle={reportModalData.title}
            targetType={reportModalData.type}
          />
        )}
      </div>
    </div>
  );
};
