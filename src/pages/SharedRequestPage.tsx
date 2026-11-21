import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShareRequestButton } from '../components/ShareRequestButton';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Unlock,
  Compass,
  Briefcase,
  ArrowRight,
  Lock,
} from 'lucide-react';

export const SharedRequestPage: React.FC = () => {
  const {
    tabParam: requestId,
    requests,
    currentUser,
    setActiveTab,
    openAuthPrompt,
    getSlotInfo,
    calculateUnlockFee,
    getListingUnlockInfo,
  } = useApp();

  const request = requests.find((r) => r.id === requestId);

  useEffect(() => {
    if (request) {
      document.title = `${request.title} | Elephantastic Safaris`;
    }
  }, [request]);

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-white rounded-2xl border border-desert-atlas/30 p-8 shadow-xs space-y-4">
          <h1 className="text-xl font-bold text-safari-dusk font-display">
            Travel Request Not Found
          </h1>
          <p className="text-xs sm:text-sm text-mountain-hostel/80">
            This shared travel request link may have expired or been removed.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl cursor-pointer min-h-[44px]"
          >
            Explore Elephantastic Safaris
          </button>
        </div>
      </div>
    );
  }

  const slotInfo = getSlotInfo(request.id);
  const unlockFee = calculateUnlockFee(request);
  const unlockInfo = getListingUnlockInfo(request.id);
  const isOpen = request.status === 'open' && !slotInfo.isLocked;

  const categoryLabel =
    request.category === 'safari'
      ? 'Safaris & Guided Tours'
      : request.category === 'hotel'
      ? 'Hotels & Safari Lodges'
      : 'BnBs, Cottages & Villas';

  const handleRespondAsOperator = () => {
    if (!currentUser) {
      openAuthPrompt('operator', 'operator-request-detail', request.id, 'Respond to this Travel Request');
    } else {
      setActiveTab('operator-request-detail', request.id);
    }
  };

  const handlePostSimilar = () => {
    if (!currentUser) {
      openAuthPrompt('traveler', 'traveler-post', request.category, 'Post a Similar Request');
    } else {
      setActiveTab('traveler-post', request.category);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Back & Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="text-xs font-semibold text-mountain-hostel hover:text-safari-dusk flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </button>

        <ShareRequestButton request={request} variant="button" />
      </div>

      {/* Main Shared Request Card */}
      <article className="bg-white rounded-2xl border border-desert-atlas/30 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Category, Origin & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#1E5B43] uppercase tracking-wider">
                {categoryLabel}
              </span>
              <span className="text-stone-400">&middot;</span>
              <span className="text-mountain-hostel/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-desert-atlas-dark" />
                Traveler from <strong>{request.traveler_country}</strong>
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isOpen
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                }`}
              />
              {isOpen ? 'Open for Operator Bids' : 'Closed'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display leading-snug">
            {request.title}
          </h1>

          {/* Key Trip Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-desert-atlas/25 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-mountain-hostel/70 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1E5B43]" />
                Travel Dates
              </div>
              <div className="text-sm font-bold text-safari-dusk font-mono tabular-nums">
                {request.start_date} &rarr; {request.end_date}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-desert-atlas/25 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-mountain-hostel/70 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#1E5B43]" />
                Group Size
              </div>
              <div className="text-sm font-bold text-safari-dusk">
                {request.adults} Adults{request.children > 0 ? `, ${request.children} Children` : ''}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-desert-atlas/25 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-mountain-hostel/70">
                Target Budget
              </div>
              <div className="text-sm font-bold text-[#1E5B43] font-mono tabular-nums">
                {request.currency} {request.budget.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category-Specific Details */}
          {request.safari_details && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-safari-dusk">
                <span>{request.safari_details.days} Days Safari Itinerary</span>
                <span className="capitalize text-mountain-hostel">
                  {request.safari_details.accommodation_level} Tier Accommodation
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {request.safari_details.parks.map((park) => (
                  <span
                    key={park}
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
                  >
                    {park}
                  </span>
                ))}
              </div>
            </div>
          )}

          {request.hotel_details && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-xs">
              <div className="font-bold text-safari-dusk">{request.hotel_details.destination}</div>
              <div className="text-mountain-hostel/80">
                {request.hotel_details.room_type} ({request.hotel_details.rooms} rooms) &middot;{' '}
                <span className="capitalize">{request.hotel_details.meal_plan.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          {request.bnb_details && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-xs">
              <div className="font-bold text-safari-dusk">{request.bnb_details.neighbourhood}</div>
              <div className="text-mountain-hostel/80">
                {request.bnb_details.bedrooms} Bedrooms &middot;{' '}
                <span className="capitalize">{request.bnb_details.place_type.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          {/* Traveler Itinerary Notes */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-mountain-hostel/70">
              Traveler Requirements &amp; Notes
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed bg-[#FAF8F5] p-4 rounded-xl border border-desert-atlas/25">
              "{request.notes}"
            </p>
          </div>

          {/* Live Slot & Contact Unlock Info */}
          <div className="p-4 rounded-xl bg-desert-atlas-light/40 border border-desert-atlas/30 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-safari-dusk">
                Bidding Capacity: {slotInfo.isLocked ? 'Locked (30/30)' : `${slotInfo.left} of ${slotInfo.total} slots left`}
              </span>
              <span className="font-bold text-[#1E5B43] font-mono tabular-nums flex items-center gap-1">
                {unlockInfo.bidsOnly ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Bids only
                  </>
                ) : unlockInfo.isFull ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Contacts full (30/30)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Direct Contact Unlock: KSH {unlockFee.feeKsh.toLocaleString()}
                  </>
                )}
              </span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-desert-atlas/20">
              <div
                className={`h-full ${slotInfo.isLocked ? 'bg-mountain-hostel' : 'bg-highlight-accent'}`}
                style={{ width: `${Math.min(100, (slotInfo.used / slotInfo.total) * 100)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleRespondAsOperator}
              className="flex-1 py-3 px-5 rounded-xl bg-[#1E5B43] hover:bg-[#154331] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>{currentUser ? 'View Full Details, Bid or Unlock Contact' : 'Kenyan Operator? Sign In to Quote'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handlePostSimilar}
              className="py-3 px-5 rounded-xl bg-highlight-accent hover:bg-highlight-accent-hover text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Post a Similar Trip — Free</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
