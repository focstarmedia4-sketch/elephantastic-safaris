import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelRequest, Currency, Operator } from '../../types';
import {
  Compass,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  User,
  Shield,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Edit3,
  XCircle,
  HelpCircle,
  Key,
  Check,
  PhoneCall,
  MessageCircle,
  Mail,
  Star,
  Bell,
  Sliders,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { TravelerProfileModal } from '../../components/TravelerProfileModal';
import { PostRequestModal } from '../../components/PostRequestModal';
import { ShareRequestButton } from '../../components/ShareRequestButton';
import { parseBidMessages } from '../../utils/bidFollowUps';

export const MyRequestsPage: React.FC = () => {
  const {
    currentUser,
    requests,
    bids,
    unlocks,
    operators,
    setActiveTab,
    extendRequestTime,
    closeRequestEarly,
    reopenRequest,
    repostRequest,
    editTravelRequest,
    addRequestUnlocks,
    toggleRequestUnlocks,
    canEditRequest,
    markRequestBooked,
    getTravelerUnlockNotifications,
    getEligibleReviewOperators,
    getListingUnlockInfo,
    reviewOperator,
  } = useApp();

  // Tab filter: all, open, closed, expired
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'expired'>('all');

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [repostData, setRepostData] = useState<TravelRequest | null>(null);

  // Control confirmation modals
  const [unlocksConfirm, setUnlocksConfirm] = useState<{ req: TravelRequest; add: 10 | 20 } | null>(null);
  const [timeConfirm, setTimeConfirm] = useState<{ req: TravelRequest; addDays: 3 | 7 } | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<TravelRequest | null>(null);
  const [reopenConfirm, setReopenConfirm] = useState<TravelRequest | null>(null);
  const [bookingModalReq, setBookingModalReq] = useState<TravelRequest | null>(null);
  const [selectedBookedOperatorId, setSelectedBookedOperatorId] = useState<string>('');
  const [reviewModalData, setReviewModalData] = useState<{ req: TravelRequest; op: Operator } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Edit request state (only allowed with 0 bids and 0 unlocks)
  const [editReq, setEditReq] = useState<TravelRequest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBudget, setEditBudget] = useState<number>(0);
  const [editCurrency, setEditCurrency] = useState<Currency>('USD');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAdults, setEditAdults] = useState(2);
  const [editChildren, setEditChildren] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Server error or success banner
  const [serverNotice, setServerNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Filter requests belonging to current logged-in traveller (strictly from Supabase)
  const travelerId = currentUser?.id || '';
  const myRequests = currentUser
    ? requests.filter((r) => r.traveler_id === currentUser.id)
    : [];

  // Notifications: in-platform alerts when an operator unlocks contact details
  const unlockNotifications = getTravelerUnlockNotifications(travelerId);

  // Summary KPI counts
  const openRequests = myRequests.filter((r) => r.status === 'open');
  const totalBidsReceived = myRequests.reduce((acc, req) => {
    return acc + bids.filter((b) => b.request_id === req.id).length;
  }, 0);
  const totalContactsUnlocked = myRequests.reduce((acc, req) => {
    return acc + getListingUnlockInfo(req.id).paidCount;
  }, 0);

  const displayedRequests = myRequests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  };

  // Action: Add more unlocks (+10 or +20)
  const executeAddUnlocks = async () => {
    if (!unlocksConfirm) return;
    const res = await addRequestUnlocks(unlocksConfirm.req.id, unlocksConfirm.add);
    if (res.success) {
      setServerNotice({
        type: 'success',
        text: `Successfully increased unlock limit from ${unlocksConfirm.req.unlock_limit || 30} to ${(unlocksConfirm.req.unlock_limit || 30) + unlocksConfirm.add}.`,
      });
      setUnlocksConfirm(null);
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to update unlock_limit.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Toggle unlocking (Allow or stop unlocking)
  const handleToggleUnlocking = async (req: TravelRequest) => {
    const nextState = !req.unlocks_enabled;
    const res = await toggleRequestUnlocks(req.id);
    if (res.success) {
      setServerNotice({
        type: 'success',
        text: nextState
          ? 'Contact unlocking allowed. Verified operators can now unlock your contact directly.'
          : 'Contact unlocking stopped. New unlocks are paused; operators can now submit bids only.',
      });
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to update unlocking_enabled.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Extend time (+3 or +7 days)
  const executeExtendTime = async () => {
    if (!timeConfirm) return;
    const res = await extendRequestTime(timeConfirm.req.id, timeConfirm.addDays);
    if (res.success) {
      setServerNotice({
        type: 'success',
        text: `Enquiry extended by +${timeConfirm.addDays} days.`,
      });
      setTimeConfirm(null);
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to extend expires_at.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Close enquiry (stops new bids AND new unlocks)
  const executeCloseEnquiry = async () => {
    if (!closeConfirm) return;
    const res = await closeRequestEarly(closeConfirm.id);
    if (res.success) {
      setServerNotice({
        type: 'success',
        text: 'Enquiry closed. Operators will no longer be able to bid or unlock your contact. You can still see all bids.',
      });
      setCloseConfirm(null);
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to close request.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Reopen request
  const executeReopenRequest = async () => {
    if (!reopenConfirm) return;
    const res = await reopenRequest(reopenConfirm.id);
    if (res.success) {
      setServerNotice({
        type: 'success',
        text: 'Enquiry reopened. Verified operators can resume submitting bids and unlocking contact.',
      });
      setReopenConfirm(null);
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to reopen request.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Edit request (allowed only with 0 bids and 0 unlocks)
  const executeEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReq) return;
    const res = await editTravelRequest(editReq.id, {
      title: editTitle.trim(),
      budget: Number(editBudget),
      currency: 'USD',
      budget_usd: Number(editBudget),
      start_date: editStartDate,
      end_date: editEndDate,
      adults: Number(editAdults),
      children: Number(editChildren),
      notes: editNotes.trim(),
    });
    if (res.success) {
      setServerNotice({ type: 'success', text: 'Listing details updated successfully.' });
      setEditReq(null);
    } else {
      setServerNotice({
        type: 'error',
        text: res.error || 'Failed to update request.',
      });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Re-post expired request
  const handleRepost = async (req: TravelRequest) => {
    setRepostData(req);
    setPostModalOpen(true);
  };

  // Action: Mark as booked
  const executeMarkBooked = async () => {
    if (!bookingModalReq || !selectedBookedOperatorId) return;
    const res = await markRequestBooked(bookingModalReq.id, selectedBookedOperatorId);
    if (res.success) {
      const bookedOp = operators.find((o) => o.id === selectedBookedOperatorId);
      setBookingModalReq(null);
      if (bookedOp) {
        setReviewModalData({ req: bookingModalReq, op: bookedOp });
      }
      setServerNotice({
        type: 'success',
        text: 'Trip marked as booked!',
      });
    } else {
      setServerNotice({ type: 'error', text: res.error || 'Failed to close request.' });
    }
    setTimeout(() => setServerNotice(null), 6000);
  };

  // Action: Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalData) return;
    reviewOperator(
      reviewModalData.op.id,
      reviewModalData.req.id,
      reviewRating,
      reviewComment.trim(),
      reviewModalData.req.title
    );
    setServerNotice({
      type: 'success',
      text: `Review submitted for ${reviewModalData.op.business_name}. Thank you for your feedback!`,
    });
    setTimeout(() => setServerNotice(null), 5000);
    setReviewModalData(null);
    setReviewComment('');
  };

  return (
    <div className="bg-[#F6F4EE] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Server Notification Banner */}
        {serverNotice && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs transition-all ${
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
              className="text-xs font-bold underline hover:opacity-80 ml-4 shrink-0 min-h-[32px] px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Platform In-App Unlock Notifications Banner */}
        {unlockNotifications.length > 0 && (
          <div className="bg-white border border-[#E2DED3] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DED3]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E5B43] uppercase tracking-wide font-['Space_Grotesk']">
                <Bell className="w-4 h-4" />
                <span>Operator Contact Unlocks ({unlockNotifications.length})</span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                In-platform alert · No alerts sent to email or WhatsApp
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {unlockNotifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#F6F4EE] border border-[#E2DED3] text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-stone-900">
                      <strong>{notif.operator_business_name}</strong> unlocked your contact details for "{notif.request_title}".
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Unlocked on {new Date(notif.unlocked_at).toLocaleDateString()} at {new Date(notif.unlocked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {notif.operator_phone && (
                      <a
                        href={`https://wa.me/${notif.operator_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#1E5B43] text-white rounded-lg font-bold hover:bg-[#174834] transition-colors flex items-center gap-1 min-h-[36px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    )}
                    {notif.operator_email && (
                      <a
                        href={`mailto:${notif.operator_email}`}
                        className="px-3 py-1.5 bg-white border border-[#E2DED3] text-stone-800 rounded-lg font-semibold hover:bg-stone-50 transition-colors flex items-center gap-1 min-h-[36px]"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Header & Greeting Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E2DED3]">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-['Space_Grotesk'] text-stone-500">
              <span className="font-bold text-[#1E5B43] uppercase tracking-wider">
                Elephantastic Safaris Marketplace
              </span>
              <span>·</span>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="font-semibold text-stone-700 hover:text-[#1E5B43] underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                View Private Profile
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight font-['Space_Grotesk']">
              {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}` : 'My Travel Requests'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
              Post requests for safaris, hotels, and BnBs. Verified Kenyan operators bid inside the platform or unlock your direct contact details.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setRepostData(null);
                setPostModalOpen(true);
              }}
              className="px-6 py-3 text-sm font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-2xl transition-all shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post a Request
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Open Requests */}
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide font-['Space_Grotesk']">
                Open Requests
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1E5B43]">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-stone-900 font-['Space_Grotesk'] tabular-nums">
              {openRequests.length}
            </div>
            <p className="text-xs text-stone-600">
              Active enquiries accepting operator bids and contact unlocks
            </p>
          </div>

          {/* Card 2: Bids Received */}
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide font-['Space_Grotesk']">
                Bids Received
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-stone-900 font-['Space_Grotesk'] tabular-nums">
              {totalBidsReceived}
            </div>
            <p className="text-xs text-stone-600">
              Private operator proposals across all your travel requests
            </p>
          </div>

          {/* Card 3: Contacts Unlocked */}
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide font-['Space_Grotesk']">
                Contacts Unlocked
              </span>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-stone-900 font-['Space_Grotesk'] tabular-nums">
              {totalContactsUnlocked}
            </div>
            <p className="text-xs text-stone-600">
              Verified operators who unlocked your phone, WhatsApp, and email
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E2DED3] rounded-xl w-fit">
            {(['all', 'open', 'closed', 'expired'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize min-h-[38px] cursor-pointer ${
                  filter === tab
                    ? 'bg-[#1E5B43] text-white shadow-xs'
                    : 'text-stone-700 hover:text-[#1E5B43] hover:bg-[#F6F4EE]'
                }`}
              >
                {tab === 'all' ? 'All Requests' : tab}
              </button>
            ))}
          </div>

          <div className="text-xs text-stone-600 font-medium">
            Showing {displayedRequests.length} {displayedRequests.length === 1 ? 'request' : 'requests'}
          </div>
        </div>

        {/* Request Cards List */}
        {displayedRequests.length === 0 ? (
          /* Empty State: "Post your first request. It's free." */
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#1E5B43]">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-stone-900 font-['Space_Grotesk']">
              {filter === 'all' ? 'No travel requests yet' : `No ${filter} requests`}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Post your dream safari, coastal villa, or boutique hotel stay. It is completely free for travelers, and verified Kenyan operators bid privately.
            </p>
            <button
              onClick={() => {
                setRepostData(null);
                setPostModalOpen(true);
              }}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl shadow-xs transition-colors min-h-[44px] cursor-pointer"
            >
              Post your first request. It's free.
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedRequests.map((req) => {
              const bidsForThis = bids.filter((b) => b.request_id === req.id);
              const paidUnlocksForThis = unlocks.filter((u) => u.request_id === req.id && u.status === 'paid');
              const unlockLimit = req.unlock_limit || req.slot_limit || 30;
              const unlocksPaidCount = paidUnlocksForThis.length;
              const unlocksLeft = Math.max(0, unlockLimit - unlocksPaidCount);
              const unlockPercentage = (unlocksPaidCount / unlockLimit) * 100;
              const isUnlocksFull = unlocksPaidCount >= unlockLimit;
              const isUnlocksNearFull = unlockPercentage >= 80;
              const isUnlocksDisabled = req.unlocks_enabled === false || req.bids_only === true;

              const daysLeft = getDaysLeft(req.expires_at);
              const isExpired = req.status === 'expired' || daysLeft === 'Expired';
              const isClosed = req.status === 'closed';
              const isOpen = req.status === 'open' && !isExpired;

              // Check if editable: allowed ONLY while the request has no bids and no unlocks
              const editCheck = canEditRequest(req.id);
              const eligibleReviewOps = getEligibleReviewOperators(req.id);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E2DED3] p-6 shadow-xs hover:border-stone-400 transition-all space-y-5"
                >
                  {/* Card Top Row: Category, Traveler Country, Dates, Days left, Status tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DED3]">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
                      <span className="font-bold text-[#1E5B43] uppercase tracking-wider font-['Space_Grotesk']">
                        {req.category === 'safari'
                          ? 'Safari & Tours'
                          : req.category === 'hotel'
                          ? 'Hotel & Lodge'
                          : 'BnB & Villa'}
                      </span>
                      <span>·</span>
                      <span>{req.traveler_country}</span>
                      <span>·</span>
                      <span>
                        {req.start_date} to {req.end_date}
                      </span>
                      <span>·</span>
                      <span className="font-medium font-['Space_Grotesk'] text-stone-700">
                        {daysLeft}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border font-['Space_Grotesk'] ${
                          isClosed
                            ? 'bg-stone-100 text-stone-800 border-stone-300'
                            : isExpired
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-[#1E5B43] border-emerald-200'
                        }`}
                      >
                        {isClosed ? 'Closed' : isExpired ? 'Expired' : 'Open'}
                      </span>
                      {req.is_booked && (
                        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 font-['Space_Grotesk']">
                          <CheckCircle className="w-3.5 h-3.5 text-[#1E5B43]" />
                          Booked
                        </span>
                      )}
                      <ShareRequestButton request={req} variant="compact" />
                    </div>
                  </div>

                  {/* Edge State 1: 30 of 30 unlocks -> Contacts full */}
                  {isUnlocksFull && !isUnlocksDisabled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                      <div className="flex items-start sm:items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5 sm:mt-0" />
                        <span>
                          <strong>Contacts full.</strong> Add more unlocks if you want more operators to reach you directly. Bids stay open.
                        </span>
                      </div>
                      {!isClosed && (
                        <button
                          onClick={() => setUnlocksConfirm({ req, add: 10 })}
                          className="px-3.5 py-1.5 bg-amber-800 text-white rounded-lg font-bold hover:bg-amber-900 shrink-0 text-xs min-h-[36px] cursor-pointer"
                        >
                          +10 Unlocks
                        </button>
                      )}
                    </div>
                  )}

                  {/* Edge State 2: 0 bids yet */}
                  {bidsForThis.length === 0 && isOpen && (
                    <div className="bg-[#F6F4EE] border border-[#E2DED3] rounded-xl p-3 flex items-center gap-2 text-xs text-stone-700">
                      <Clock className="w-4 h-4 text-[#1E5B43] shrink-0" />
                      <span>
                        <strong>No bids yet. Operators are being notified.</strong> Check back soon for custom proposals.
                      </span>
                    </div>
                  )}

                  {/* Edge State 3: Expired with no bids */}
                  {isExpired && bidsForThis.length === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                        <span>
                          <strong>Expired. Re-post or extend.</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRepost(req)}
                          className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800 text-xs min-h-[36px] cursor-pointer"
                        >
                          Re-post
                        </button>
                        <button
                          onClick={() => setTimeConfirm({ req, addDays: 7 })}
                          className="px-3 py-1.5 bg-white border border-red-300 text-red-800 rounded-lg font-bold hover:bg-red-50 text-xs min-h-[36px] cursor-pointer"
                        >
                          +7 Days
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Grid: Info + Unlock Progress Bar + View Bids CTA */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-5 space-y-2">
                      <h2
                        onClick={() => setActiveTab('traveler-request-detail', req.id)}
                        className="text-base sm:text-lg font-bold text-stone-900 hover:text-[#1E5B43] cursor-pointer transition-colors font-['Space_Grotesk'] leading-snug"
                      >
                        {req.title}
                      </h2>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {req.notes}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                        <span>
                          Group: {req.adults} Adults {req.children > 0 ? `, ${req.children} Children` : ''}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-[#1E5B43] font-['Space_Grotesk']">
                          Budget: {req.currency} {req.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Unlocks */}
                    <div className="lg:col-span-4 bg-[#F6F4EE] p-4 rounded-xl border border-[#E2DED3] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                        <span className="font-['Space_Grotesk']">Direct Contact Unlocks</span>
                        {isUnlocksDisabled ? (
                          <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-bold font-['Space_Grotesk'] text-[11px]">
                            Bids only
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums text-stone-700">
                            {unlocksLeft} of {unlockLimit} unlocks left
                          </span>
                        )}
                      </div>

                      {/* Unlock Progress Bar: turns amber at 80% or more, shows Contacts full at 100% */}
                      {isUnlocksDisabled ? (
                        <div className="p-2 rounded-lg bg-white border border-[#E2DED3] text-center text-xs text-stone-600 font-medium">
                          Unlocking is turned off for this request (Bids only).
                        </div>
                      ) : (
                        <>
                          <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
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
                          <div className="flex items-center justify-between text-[11px] text-stone-600 font-mono tabular-nums">
                            <span>{unlocksPaidCount} unlocked</span>
                            {unlockPercentage >= 100 ? (
                              <span className="text-amber-800 font-bold font-['Space_Grotesk'] uppercase tracking-wider">
                                Contacts full
                              </span>
                            ) : (
                              <span>{Math.round(unlockPercentage)}% capacity</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* View Bids Button */}
                    <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-between gap-3 h-full">
                      <div className="text-xs text-stone-600 lg:text-right w-full">
                        <div className="font-semibold text-stone-900 font-['Space_Grotesk']">
                          {bidsForThis.length} {bidsForThis.length === 1 ? 'Bid Received' : 'Bids Received'}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {unlocksPaidCount} contacts unlocked
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('traveler-request-detail', req.id)}
                        className="w-full px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                      >
                        <span>View bids</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Operator Bids & Follow-Up Messages Section */}
                  {bidsForThis.length > 0 && (
                    <div className="pt-4 border-t border-[#E2DED3] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1E5B43] uppercase tracking-wider font-['Space_Grotesk']">
                          <MessageSquare className="w-4 h-4" />
                          <span>
                            Operator Bids &amp; Follow-Up Messages ({bidsForThis.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('traveler-request-detail', req.id)}
                          className="text-xs font-bold text-[#1E5B43] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Compare all bids &amp; inclusions</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bidsForThis.map((bid) => {
                          const parsed = parseBidMessages(bid);
                          const amount = bid.amount || bid.price;

                          return (
                            <div
                              key={bid.id}
                              className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] space-y-2.5 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-stone-900 font-['Space_Grotesk'] flex items-center gap-1.5">
                                    <span>{bid.operator_business_name}</span>
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                                  </div>
                                  <div className="text-[11px] text-stone-500">
                                    Quoted {new Date(bid.created_at).toLocaleDateString()} · Valid until {bid.valid_until}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-bold text-sm text-[#1E5B43] font-['Space_Grotesk'] tabular-nums">
                                    {bid.currency} {amount.toLocaleString()}
                                  </div>
                                  {bid.status === 'shortlisted' && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-[#1E5B43]">
                                      Shortlisted
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-stone-700 leading-relaxed bg-white p-2.5 rounded-lg border border-[#E2DED3] line-clamp-3 whitespace-pre-line">
                                {parsed.initialMessage}
                              </p>

                              {parsed.followUps.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                                  <div className="text-[11px] font-bold text-[#1E5B43] uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Follow-Up Messages ({parsed.followUps.length})</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {parsed.followUps.map((fu) => {
                                      const parsedDate = new Date(fu.created_at);
                                      const dateText = Number.isNaN(parsedDate.getTime())
                                        ? fu.created_at
                                        : parsedDate.toLocaleDateString();
                                      return (
                                        <div
                                          key={fu.id}
                                          className="bg-white p-2 rounded border border-emerald-200/80 space-y-0.5"
                                        >
                                          <div className="text-[10px] font-medium text-stone-500">
                                            {dateText}
                                          </div>
                                          <p className="text-stone-800 whitespace-pre-line">
                                            {fu.message}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {bid.operator_whatsapp && (
                                    <a
                                      href={`https://wa.me/${bid.operator_whatsapp.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded bg-[#1E5B43] text-white font-semibold hover:bg-[#174834] transition-colors inline-flex items-center gap-1 text-[11px]"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                  {bid.operator_email && (
                                    <a
                                      href={`mailto:${bid.operator_email}`}
                                      className="px-2.5 py-1 rounded bg-white border border-[#E2DED3] text-stone-700 font-semibold hover:bg-stone-50 transition-colors inline-flex items-center gap-1 text-[11px]"
                                    >
                                      <Mail className="w-3 h-3 text-[#1E5B43]" />
                                      <span>Email</span>
                                    </a>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('traveler-request-detail', req.id)}
                                  className="text-[11px] font-bold text-[#1E5B43] hover:underline cursor-pointer"
                                >
                                  View full bid &rarr;
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CONTROLS (only the traveler who posted can use them; enforce on the server) */}
                  <div className="pt-3 border-t border-[#E2DED3] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-['Space_Grotesk']">
                      Traveler Controls:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Control 1: Add more unlocks (+10 or +20) */}
                      {!isClosed && (
                        <div className="flex items-center gap-1 bg-[#F6F4EE] p-1 rounded-lg border border-[#E2DED3]">
                          <span className="text-[11px] px-1 font-medium text-stone-700">Add unlocks:</span>
                          <button
                            onClick={() => setUnlocksConfirm({ req, add: 10 })}
                            disabled={!isUnlocksNearFull}
                            title={
                              isUnlocksNearFull
                                ? 'Add +10 unlocks (confirmation: 30 to 40)'
                                : 'Available when unlocks are full or nearly full (80%+)'
                            }
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#1E5B43] disabled:opacity-40 disabled:hover:bg-white font-bold rounded border border-[#E2DED3] text-[11px] min-h-[32px] cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => setUnlocksConfirm({ req, add: 20 })}
                            disabled={!isUnlocksNearFull}
                            title={
                              isUnlocksNearFull
                                ? 'Add +20 unlocks'
                                : 'Available when unlocks are full or nearly full (80%+)'
                            }
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#1E5B43] disabled:opacity-40 disabled:hover:bg-white font-bold rounded border border-[#E2DED3] text-[11px] min-h-[32px] cursor-pointer"
                          >
                            +20
                          </button>
                        </div>
                      )}

                      {/* Control 2: Allow or stop unlocking (switch) */}
                      {!isClosed && (
                        <button
                          onClick={() => handleToggleUnlocking(req)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 min-h-[36px] cursor-pointer ${
                            req.unlocks_enabled !== false
                              ? 'bg-white border-[#E2DED3] text-stone-700 hover:text-stone-900'
                              : 'bg-amber-100 border-amber-300 text-amber-900'
                          }`}
                          title="Switch that stops new unlocks without affecting bids or contacts already unlocked"
                        >
                          <Sliders className="w-3 h-3 text-[#1E5B43]" />
                          <span>{req.unlocks_enabled !== false ? 'Stop Unlocking' : 'Allow Unlocking'}</span>
                        </button>
                      )}

                      {/* Control 3: Extend time */}
                      {!isClosed && (
                        <div className="flex items-center gap-1 bg-[#F6F4EE] p-1 rounded-lg border border-[#E2DED3]">
                          <span className="text-[11px] px-1 font-medium text-stone-700">Extend:</span>
                          <button
                            onClick={() => setTimeConfirm({ req, addDays: 3 })}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#1E5B43] font-bold rounded border border-[#E2DED3] text-[11px] min-h-[32px] cursor-pointer"
                          >
                            +3 Days
                          </button>
                          <button
                            onClick={() => setTimeConfirm({ req, addDays: 7 })}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#1E5B43] font-bold rounded border border-[#E2DED3] text-[11px] min-h-[32px] cursor-pointer"
                          >
                            +7 Days
                          </button>
                        </div>
                      )}

                      {/* Control 4: Close enquiry */}
                      {!isClosed && (
                        <button
                          onClick={() => setCloseConfirm(req)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-red-700 bg-white border border-[#E2DED3] hover:border-red-300 rounded-lg transition-colors min-h-[36px] cursor-pointer"
                        >
                          Close Enquiry
                        </button>
                      )}

                      {/* Reopen enquiry (if closed) */}
                      {isClosed && (
                        <button
                          onClick={() => setReopenConfirm(req)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs min-h-[36px] cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Reopen Enquiry
                        </button>
                      )}

                      {/* Control 5: Re-post for expired requests */}
                      {isExpired && (
                        <button
                          onClick={() => handleRepost(req)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-lg transition-colors flex items-center gap-1 min-h-[36px] cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Re-post Request
                        </button>
                      )}

                      {/* Control 6: Edit request (allowed ONLY while the request has no bids and no unlocks) */}
                      {!isClosed && !isExpired && (
                        <button
                          onClick={() => {
                            if (editCheck.allowed) {
                              setEditReq(req);
                              setEditTitle(req.title);
                              setEditBudget(req.budget);
                              setEditCurrency(req.currency);
                              setEditStartDate(req.start_date);
                              setEditEndDate(req.end_date);
                              setEditAdults(req.adults);
                              setEditChildren(req.children || 0);
                              setEditNotes(req.notes || '');
                            } else {
                              setServerNotice({
                                type: 'error',
                                text: editCheck.reason || 'Edit request is allowed only while the request has no bids and no unlocks.',
                              });
                            }
                          }}
                          disabled={!editCheck.allowed}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 min-h-[36px] ${
                            editCheck.allowed
                              ? 'text-[#1E5B43] hover:text-[#174834] bg-white border border-[#E2DED3] hover:border-[#1E5B43] cursor-pointer'
                              : 'text-stone-400 bg-stone-100 border border-stone-200 cursor-not-allowed'
                          }`}
                          title={
                            editCheck.allowed
                              ? 'Edit request specifications'
                              : editCheck.reason || 'Allowed only while the request has no bids and no unlocks'
                          }
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Request</span>
                        </button>
                      )}

                      {/* Control 7: Mark as Booked / Completed -> Rate & Review */}
                      {!req.is_booked && eligibleReviewOps.length > 0 && (
                        <button
                          onClick={() => {
                            setBookingModalReq(req);
                            setSelectedBookedOperatorId(eligibleReviewOps[0]?.id || '');
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 min-h-[36px] cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-[#1E5B43]" />
                          <span>Mark Booked</span>
                        </button>
                      )}

                      {req.is_booked && eligibleReviewOps.length > 0 && (
                        <button
                          onClick={() => {
                            const bookedOp =
                              operators.find((o) => o.id === req.booked_operator_id) || eligibleReviewOps[0];
                            if (bookedOp) {
                              setReviewModalData({ req, op: bookedOp });
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-[#1E5B43] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 min-h-[36px] cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#1E5B43] text-[#1E5B43]" />
                          <span>Rate &amp; Review Operator</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal 1: Add More Unlocks (+10 or +20) */}
      {unlocksConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
              Add More Unlocks
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Confirm adding <strong>+{unlocksConfirm.add} unlocks</strong> to this request.
              The unlock capacity will increase from{' '}
              <span className="font-mono font-bold text-[#1E5B43]">
                {unlocksConfirm.req.unlock_limit || 30} to {(unlocksConfirm.req.unlock_limit || 30) + unlocksConfirm.add}
              </span>
              . If contacts are full, more verified operators will be allowed to unlock your contact details directly.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
              <button
                onClick={() => setUnlocksConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeAddUnlocks}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
              >
                Confirm ({unlocksConfirm.req.unlock_limit || 30} to {(unlocksConfirm.req.unlock_limit || 30) + unlocksConfirm.add})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 2: Extend Time (+3 or +7 days) */}
      {timeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
              Extend Enquiry Duration
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Confirm extending enquiry duration by <strong>+{timeConfirm.addDays} days</strong>.
              Operators will have more time to review specifications and submit custom bids.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
              <button
                onClick={() => setTimeConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-100 min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeExtendTime}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl min-h-[44px] cursor-pointer"
              >
                Confirm +{timeConfirm.addDays} Days
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
              After closing, the add-unlocks and extend buttons are disabled. You can reopen this request at any time if your plans change.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
              <button
                onClick={() => setCloseConfirm(null)}
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

      {/* Confirmation Modal 4: Reopen Request */}
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
              Confirm reopening <strong>"{reopenConfirm.title}"</strong>. Operators across Kenya will be able to submit bids and unlock contact details again.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
              <button
                onClick={() => setReopenConfirm(null)}
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

      {/* Mark Booked Modal (Allows picking the booked operator from those who bid/unlocked) */}
      {bookingModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#1E5B43]">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                Mark Request as Booked
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Select which verified operator you booked with for <strong>"{bookingModalReq.title}"</strong>. After marking as booked, you can rate and review them.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-800">
                Booked Operator (from bidders and unlocked contacts)
              </label>
              <select
                value={selectedBookedOperatorId}
                onChange={(e) => setSelectedBookedOperatorId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-[#E2DED3] px-3 py-2.5 bg-[#F6F4EE] text-stone-900 min-h-[44px]"
              >
                {getEligibleReviewOperators(bookingModalReq.id).map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.business_name} ({op.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DED3]">
              <button
                onClick={() => setBookingModalReq(null)}
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
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-2xl border border-[#E2DED3] max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2DED3] pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-['Space_Grotesk']">
                  Review {reviewModalData.op.business_name}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Verified Trip Review for "{reviewModalData.req.title}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalData(null)}
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
                onClick={() => setReviewModalData(null)}
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
      {editReq && (
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
                onClick={() => setEditReq(null)}
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
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Budget
                </label>
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
                onClick={() => setEditReq(null)}
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

      {/* Traveler Profile Modal */}
      <TravelerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Post a Request Side-panel / Modal */}
      <PostRequestModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setRepostData(null);
        }}
        prefillRequest={repostData}
      />
    </div>
  );
};
