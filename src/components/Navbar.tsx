import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, ShieldCheck, Clock, Menu, X, ChevronRight, ChevronDown, LogOut, MessageSquare } from 'lucide-react';
import { LegalModal } from './LegalModal';
import { TravelerProfileModal } from './TravelerProfileModal';
import { TravelerBidsFollowUpsModal } from './TravelerBidsFollowUpsModal';
import { parseBidMessages } from '../utils/bidFollowUps';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentOperator,
    requests,
    bids,
    activeTab,
    setActiveTab,
    isPassActive,
    getPassTimeRemaining,
    logoutUser,
    openAuthPrompt,
  } = useApp();

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bidsInboxOpen, setBidsInboxOpen] = useState(false);

  const passStatus = currentOperator ? getPassTimeRemaining(currentOperator) : null;

  const { travelerBidsCount, travelerFollowUpsCount } = useMemo(() => {
    if (!currentUser || currentUser.role !== 'traveler') {
      return { travelerBidsCount: 0, travelerFollowUpsCount: 0 };
    }
    const myReqs = requests.filter((r) => r.traveler_id === currentUser.id);
    const reqIds = new Set(myReqs.map((r) => r.id));
    const myBids = bids.filter((b) => reqIds.has(b.request_id));
    const followUpCount = myBids.reduce((sum, b) => sum + parseBidMessages(b).followUps.length, 0);
    return { travelerBidsCount: myBids.length, travelerFollowUpsCount: followUpCount };
  }, [currentUser, requests, bids]);

  return (
    <>
      {/* Top Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-safari-dusk text-stone-100 border-b border-safari-dusk-dark shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
          {/* Zone 1: Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            aria-label="Elephantastic Safaris Home"
            className="flex items-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none rounded-xl overflow-hidden"
          >
            <img
              src="https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Elephantastic%20Safaris%20Logo.png"
              alt="Elephantastic Safaris"
              className="h-10 sm:h-11 w-auto object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Zone 2: 4-5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-300">
            {(!currentUser || currentUser.role === 'traveler') && (
              <>
                <button
                  onClick={() => setActiveTab('operator-open-requests')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab.startsWith('operator-open-requests')
                      ? 'text-desert-atlas font-semibold'
                      : 'text-stone-300'
                  }`}
                >
                  Open Traveler Requests
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'home' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab.startsWith('blog') ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  Best Places
                </button>
                <button
                  onClick={() => setActiveTab('how-it-works')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'how-it-works' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  How It Works
                </button>
                {currentUser && (
                  <>
                    <button
                      onClick={() => setActiveTab('traveler-my-requests')}
                      className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                        activeTab.startsWith('traveler-my-requests') || activeTab.startsWith('traveler-request-detail')
                          ? 'text-desert-atlas font-semibold'
                          : ''
                      }`}
                    >
                      My Requests
                    </button>
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 text-stone-300"
                    >
                      Profile
                    </button>
                  </>
                )}
              </>
            )}

            {currentUser?.role === 'operator' && (
              <>
                <button
                  onClick={() => setActiveTab('operator-dashboard')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'operator-dashboard'
                      ? 'text-desert-atlas font-semibold'
                      : ''
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('operator-open-requests')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab.startsWith('operator-open-requests') || activeTab.startsWith('operator-request-detail')
                      ? 'text-desert-atlas font-semibold'
                      : ''
                  }`}
                >
                  Open Requests
                </button>
                <button
                  onClick={() => setActiveTab('operator-my-bids')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'operator-my-bids' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  My Bids
                </button>
                <button
                  onClick={() => setActiveTab('operator-status')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'operator-status' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  Verification Status
                </button>
                <button
                  onClick={() => setActiveTab('operator-pay')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'operator-pay' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  <span>Pay Pass</span>
                  {passStatus && (
                    <span className="text-xs text-desert-atlas font-mono tabular-nums">
                      ({passStatus.active ? passStatus.label : 'Locked'})
                    </span>
                  )}
                </button>
              </>
            )}

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin-verification')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'admin-verification' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  Verification Queue
                </button>
                <button
                  onClick={() => setActiveTab('admin-reports')}
                  className={`hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'admin-reports' ? 'text-desert-atlas font-semibold' : ''
                  }`}
                >
                  Payments &amp; Reports
                </button>
                <button
                  onClick={() => setActiveTab('operator-open-requests')}
                  className="hover:text-desert-atlas transition-colors whitespace-nowrap shrink-0 text-stone-400"
                >
                  Marketplace Feed
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1 primary action + persona quick trigger + mobile Menu dropdown button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser?.role === 'operator' ? (
              <button
                onClick={() => setActiveTab('operator-open-requests')}
                className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-mountain-hostel hover:bg-mountain-hostel-light border border-desert-atlas/30 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                Browse Requests
              </button>
            ) : currentUser?.role === 'admin' ? (
              <button
                onClick={() => setActiveTab('admin-verification')}
                className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-mountain-hostel hover:bg-mountain-hostel-light border border-desert-atlas/30 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                Admin Review
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                {currentUser?.role === 'traveler' && (
                  <button
                    type="button"
                    onClick={() => setBidsInboxOpen(true)}
                    className="px-3 py-2 text-xs font-semibold text-stone-100 bg-safari-dusk-dark/80 hover:bg-safari-dusk-dark border border-desert-atlas/40 hover:border-desert-atlas rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer flex items-center gap-1.5"
                    title="View operator bids and follow-up messages"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-desert-atlas shrink-0" />
                    <span className="hidden md:inline">Bids &amp; Follow-Ups</span>
                    {(travelerBidsCount > 0 || travelerFollowUpsCount > 0) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono rounded bg-highlight-accent text-white tabular-nums">
                        {travelerFollowUpsCount > 0
                          ? `${travelerBidsCount} · ${travelerFollowUpsCount} msg`
                          : travelerBidsCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!currentUser) {
                      openAuthPrompt('traveler', 'traveler-post', undefined, 'Post a Request');
                    } else {
                      setActiveTab('traveler-post');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-all whitespace-nowrap shrink-0 shadow-sm min-h-[44px] cursor-pointer flex items-center justify-center hover:shadow-md"
                >
                  Post a Request
                </button>
              </div>
            )}

            {/* Targeted button:nth-of-type(2): Log Out when user is logged in, Log In when user is logged out */}
            {currentUser ? (
              <button
                onClick={logoutUser}
                className="hidden sm:flex px-2.5 py-1.5 rounded-lg border border-red-500/40 hover:border-red-400 bg-safari-dusk-dark/80 hover:bg-red-950/40 text-xs text-stone-200 transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 group min-h-[40px]"
                title={`Logged in as ${currentUser.name}. Click to Log Out`}
              >
                <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 shrink-0" />
                <span className="font-semibold text-stone-200">Log Out</span>
                <span className="text-[10px] text-desert-atlas truncate max-w-[80px] hidden md:inline">
                  ({currentUser.name.split(' ')[0]})
                </span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="hidden sm:flex px-3 py-1.5 rounded-lg border border-desert-atlas/40 hover:border-desert-atlas bg-safari-dusk-dark/80 hover:bg-safari-dusk-dark text-xs text-desert-atlas transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[40px]"
                title="Log In or Sign Up"
              >
                <UserCheck className="w-3.5 h-3.5 text-desert-atlas shrink-0" />
                <span className="font-semibold text-desert-atlas">Log In / Sign Up</span>
              </button>
            )}

            {/* Mobile-only Menu dropdown button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-desert-atlas/40 hover:border-desert-atlas bg-safari-dusk-dark/90 text-xs font-bold text-stone-100 hover:text-white transition-colors min-h-[44px] cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-desert-atlas shrink-0" />
              ) : (
                <Menu className="w-4 h-4 text-desert-atlas shrink-0" />
              )}
              <span>Menu</span>
              {currentUser?.role === 'traveler' &&
                (travelerBidsCount > 0 || travelerFollowUpsCount > 0) &&
                !mobileMenuOpen && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono rounded bg-highlight-accent text-white tabular-nums sm:hidden">
                    {travelerBidsCount}
                  </span>
                )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-desert-atlas transition-transform duration-200 ${
                  mobileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-4 border-t border-safari-dusk-dark bg-safari-dusk space-y-2">
            <div className="text-xs font-medium text-desert-atlas uppercase tracking-wider py-1">
              {currentUser ? `Active View: ${currentUser.role}` : 'Browsing as Guest'}
            </div>
            {(!currentUser || currentUser.role === 'traveler') && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('operator-open-requests');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Open Traveler Requests
                </button>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Discover
                </button>
                <button
                  onClick={() => {
                    setActiveTab('blog');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-desert-atlas font-semibold"
                >
                  Best Places to Visit (Blog)
                </button>
                <button
                  onClick={() => {
                    setActiveTab('how-it-works');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  How It Works
                </button>
                {currentUser && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('traveler-my-requests');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                    >
                      My Requests
                    </button>
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                    >
                      Private Profile
                    </button>
                  </>
                )}
                {currentUser?.role === 'traveler' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBidsInboxOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-sm text-desert-atlas font-semibold flex items-center justify-between"
                  >
                    <span>Bids &amp; Follow-Up Messages</span>
                    {(travelerBidsCount > 0 || travelerFollowUpsCount > 0) && (
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-highlight-accent text-white">
                        {travelerBidsCount} bids · {travelerFollowUpsCount} follow-ups
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!currentUser) {
                      openAuthPrompt('traveler', 'traveler-post', undefined, 'Post a Request');
                    } else {
                      setActiveTab('traveler-post');
                    }
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl bg-highlight-accent text-white text-sm font-bold min-h-[44px]"
                >
                  + Post a Request
                </button>
              </>
            )}

            {currentUser?.role === 'operator' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('operator-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2 text-sm ${
                    activeTab === 'operator-dashboard' ? 'text-desert-atlas font-semibold' : 'text-stone-200 hover:text-desert-atlas'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab('operator-open-requests');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Open Requests
                </button>
                <button
                  onClick={() => {
                    setActiveTab('operator-my-bids');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  My Bids
                </button>
                <button
                  onClick={() => {
                    setActiveTab('operator-status');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Verification Status
                </button>
                <button
                  onClick={() => {
                    setActiveTab('operator-pay');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-highlight-accent font-semibold"
                >
                  Buy Operator Access Pass
                </button>
              </>
            )}

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('admin-verification');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Verification Queue
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-reports');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-sm text-stone-200 hover:text-desert-atlas"
                >
                  Payments &amp; Reports
                </button>
              </>
            )}

            {currentUser ? (
              <div className="pt-2">
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 text-xs bg-red-950/40 text-red-300 border border-red-500/30 rounded-lg font-medium text-left flex items-center justify-between"
                >
                  <span>Log Out ({currentUser.name})</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 text-xs bg-mountain-hostel text-white border border-desert-atlas/30 rounded-lg font-medium text-left flex items-center justify-between"
                >
                  <span>Log In / Sign Up</span>
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        )}
      </header>

      {/* Legal & Terms Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Traveler Profile Modal */}
      <TravelerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Traveler Bids & Follow-Up Messages Modal */}
      <TravelerBidsFollowUpsModal
        isOpen={bidsInboxOpen}
        onClose={() => setBidsInboxOpen(false)}
      />
    </>
  );
};
