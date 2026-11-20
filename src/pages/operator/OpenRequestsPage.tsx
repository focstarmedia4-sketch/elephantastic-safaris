import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelCategory } from '../../types';
import { Compass, Lock, Unlock, CreditCard, Clock, ArrowRight, Filter, ShieldAlert, Bookmark as BookmarkIcon } from 'lucide-react';

export const OpenRequestsPage: React.FC = () => {
  const {
    requests,
    currentOperator,
    currentUser,
    isPassActive,
    getPassTimeRemaining,
    getSlotInfo,
    setActiveTab,
    tabParam,
    toggleBookmark,
    isBookmarked,
    calculateUnlockFee,
    getListingUnlockInfo,
    isContactUnlocked,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>(tabParam || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'locked'>('all');

  const hasActivePass = isPassActive(currentOperator);
  const passInfo = currentOperator ? getPassTimeRemaining(currentOperator) : null;

  const filteredRequests = requests.filter((req) => {
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    if (statusFilter === 'open' && req.status !== 'open') return false;
    if (statusFilter === 'locked' && req.status !== 'locked') return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Access Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
            Live Reverse Marketplace Feed
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
            Open Traveler Requests
          </h1>
          <p className="text-xs sm:text-sm text-mountain-hostel/80">
            Browse requests submitted by international tourists. Submit your quote to secure direct bookings.
          </p>
        </div>

        {/* Pass Status Card */}
        {currentOperator && (
          <div className="self-start sm:self-auto">
            {hasActivePass ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-mountain-hostel text-white border border-desert-atlas/40 shadow-xs">
                <Unlock className="w-4 h-4 text-desert-atlas" />
                <div className="text-xs">
                  <div className="font-bold text-white">24h Pass Active</div>
                  <div className="text-desert-atlas font-mono tabular-nums">
                    {passInfo?.label}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-desert-atlas-light border border-desert-atlas/40 text-safari-dusk shadow-xs">
                <Lock className="w-4 h-4 text-highlight-accent" />
                <div className="text-xs">
                  <div className="font-bold text-safari-dusk">Pass Inactive / Expired</div>
                  <button
                    onClick={() => setActiveTab('operator-dashboard')}
                    className="text-highlight-accent underline font-semibold hover:text-highlight-accent-hover"
                  >
                    Get 24h Pass (KSH 850 with M-Pesa) &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Access Gate Alert if locked */}
      {!hasActivePass && (
        <div className="p-4 rounded-xl bg-safari-dusk text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-safari-dusk-light/30">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Unlock className="w-4 h-4 text-desert-atlas" />
              All Trip Details &amp; Budgets 100% Visible
            </div>
            <p className="text-xs text-desert-atlas-light/80">
              All traveler request details, dates, party sizes, and budgets are visible. Reach travelers by bidding on the platform (KSH 850 24h pass) or unlocking direct contacts individually.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('operator-dashboard')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
          >
            <CreditCard className="w-4 h-4" />
            Operator Dashboard
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        {/* Category filter */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-lg">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'safari', label: 'Safaris & Tours' },
            { id: 'hotel', label: 'Hotels & Lodges' },
            { id: 'bnb', label: 'BnBs & Cottages' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="text-stone-500">Filter status:</span>
          {(['all', 'open', 'locked'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                statusFilter === s
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => {
          const slotInfo = getSlotInfo(req.id);
          const isLocked = slotInfo.isLocked;
          const unlockFee = calculateUnlockFee(req);
          const unlockInfo = getListingUnlockInfo(req.id);
          const alreadyUnlocked = isContactUnlocked(req.id, currentOperator?.id || '');

          return (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:border-stone-300 hover:shadow-xs transition-all"
            >
              <div className="p-5 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-desert-atlas-dark uppercase tracking-wider">
                      {req.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('operator-request-detail', req.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        req.status === 'open' && !isLocked
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                      }`}
                      title={req.status === 'open' && !isLocked ? 'Request is Open for bids' : 'Request is Closed'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          req.status === 'open' && !isLocked ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                        }`}
                      />
                      <span>{req.status === 'open' && !isLocked ? 'Open' : 'Closed'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">
                      {req.start_date} &rarr; {req.end_date}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(req.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isBookmarked(req.id)
                          ? 'border-[#1E5B43] bg-[#EAE7DD] text-[#1E5B43]'
                          : 'border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-300'
                      }`}
                      title={isBookmarked(req.id) ? 'Remove bookmark' : 'Bookmark request'}
                    >
                      <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked(req.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-stone-900 leading-snug">
                  {req.title}
                </h3>

                <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2">
                  <span>
                    <strong className="text-stone-900">{req.traveler_name || 'Traveler'}</strong> from{' '}
                    <strong className="text-stone-800">{req.traveler_country}</strong>
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{req.adults} Adults {req.children > 0 ? `· ${req.children} Kids` : ''}</span>
                </div>

                {/* Specific category requirements fully visible */}
                {req.safari_details && (
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-xs space-y-1.5 text-stone-700">
                    <div className="flex items-center justify-between font-medium">
                      <span>{req.safari_details.days} Days Safari</span>
                      <span className="capitalize text-stone-600">{req.safari_details.accommodation_level} Tier</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {req.safari_details.parks.map((park) => (
                        <span key={park} className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[11px] font-medium text-stone-700">
                          {park}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {req.hotel_details && (
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-xs space-y-1 text-stone-700">
                    <div className="font-semibold text-stone-800">{req.hotel_details.destination}</div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>{req.hotel_details.room_type} ({req.hotel_details.rooms} rooms)</span>
                      <span className="capitalize">{req.hotel_details.meal_plan.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                )}

                {req.bnb_details && (
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-xs space-y-1 text-stone-700">
                    <div className="font-semibold text-stone-800">{req.bnb_details.neighbourhood}</div>
                    <div className="text-stone-600">
                      {req.bnb_details.bedrooms} Bedrooms &bull; <span className="capitalize">{req.bnb_details.place_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                )}

                {/* All traveler notes fully visible without any blur or restriction */}
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Traveler Itinerary Notes:
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed bg-[#FAF9F5] p-2.5 rounded-lg border border-stone-200/60">
                    "{req.notes}"
                  </p>
                </div>

                {/* Traveler direct contact info status: dynamic unlock fee based on budget */}
                <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E2DED3] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-stone-800">
                    {alreadyUnlocked ? (
                      <Unlock className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    )}
                    <span className="font-semibold">Direct Contacts:</span>
                    {alreadyUnlocked ? (
                      <span className="text-[#1E5B43] font-bold text-[11px]">Unlocked (Verified Access)</span>
                    ) : unlockInfo.bidsOnly ? (
                      <span className="text-stone-600 text-[11px]">Bids only (Unlocking turned off)</span>
                    ) : unlockInfo.isFull ? (
                      <span className="text-amber-800 text-[11px]">Contacts full (30/30)</span>
                    ) : (
                      <span className="text-amber-900 font-bold text-[11px]">
                        Unlock: KSH {unlockFee.feeKsh.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 whitespace-nowrap">
                    {alreadyUnlocked
                      ? 'Available in detail'
                      : unlockInfo.bidsOnly
                      ? 'Bid directly'
                      : `${unlockInfo.remaining} of ${unlockInfo.total} unlocks left`}
                  </span>
                </div>

                {/* Slot Capacity indicator */}
                <div className="pt-2 space-y-1.5 border-t border-desert-atlas/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mountain-hostel/70 font-medium">Slots Availability:</span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        isLocked ? 'text-red-700' : 'text-safari-dusk'
                      }`}
                    >
                      {isLocked ? '0 of 30 left (Locked)' : `${slotInfo.left} of ${slotInfo.total} left`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-desert-atlas-light rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isLocked ? 'bg-mountain-hostel' : 'bg-highlight-accent'}`}
                      style={{
                        width: `${Math.min(100, (slotInfo.used / slotInfo.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-mountain-hostel/70">
                    <span>{slotInfo.used} bids submitted</span>
                    <span className="font-bold text-safari-dusk font-mono tabular-nums">
                      Target Budget: {req.currency} {req.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-desert-atlas-light/30 border-t border-desert-atlas/15 flex items-center justify-between">
                {isLocked ? (
                  <span className="text-xs text-mountain-hostel/60 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-mountain-hostel/50" />
                    Slot cap reached (30/30)
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveTab('operator-request-detail', req.id)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                  >
                    <span>{alreadyUnlocked ? 'View Details & Contact' : 'View Details, Bid & Unlock'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
